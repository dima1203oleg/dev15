import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  DEFAULT_RANK_RULES,
  evaluateRank,
  type Currency,
  type Rank,
  type RankState,
  type Money
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';

export interface PaymentAdjustmentInput {
  paymentId: string;
  provider: string;
  providerEventId: string;
  kind: 'REFUND' | 'CHARGEBACK';
  amount: Money;
  rawBody: string;
  signatureVerifiedAt: string;
  occurredAt: string;
}

export interface PaymentAdjustmentResult {
  status: 'APPLIED' | 'DUPLICATE';
  paymentId: string;
  kind: PaymentAdjustmentInput['kind'];
  commissionCount: number;
  rankDecremented: boolean;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_ADJUSTMENT_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_ADJUSTMENT_VALUE:${field}`);
  return date.toISOString();
}

function moneyMinor(value: unknown, field: string): bigint {
  try {
    const parsed = typeof value === 'bigint' ? value : BigInt(String(value));
    if (parsed <= 0n) throw new Error();
    return parsed;
  } catch {
    throw new Error(`INVALID_ADJUSTMENT_VALUE:${field}`);
  }
}

function rankValue(value: unknown, field: string): Rank {
  if (!DEFAULT_RANK_RULES.some((rule) => rule.rank === value)) throw new Error(`INVALID_ADJUSTMENT_VALUE:${field}`);
  return value as Rank;
}

function rankStateValue(value: unknown, field: string): RankState {
  if (!['ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED'].includes(String(value))) throw new Error(`INVALID_ADJUSTMENT_VALUE:${field}`);
  return value as RankState;
}

async function insertLedgerMove(client: PoolClient, input: { id: string; idempotencyKey: string; partnerId: string; amount: Money; from: string; to: string; source: string; createdAt: string }): Promise<void> {
  await client.query(`
    INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
    VALUES ($1, $2, $3, 'adjustment-v1', $4)
  `, [input.id, input.source, input.idempotencyKey, input.createdAt]);
  await client.query(`
    INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
    VALUES ($1, $2, 'DEBIT', $3, $4, $5), ($1, $6, 'CREDIT', $3, $4, $5)
  `, [input.id, input.from, input.amount.amountMinor.toString(), input.amount.currency, input.partnerId, input.to]);
}

/** Apply a signature-verified full refund/chargeback as compensating ledger moves. */
export class PaymentAdjustmentRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async applyVerifiedProviderEvent(input: PaymentAdjustmentInput): Promise<PaymentAdjustmentResult> {
    const paymentId = requiredString(input.paymentId, 'payment_id');
    const provider = requiredString(input.provider, 'provider');
    const providerEventId = requiredString(input.providerEventId, 'provider_event_id');
    const kind = input.kind;
    if (kind !== 'REFUND' && kind !== 'CHARGEBACK') throw new Error('INVALID_ADJUSTMENT_VALUE:kind');
    const amount: Money = { amountMinor: moneyMinor(input.amount.amountMinor, 'amount_minor'), currency: input.amount.currency };
    const signatureVerifiedAt = requiredIso(input.signatureVerifiedAt, 'signature_verified_at');
    const occurredAt = requiredIso(input.occurredAt, 'occurred_at');
    const rawBody = requiredString(input.rawBody, 'raw_body');

    return this.database.withTransaction(async (client) => {
      const duplicate = await client.query('SELECT id FROM webhook_events WHERE provider = $1 AND provider_event_id = $2 FOR UPDATE', [provider, providerEventId]);
      if (duplicate.rows[0]) return { status: 'DUPLICATE' as const, paymentId, kind, commissionCount: 0, rankDecremented: false };
      await client.query(`
        INSERT INTO webhook_events (id, provider, provider_event_id, signature_verified_at, raw_body, processing_status)
        VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
      `, [randomUUID(), provider, providerEventId, signatureVerifiedAt, Buffer.from(rawBody, 'utf8')]);

      const paymentResult = await client.query(`
        SELECT id, user_id, gross_amount_minor, currency
        FROM payments WHERE id = $1 FOR UPDATE
      `, [paymentId]);
      const payment = paymentResult.rows[0];
      if (!payment) throw new Error('PAYMENT_NOT_FOUND');
      const grossAmount = moneyMinor(payment.gross_amount_minor, 'gross_amount_minor');
      const currency = requiredString(payment.currency, 'payment_currency') as Currency;
      if (amount.currency !== currency || amount.amountMinor !== grossAmount) throw new Error('PARTIAL_ADJUSTMENT_UNSUPPORTED');
      const priorAdjustment = await client.query('SELECT id FROM payment_adjustments WHERE payment_id = $1 AND kind = $2 FOR UPDATE', [paymentId, kind]);
      if (priorAdjustment.rows[0]) throw new Error('PAYMENT_ALREADY_ADJUSTED');

      const qualifiedResult = await client.query(`
        SELECT attribution_id FROM qualified_payments WHERE payment_id = $1 FOR SHARE
      `, [paymentId]);
      const attributionId = qualifiedResult.rows[0]?.attribution_id as string | undefined;
      await client.query(`
        INSERT INTO payment_adjustments (id, payment_id, provider, provider_event_id, kind, amount_minor, currency, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [randomUUID(), paymentId, provider, providerEventId, kind, amount.amountMinor.toString(), amount.currency, occurredAt]);

