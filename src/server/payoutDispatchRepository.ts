import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  type Currency,
  type Money,
  type PayoutProvider
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';
import { PayoutRepository } from './payoutRepository';

export interface PayoutDispatchResult {
  status: 'DISPATCHED' | 'PAID' | 'ALREADY_PROCESSING' | 'RETRYABLE' | 'DUPLICATE';
  payoutId: string;
  providerPayoutId?: string;
  reason?: string;
}

export interface PayoutReconciliationResult {
  checked: number;
  settled: number;
  processing: number;
  failures: number;
}

export type PayoutDestinationResolver = (input: {
  partnerId: string;
  payoutMethodId: string;
  destinationCiphertext: Buffer;
}) => Promise<string>;

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_PAYOUT_DISPATCH_VALUE:${field}`);
  return value.trim();
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_PAYOUT_DISPATCH_VALUE:${field}`);
  return date.toISOString();
}

function amount(value: unknown, field: string): bigint {
  try {
    const result = BigInt(String(value));
    if (result <= 0n) throw new Error();
    return result;
  } catch {
    throw new Error(`INVALID_PAYOUT_DISPATCH_VALUE:${field}`);
  }
}

function money(row: Record<string, unknown>): Money {
  return {
    amountMinor: amount(row.requested_amount_minor, 'requested_amount_minor'),
    currency: requiredString(row.currency, 'currency') as Currency
  };
}

function ciphertext(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string' && value.length > 0) return Buffer.from(value, 'base64');
  throw new Error('INVALID_PAYOUT_DISPATCH_VALUE:destination_ciphertext');
}

async function markAttempt(client: PoolClient, payoutId: string, requestId: string, responseStatus: string, responsePayload: Record<string, unknown>, at: string): Promise<void> {
  await client.query(`
    UPDATE payout_attempts
    SET response_status = $2, response_payload = $3::jsonb
    WHERE payout_request_id = $1 AND request_id = $4
  `, [payoutId, responseStatus, JSON.stringify(responsePayload), requestId]);
  await client.query(`
    INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
    VALUES ($1, 'PAYOUT', $2, $3::jsonb, $4)
  `, [`PAYOUT_${responseStatus}`, payoutId, JSON.stringify(responsePayload), at]);
}

/**
 * Durable provider-dispatch boundary. The provider is injected by the
 * deployment; the disconnected adapter must never be replaced by a fake
 * implementation in production. Funds are already locked by PayoutRepository
 * before this class calls an external provider.
 */
export class PayoutDispatchRepository {
  private readonly payouts: PayoutRepository;

  constructor(private readonly database: PostgresBoundary, payouts?: PayoutRepository) {
    this.payouts = payouts ?? new PayoutRepository(database);
  }

  async dispatch(input: {
    payoutId: string;
    provider: string;
    adapter: PayoutProvider;
    resolveDestination: PayoutDestinationResolver;
    at: string;
    leaseSeconds?: number;
  }): Promise<PayoutDispatchResult> {
    const payoutId = requiredString(input.payoutId, 'payout_id');
    const provider = requiredString(input.provider, 'provider');
    const at = requiredIso(input.at, 'dispatch_at');
    const leaseSeconds = input.leaseSeconds ?? 300;
    if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 3600) throw new Error('INVALID_PAYOUT_DISPATCH_VALUE:lease_seconds');
    if (!input.adapter.connected) throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED');

