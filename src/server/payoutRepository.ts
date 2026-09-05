import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  checkPayoutEligibility,
  convertWithFx,
  type Currency,
  type FxSnapshot,
  type Money,
  type PayoutPolicy
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';

export interface PayoutRequestWriteInput {
  id: string;
  idempotencyKey: string;
  partnerId: string;
  payoutMethodId: string;
  requested: Money;
  minimumBase: Money;
  requestedGrossMinimum?: boolean;
  fxRateId: string;
  providerFee: Money;
  fxFee?: Money;
  withholding?: Money;
  kyc: 'VERIFIED' | 'PENDING' | 'FAILED';
  compliance: 'OK' | 'REVIEW' | 'BLOCKED';
  fraud: 'OK' | 'REVIEW' | 'BLOCKED';
  createdAt: string;
}

export interface PayoutRequestWriteResult {
  status: 'HELD' | 'REJECTED' | 'DUPLICATE';
  payoutId: string;
  reason: string;
  requestedAmountMinor: string;
  providerFeeMinor: string;
  fxFeeMinor: string;
  withholdingMinor: string;
  netAmountMinor: string;
  currency: Currency;
  minimumPayoutMinor: string | null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_PAYOUT_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_PAYOUT_VALUE:${field}`);
  return date.toISOString();
}

function moneyValue(value: unknown, field: string): bigint {
  try {
    const parsed = typeof value === 'bigint' ? value : BigInt(String(value));
    if (parsed < 0n) throw new Error();
    return parsed;
  } catch {
    throw new Error(`INVALID_PAYOUT_VALUE:${field}`);
  }
}

function fxFromRow(row: Record<string, unknown>): FxSnapshot {
  return {
    baseCurrency: requiredString(row.base_currency, 'fx_base_currency') as Currency,
    payoutCurrency: requiredString(row.payout_currency, 'fx_payout_currency') as Currency,
    rateNumerator: moneyValue(row.rate_numerator, 'fx_rate_numerator'),
    rateDenominator: moneyValue(row.rate_denominator, 'fx_rate_denominator'),
    provider: requiredString(row.provider, 'fx_provider'),
    quotedAt: requiredIso(row.quoted_at, 'fx_quoted_at'),
    expiresAt: requiredIso(row.expires_at, 'fx_expires_at'),
    version: requiredString(row.version, 'fx_version')
  };
}

function fingerprint(input: PayoutRequestWriteInput): string {
  const money = (value: Money | undefined) => value ? `${value.currency}:${value.amountMinor.toString()}` : '-';
  return JSON.stringify([
    input.partnerId, input.payoutMethodId, input.requested.currency, money(input.requested), money(input.minimumBase),
    input.requestedGrossMinimum !== false, input.fxRateId, money(input.providerFee), money(input.fxFee), money(input.withholding),
    input.kyc, input.compliance, input.fraud, input.createdAt
  ]);
}

function storedResult(value: unknown): PayoutRequestWriteResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_PAYOUT_IDEMPOTENCY_RECORD');
  const record = value as Record<string, unknown>;
  return {
    status: 'DUPLICATE',
    payoutId: requiredString(record.payoutId, 'stored_payout_id'),
    reason: requiredString(record.reason, 'stored_reason'),
    requestedAmountMinor: requiredString(record.requestedAmountMinor, 'stored_requested'),
    providerFeeMinor: requiredString(record.providerFeeMinor, 'stored_provider_fee'),
    fxFeeMinor: requiredString(record.fxFeeMinor, 'stored_fx_fee'),
    withholdingMinor: requiredString(record.withholdingMinor, 'stored_withholding'),
    netAmountMinor: requiredString(record.netAmountMinor, 'stored_net'),
    currency: requiredString(record.currency, 'stored_currency') as Currency,
    minimumPayoutMinor: record.minimumPayoutMinor === null ? null : requiredString(record.minimumPayoutMinor, 'stored_minimum')
  };
}

async function availableBalance(client: PoolClient, partnerId: string, currency: Currency): Promise<Money> {
  const result = await client.query(`
    SELECT COALESCE(available_minor, 0)::bigint AS available_minor
    FROM wallet_projections
    WHERE partner_id = $1 AND currency = $2
  `, [partnerId, currency]);
  return { amountMinor: moneyValue(result.rows[0]?.available_minor ?? 0, 'available_minor'), currency };
}

async function insertLedgerMove(client: PoolClient, input: { id: string; idempotencyKey: string; partnerId: string; amount: Money; from: 'PARTNER_AVAILABLE' | 'PARTNER_LOCKED'; to: 'PARTNER_AVAILABLE' | 'PARTNER_LOCKED' | 'PARTNER_PAID'; source: string; createdAt: string }): Promise<void> {
  await client.query(`
    INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
    VALUES ($1, $2, $3, 'payout-v1', $4)
  `, [input.id, input.source, input.idempotencyKey, input.createdAt]);
  await client.query(`
    INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
    VALUES ($1, $2, 'DEBIT', $3, $4, $5), ($1, $6, 'CREDIT', $3, $4, $5)
  `, [input.id, input.from, input.amount.amountMinor.toString(), input.amount.currency, input.partnerId, input.to]);
}

/** Durable payout lock/settlement boundary. Provider dispatch is deliberately separate. */
export class PayoutRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async request(input: PayoutRequestWriteInput): Promise<PayoutRequestWriteResult> {
    const id = requiredString(input.id, 'id');
    const idempotencyKey = requiredString(input.idempotencyKey, 'idempotency_key');
    const partnerId = requiredString(input.partnerId, 'partner_id');
    const payoutMethodId = requiredString(input.payoutMethodId, 'payout_method_id');
    const fxRateId = requiredString(input.fxRateId, 'fx_rate_id');
    const createdAt = requiredIso(input.createdAt, 'created_at');
    const requestFingerprint = fingerprint(input);
    const feeQuote = { providerFee: input.providerFee, fxFee: input.fxFee, withholding: input.withholding };
    const zeroFees = { providerFeeMinor: input.providerFee.amountMinor.toString(), fxFeeMinor: (input.fxFee?.amountMinor ?? 0n).toString(), withholdingMinor: (input.withholding?.amountMinor ?? 0n).toString() };
    return this.database.withTransaction(async (client) => {
      const existingKey = await client.query(`
        SELECT request_fingerprint, response_body
        FROM idempotency_records
        WHERE scope = 'PAYOUT_REQUEST' AND idempotency_key = $1
        FOR UPDATE
      `, [idempotencyKey]);
      if (existingKey.rows[0]) {
        if (existingKey.rows[0].request_fingerprint !== requestFingerprint) throw new Error('PAYOUT_IDEMPOTENCY_CONFLICT');
        return storedResult(existingKey.rows[0].response_body);
      }
      const partner = await client.query('SELECT id FROM partners WHERE id = $1 FOR UPDATE', [partnerId]);
      if (!partner.rows[0]) throw new Error('PARTNER_NOT_FOUND');
      const method = await client.query(`SELECT id FROM payout_methods WHERE id = $1 AND partner_id = $2 AND verification_status = 'VERIFIED' FOR UPDATE`, [payoutMethodId, partnerId]);
      if (!method.rows[0]) throw new Error('PAYOUT_METHOD_REQUIRED');
      const fxResult = await client.query(`
        SELECT id, provider, version, base_currency, payout_currency, rate_numerator, rate_denominator, quoted_at, expires_at
        FROM fx_rates WHERE id = $1 FOR SHARE
      `, [fxRateId]);
      if (!fxResult.rows[0]) throw new Error('FX_SNAPSHOT_NOT_FOUND');
      const fx = fxFromRow(fxResult.rows[0]);
      const available = await availableBalance(client, partnerId, input.requested.currency);
      const policy: PayoutPolicy = { minimumBase: input.minimumBase, requestedGrossMinimum: input.requestedGrossMinimum !== false };
      const eligibility = checkPayoutEligibility({
        requested: input.requested,
        available,
        fx,
        policy,
        kyc: input.kyc,
        compliance: input.compliance,
        fraud: input.fraud,
        payoutMethod: 'VERIFIED',
        feeQuote,
        asOf: createdAt
      });
      const feeTotal = input.providerFee.amountMinor + (input.fxFee?.amountMinor ?? 0n) + (input.withholding?.amountMinor ?? 0n);
      const result: QualifiedPayoutResult = {
        status: eligibility.allowed ? 'HELD' : 'REJECTED',
        payoutId: id,
        reason: eligibility.code,
        requestedAmountMinor: input.requested.amountMinor.toString(),
        providerFeeMinor: input.providerFee.amountMinor.toString(),
        fxFeeMinor: (input.fxFee?.amountMinor ?? 0n).toString(),
        withholdingMinor: (input.withholding?.amountMinor ?? 0n).toString(),
        netAmountMinor: (input.requested.amountMinor - feeTotal).toString(),
        currency: input.requested.currency,
        minimumPayoutMinor: eligibility.minimumPayout?.amountMinor.toString() ?? null
      };
      await client.query(`
        INSERT INTO payout_requests (id, idempotency_key, partner_id, payout_method_id, requested_amount_minor, currency, provider_fee_minor, fx_fee_minor, withholding_minor, fx_rate_id, status, failure_reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
      `, [id, idempotencyKey, partnerId, payoutMethodId, input.requested.amountMinor.toString(), input.requested.currency, zeroFees.providerFeeMinor, zeroFees.fxFeeMinor, zeroFees.withholdingMinor, fxRateId, result.status === 'HELD' ? 'PAYOUT_HELD' : 'REJECTED', result.status === 'HELD' ? null : result.reason, createdAt]);
      if (eligibility.allowed) {
        await insertLedgerMove(client, { id: randomUUID(), idempotencyKey: `payout-lock:${idempotencyKey}`, partnerId, amount: input.requested, from: 'PARTNER_AVAILABLE', to: 'PARTNER_LOCKED', source: 'PAYOUT_REQUESTED', createdAt });
        await client.query(`
          INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
          VALUES ('PAYOUT_LOCKED', 'PAYOUT', $1, $2::jsonb, $3)
        `, [id, JSON.stringify({ partnerId, requestedAmountMinor: input.requested.amountMinor.toString(), currency: input.requested.currency }), createdAt]);
      }
      await client.query(`
        INSERT INTO idempotency_records (scope, idempotency_key, request_fingerprint, response_status, response_body)
        VALUES ('PAYOUT_REQUEST', $1, $2, $3, $4::jsonb)
      `, [idempotencyKey, requestFingerprint, eligibility.allowed ? 201 : 409, JSON.stringify(result)]);
      return result;
    });
  }

  async settle(input: { payoutId: string; provider: string; providerEventId: string; providerPayoutId: string; status: 'PAID' | 'FAILED'; rawBody: string; signatureVerifiedAt: string; occurredAt: string }): Promise<'PAID' | 'FAILED' | 'DUPLICATE'> {
    const payoutId = requiredString(input.payoutId, 'payout_id');
    const provider = requiredString(input.provider, 'provider');
    const providerEventId = requiredString(input.providerEventId, 'provider_event_id');
    const providerPayoutId = requiredString(input.providerPayoutId, 'provider_payout_id');
    const occurredAt = requiredIso(input.occurredAt, 'occurred_at');
    const signatureVerifiedAt = requiredIso(input.signatureVerifiedAt, 'signature_verified_at');
    return this.database.withTransaction(async (client) => {
      const duplicate = await client.query('SELECT id, raw_body FROM webhook_events WHERE provider = $1 AND provider_event_id = $2 FOR UPDATE', [provider, providerEventId]);
      if (duplicate.rows[0]) {
        const storedRawBody = Buffer.isBuffer(duplicate.rows[0].raw_body)
          ? duplicate.rows[0].raw_body
          : Buffer.from(String(duplicate.rows[0].raw_body ?? ''), 'utf8');
        if (!storedRawBody.equals(Buffer.from(input.rawBody, 'utf8'))) throw new Error('WEBHOOK_IDEMPOTENCY_CONFLICT');
        return 'DUPLICATE';
      }
      await client.query(`
        INSERT INTO webhook_events (id, provider, provider_event_id, signature_verified_at, raw_body, processing_status)
        VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
      `, [randomUUID(), provider, providerEventId, signatureVerifiedAt, Buffer.from(input.rawBody, 'utf8')]);
      const payoutResult = await client.query(`
        SELECT id, partner_id, requested_amount_minor, currency, status, provider_payout_id
        FROM payout_requests WHERE id = $1 FOR UPDATE
      `, [payoutId]);
      const payout = payoutResult.rows[0];
      if (!payout) throw new Error('PAYOUT_NOT_FOUND');
      if (payout.status !== 'PAYOUT_HELD' && payout.status !== 'PROCESSING') throw new Error('PAYOUT_STATE_CONFLICT');
      if (payout.provider_payout_id && payout.provider_payout_id !== providerPayoutId) throw new Error('PAYOUT_PROVIDER_ID_CONFLICT');
      const amount: Money = { amountMinor: moneyValue(payout.requested_amount_minor, 'requested_amount_minor'), currency: requiredString(payout.currency, 'currency') as Currency };
      const ledgerId = randomUUID();
      await insertLedgerMove(client, {
        id: ledgerId,
        idempotencyKey: `payout-settle:${payoutId}:${input.status}`,
        partnerId: requiredString(payout.partner_id, 'partner_id'),
        amount,
        from: 'PARTNER_LOCKED',
        to: input.status === 'PAID' ? 'PARTNER_PAID' : 'PARTNER_AVAILABLE',
        source: input.status === 'PAID' ? 'PAYOUT_PAID' : 'PAYOUT_FAILED',
        createdAt: occurredAt
      });
      await client.query(`
        UPDATE payout_requests
        SET status = $2, provider_payout_id = $3, failure_reason = $4, updated_at = $5
        WHERE id = $1
      `, [payoutId, input.status, providerPayoutId, input.status === 'FAILED' ? 'PROVIDER_FAILED' : null, occurredAt]);
      await client.query(`
        INSERT INTO payout_attempts (id, payout_request_id, provider_payout_id, request_id, response_status, response_payload)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [randomUUID(), payoutId, providerPayoutId, providerEventId, input.status, JSON.stringify({ provider, status: input.status })]);
      await client.query(`
        UPDATE webhook_events SET processed_at = $2, processing_status = 'PROCESSED'
        WHERE provider = $1 AND provider_event_id = $3
      `, [provider, occurredAt, providerEventId]);
      await client.query(`
        INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
        VALUES ($1, 'PAYOUT', $2, $3::jsonb, $4)
      `, [`PAYOUT_${input.status}`, payoutId, JSON.stringify({ providerPayoutId, status: input.status }), occurredAt]);
      return input.status;
    });
  }
}

type QualifiedPayoutResult = PayoutRequestWriteResult;