      const commissionResult = await client.query(`
        SELECT id, partner_id, rounded_commission_minor, currency, state
        FROM commissions WHERE payment_id = $1 ORDER BY id ASC FOR UPDATE
      `, [paymentId]);
      for (const commission of commissionResult.rows) {
        const state = String(commission.state);
        const from = state === 'HELD' ? 'PARTNER_HELD' : state === 'AVAILABLE' || state === 'VESTED' ? 'PARTNER_AVAILABLE' : state === 'PAID' ? 'PARTNER_PAID' : null;
        const to = state === 'PAID' ? 'PARTNER_DEBT' : 'PARTNER_REVERSED';
        const nextState = state === 'PAID' ? 'ADJUSTED' : 'REVERSED';
        if (!from) {
          if (state === 'REVERSED' || state === 'ADJUSTED') continue;
          throw new Error(`COMMISSION_STATE_NOT_REVERSIBLE:${state}`);
        }
        const commissionAmount: Money = { amountMinor: moneyMinor(commission.rounded_commission_minor, 'commission_amount'), currency: requiredString(commission.currency, 'commission_currency') as Currency };
        await insertLedgerMove(client, {
          id: randomUUID(),
          idempotencyKey: `payment-adjustment:${kind}:${paymentId}:${commission.id}`,
          partnerId: requiredString(commission.partner_id, 'commission_partner_id'),
          amount: commissionAmount,
          from,
          to,
          source: kind,
          createdAt: occurredAt
        });
        await client.query('UPDATE commissions SET state = $2 WHERE id = $1', [commission.id, nextState]);
        await client.query(`
          INSERT INTO commission_events (id, commission_id, event_type, previous_state, new_state, payload, occurred_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        `, [randomUUID(), commission.id, kind, state, nextState, JSON.stringify({ paymentId, providerEventId }), occurredAt]);
        await client.query(`
          INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
          VALUES ($1, 'COMMISSION', $2, $3::jsonb, $4)
        `, [`COMMISSION_${nextState}`, commission.id, JSON.stringify({ paymentId, kind, previousState: state, newState: nextState }), occurredAt]);
      }