    const claim = await this.database.withTransaction(async (client) => {
      const result = await client.query(`
        SELECT pr.id, pr.partner_id, pr.payout_method_id, pr.requested_amount_minor, pr.currency,
               pr.status, pr.provider_payout_id, pm.provider AS method_provider,
               pm.destination_ciphertext
        FROM payout_requests pr
        JOIN payout_methods pm ON pm.id = pr.payout_method_id
        WHERE pr.id = $1
        FOR UPDATE
      `, [payoutId]);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) throw new Error('PAYOUT_NOT_FOUND');
      if (row.method_provider !== provider) throw new Error('PAYOUT_PROVIDER_MISMATCH');
      if (row.status === 'PAID') return { kind: 'DUPLICATE' as const, payoutId, providerPayoutId: row.provider_payout_id ? String(row.provider_payout_id) : undefined };
      if (row.status === 'FAILED' || row.status === 'REJECTED') return { kind: 'REJECTED' as const, payoutId, reason: String(row.status) };
      if (row.provider_payout_id) return { kind: 'ALREADY_PROCESSING' as const, payoutId, providerPayoutId: String(row.provider_payout_id) };
      if (row.status !== 'PAYOUT_HELD' && row.status !== 'PROCESSING') throw new Error('PAYOUT_STATE_CONFLICT');

      const latest = await client.query(`
        SELECT request_id, response_status, created_at
        FROM payout_attempts
        WHERE payout_request_id = $1 AND request_id LIKE 'dispatch:%'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        FOR UPDATE
      `, [payoutId]);
      const latestAttempt = latest.rows[0] as Record<string, unknown> | undefined;
      const ageMs = latestAttempt ? new Date(String(latestAttempt.created_at)).getTime() - new Date(at).getTime() : -1;
      const leaseActive = latestAttempt && Number.isFinite(ageMs) && ageMs > -leaseSeconds * 1000;
      if (leaseActive && latestAttempt.response_status === 'DISPATCHING') {
        return { kind: 'ALREADY_PROCESSING' as const, payoutId };
      }
      const attemptNumber = latestAttempt ? await client.query('SELECT COUNT(*)::int AS count FROM payout_attempts WHERE payout_request_id = $1 AND request_id LIKE \'dispatch:%\'', [payoutId]).then((count) => Number(count.rows[0].count) + 1) : 1;
      const requestId = `dispatch:${payoutId}:${attemptNumber}`;
      await client.query(`
        INSERT INTO payout_attempts (id, payout_request_id, request_id, response_status, response_payload)
        VALUES ($1, $2, $3, 'DISPATCHING', '{}'::jsonb)
      `, [randomUUID(), payoutId, requestId]);
      await client.query(`UPDATE payout_requests SET status = 'PROCESSING', updated_at = $2 WHERE id = $1`, [payoutId, at]);
      await markAttempt(client, payoutId, requestId, 'DISPATCHING', { provider, attempt: attemptNumber }, at);
      return {
        kind: 'CLAIMED' as const,
        payoutId,
        partnerId: requiredString(row.partner_id, 'partner_id'),
        payoutMethodId: requiredString(row.payout_method_id, 'payout_method_id'),
        requested: money(row),
        destinationCiphertext: ciphertext(row.destination_ciphertext),
        requestId
      };
    });

    if (claim.kind === 'DUPLICATE') return { status: 'DUPLICATE', payoutId, providerPayoutId: claim.providerPayoutId };
    if (claim.kind === 'REJECTED') return { status: 'RETRYABLE', payoutId, reason: claim.reason };
    if (claim.kind === 'ALREADY_PROCESSING') return { status: 'ALREADY_PROCESSING', payoutId, providerPayoutId: claim.providerPayoutId };

    let destination: string;
    try {
      destination = requiredString(await input.resolveDestination({ partnerId: claim.partnerId, payoutMethodId: claim.payoutMethodId, destinationCiphertext: claim.destinationCiphertext }), 'destination');
    } catch (error) {
      await this.recordDispatchFailure(payoutId, claim.requestId, at, 'DESTINATION_RESOLUTION_FAILED');
      return { status: 'RETRYABLE', payoutId, reason: 'DESTINATION_RESOLUTION_FAILED' };
    }

    try {
      const dispatched = await input.adapter.createPayout({ idempotencyKey: `payout:${payoutId}`, requested: claim.requested, destination });
      const providerPayoutId = requiredString(dispatched.providerPayoutId, 'provider_payout_id');
      await this.database.withTransaction(async (client) => {
        const current = await client.query('SELECT provider_payout_id, status FROM payout_requests WHERE id = $1 FOR UPDATE', [payoutId]);
        const row = current.rows[0] as Record<string, unknown> | undefined;
        if (!row) throw new Error('PAYOUT_NOT_FOUND');
        if (row.provider_payout_id && row.provider_payout_id !== providerPayoutId) throw new Error('PAYOUT_PROVIDER_ID_CONFLICT');
        await client.query(`UPDATE payout_requests SET status = 'PROCESSING', provider_payout_id = $2, updated_at = $3 WHERE id = $1`, [payoutId, providerPayoutId, at]);
        await markAttempt(client, payoutId, claim.requestId, 'ACCEPTED', { provider, providerPayoutId, status: dispatched.status }, at);
      });
      if (dispatched.status === 'PAID') {
        const result = await this.payouts.settle({
          payoutId,
          provider,
          providerEventId: `provider-response:${payoutId}:${providerPayoutId}`,
          providerPayoutId,
          status: 'PAID',
          rawBody: JSON.stringify({ payoutId, providerPayoutId, status: 'PAID', source: 'PROVIDER_RESPONSE' }),
          signatureVerifiedAt: at,
          occurredAt: at
        });
        return { status: result === 'DUPLICATE' ? 'DUPLICATE' : 'PAID', payoutId, providerPayoutId };
      }
      return { status: 'DISPATCHED', payoutId, providerPayoutId };
    } catch (error) {
      await this.recordDispatchFailure(payoutId, claim.requestId, at, 'PROVIDER_RESPONSE_UNCERTAIN');
      return { status: 'RETRYABLE', payoutId, reason: error instanceof Error ? error.message : 'PROVIDER_RESPONSE_UNCERTAIN' };
    }
  }

  async reconcile(input: { provider: string; adapter: PayoutProvider; at: string; limit?: number }): Promise<PayoutReconciliationResult> {
    const provider = requiredString(input.provider, 'provider');
    const at = requiredIso(input.at, 'reconcile_at');
    const limit = input.limit ?? 100;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_PAYOUT_DISPATCH_VALUE:limit');
    if (!input.adapter.connected) throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED');
    const pending = await this.database.query(`
      SELECT pr.id, pr.provider_payout_id
      FROM payout_requests pr
      JOIN payout_methods pm ON pm.id = pr.payout_method_id
      WHERE pr.status = 'PROCESSING' AND pr.provider_payout_id IS NOT NULL AND pm.provider = $1
      ORDER BY pr.updated_at ASC, pr.id ASC
      LIMIT $2
    `, [provider, limit]);
    let settled = 0;
    let failures = 0;
    let processing = 0;
    for (const row of pending.rows) {
      try {
        const providerPayoutId = requiredString(row.provider_payout_id, 'provider_payout_id');
        const status = await input.adapter.getPayout(providerPayoutId);
        if (status.status === 'PROCESSING') {
          processing += 1;
          continue;
        }
        const finalStatus = status.status === 'PAID' ? 'PAID' : status.status === 'FAILED' ? 'FAILED' : undefined;
        if (!finalStatus) { failures += 1; continue; }
        await this.payouts.settle({
          payoutId: requiredString(row.id, 'payout_id'),
          provider,
          providerEventId: `reconciliation:${row.id}:${providerPayoutId}:${finalStatus}`,
          providerPayoutId,
          status: finalStatus,
          rawBody: JSON.stringify({ payoutId: row.id, providerPayoutId, status: finalStatus, source: 'RECONCILIATION' }),
          signatureVerifiedAt: at,
          occurredAt: at
        });
        settled += 1;
      } catch {
        failures += 1;
      }
    }
    return { checked: pending.rows.length, settled, processing, failures };
  }

  private async recordDispatchFailure(payoutId: string, requestId: string, at: string, reason: string): Promise<void> {
    await this.database.withTransaction(async (client) => {
      await markAttempt(client, payoutId, requestId, 'RETRYABLE_ERROR', { reason }, at);
    });
  }
}