      let rankDecremented = false;
      if (attributionId) {
        const activePayments = await client.query(`
          SELECT COUNT(*)::int AS count
          FROM qualified_payments qp
          WHERE qp.attribution_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM payment_adjustments pa
              WHERE pa.payment_id = qp.payment_id AND pa.status = 'APPLIED'
            )
        `, [attributionId]);
        if (Number(activePayments.rows[0]?.count ?? 0) === 0) {
          const attribution = await client.query('SELECT direct_partner_id FROM referral_attributions WHERE id = $1 FOR SHARE', [attributionId]);
          const directPartnerId = attribution.rows[0]?.direct_partner_id as string | undefined;
          if (directPartnerId) {
            const partnerResult = await client.query(`
              SELECT p.rank, p.rank_state, p.qualified_active_paid_l1,
                     snapshot.rank AS snapshot_rank, snapshot.rank_state AS snapshot_rank_state,
                     snapshot.grace_cycles_in_window
              FROM partners p
              LEFT JOIN LATERAL (
                SELECT prs.rank, prs.rank_state, prs.grace_cycles_in_window
                FROM partner_rank_snapshots prs
                WHERE prs.partner_id = p.id
                ORDER BY prs.occurred_at DESC, prs.id DESC
                LIMIT 1
              ) snapshot ON true
              WHERE p.id = $1 FOR UPDATE OF p
            `, [directPartnerId]);
            const partner = partnerResult.rows[0];
            if (!partner) throw new Error('PARTNER_NOT_FOUND');
            const currentCount = Number(partner.qualified_active_paid_l1);
            if (!Number.isSafeInteger(currentCount) || currentCount < 0) throw new Error('INVALID_PARTNER_L1_COUNT');
            if (currentCount > 0) {
              const nextCount = currentCount - 1;
              const currentRank = rankValue(partner.snapshot_rank ?? partner.rank, 'rank');
              const currentState = rankStateValue(partner.snapshot_rank_state ?? partner.rank_state, 'rank_state');
              const evaluation = evaluateRank(nextCount, { rank: currentRank, state: currentState, graceCyclesInWindow: Number(partner.grace_cycles_in_window ?? 0) });
              const nextRank = evaluation.rank ?? currentRank;
              await client.query('UPDATE partners SET qualified_active_paid_l1 = $2, rank = $3, rank_state = $4 WHERE id = $1', [directPartnerId, nextCount, nextRank, evaluation.state]);
              await client.query(`
                INSERT INTO partner_rank_snapshots (id, partner_id, qualified_active_paid_l1, rank, rank_state, rate_bps, grace_cycles_in_window, rule_version, reason, occurred_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'adjustment-v1', 'QUALIFIED_L1_REVERSED', $8)
              `, [randomUUID(), directPartnerId, nextCount, nextRank, evaluation.state, evaluation.rateBps, Number(partner.grace_cycles_in_window ?? 0), occurredAt]);
              await client.query(`
                INSERT INTO rank_events (id, partner_id, event_type, previous_rank, new_rank, previous_state, new_state, qualified_active_paid_l1, rule_version, idempotency_key, payload, occurred_at)
                VALUES ($1, $2, 'QUALIFIED_L1_REVERSED', $3, $4, $5, $6, $7, 'adjustment-v1', $8, $9::jsonb, $10)
              `, [randomUUID(), directPartnerId, currentRank, nextRank, currentState, evaluation.state, nextCount, `rank:adjustment:${kind}:${paymentId}`, JSON.stringify({ paymentId, kind, reason: 'QUALIFIED_L1_REVERSED' }), occurredAt]);
              rankDecremented = true;
            }
          }
        }
      }
      await client.query('UPDATE webhook_events SET processed_at = $2, processing_status = \'PROCESSED\' WHERE provider = $1 AND provider_event_id = $3', [provider, occurredAt, providerEventId]);
      await client.query(`
        INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
        VALUES ($1, 'PAYMENT', $2, $3::jsonb, $4)
      `, [`${kind}_CREATED`, paymentId, JSON.stringify({ paymentId, kind, providerEventId, rankDecremented }), occurredAt]);
      return { status: 'APPLIED' as const, paymentId, kind, commissionCount: commissionResult.rows.length, rankDecremented };
    });
  }
}
