import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  calculateCommissions,
  calculateQcb,
  createCommissionSnapshots,
  evaluateRank,
  qualifyPayment,
  DEFAULT_RANK_RULES,
  type Attribution,
  type Currency,
  type QualifiedPayment,
  type QualifiedPaymentInput,
  type Rank,
  type RankState,
  type QcbPolicy
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';
import { PartnerEngagementRepository } from './partnerEngagementRepository';

export interface QualifiedPaymentWriteInput {
  paymentId: string;
  idempotencyKey: string;
  userId: string;
  provider: string;
  providerPaymentId: string;
  payment: QualifiedPaymentInput;
  attributionId: string;
  qcbPolicy: QcbPolicy;
  ruleVersion: string;
  paidAt: string;
  holdCommission?: boolean;
  isTestPayment?: boolean;
  fraudStatus?: 'OK' | 'REVIEW' | 'BLOCKED';
  maxAllocationBps?: number;
  providerEventId?: string;
  rawBody?: string;
  signatureVerifiedAt?: string;
}

export interface QualifiedPaymentWriteResult {
  status: 'QUALIFIED' | 'NOT_QUALIFIED' | 'CAP_VALIDATION_FAILED' | 'DUPLICATE';
  paymentId: string;
  reason: string;
  qcbAmountMinor: string;
  currency: Currency;
  commissionIds: string[];
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_PAYMENT_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_PAYMENT_VALUE:${field}`);
  return date.toISOString();
}

function safeInteger(value: unknown, field: string): number {
  const parsed = typeof value === 'bigint' ? Number(value) : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`UNSAFE_PAYMENT_VALUE:${field}`);
  return parsed;
}

function rankValue(value: unknown, field: string): Rank {
  if (!DEFAULT_RANK_RULES.some((rule) => rule.rank === value)) throw new Error(`INVALID_PAYMENT_VALUE:${field}`);
  return value as Rank;
}

function rankStateValue(value: unknown, field: string): RankState {
  if (!['ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED'].includes(String(value))) throw new Error(`INVALID_PAYMENT_VALUE:${field}`);
  return value as RankState;
}

function rankRule(rank: Rank, rateBps?: number) {
  const base = DEFAULT_RANK_RULES.find((rule) => rule.rank === rank)!;
  return { ...base, rateBps: rateBps ?? base.rateBps };
}

function fingerprint(input: QualifiedPaymentWriteInput): string {
  const money = (value: { amountMinor: bigint; currency: Currency } | undefined) => value ? `${value.currency}:${value.amountMinor.toString()}` : '-';
  return JSON.stringify([
    input.userId, input.provider, input.providerPaymentId, input.attributionId, input.ruleVersion,
    input.paidAt, input.qcbPolicy.version, input.maxAllocationBps ?? 5000, input.isTestPayment === true,
    input.providerEventId ?? null,
    input.fraudStatus ?? null, input.payment.gross.currency, money(input.payment.gross), money(input.payment.refunds),
    money(input.payment.chargebacks), money(input.payment.nonCommissionableTaxes), money(input.payment.storeCosts),
    money(input.payment.processingCosts), money(input.payment.nonCommissionableDiscounts), money(input.payment.promoCredits)
  ]);
}

function resultFromStored(value: unknown): QualifiedPaymentWriteResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_PAYMENT_IDEMPOTENCY_RECORD');
  const record = value as Record<string, unknown>;
  if (!['QUALIFIED', 'NOT_QUALIFIED', 'CAP_VALIDATION_FAILED', 'DUPLICATE'].includes(String(record.status))) throw new Error('INVALID_PAYMENT_IDEMPOTENCY_RECORD');
  const commissionIds = Array.isArray(record.commissionIds) && record.commissionIds.every((item) => typeof item === 'string') ? record.commissionIds as string[] : [];
  return {
    status: record.status as QualifiedPaymentWriteResult['status'],
    paymentId: requiredString(record.paymentId, 'stored_payment_id'),
    reason: requiredString(record.reason, 'stored_reason'),
    qcbAmountMinor: requiredString(record.qcbAmountMinor, 'stored_qcb'),
    currency: requiredString(record.currency, 'stored_currency') as Currency,
    commissionIds
  };
}

async function getPartnerContext(client: PoolClient, partnerId: string): Promise<{ rank: Rank; rankState: RankState; rateBps: number; graceCycles: number; count: number }> {
  const result = await client.query(`
    SELECT p.rank, p.rank_state, p.qualified_active_paid_l1,
           snapshot.rank AS snapshot_rank, snapshot.rank_state AS snapshot_rank_state,
           snapshot.rate_bps AS snapshot_rate_bps, snapshot.grace_cycles_in_window
    FROM partners p
    LEFT JOIN LATERAL (
      SELECT prs.rank, prs.rank_state, prs.rate_bps, prs.grace_cycles_in_window
      FROM partner_rank_snapshots prs
      WHERE prs.partner_id = p.id
      ORDER BY prs.occurred_at DESC, prs.id DESC
      LIMIT 1
    ) snapshot ON true
    WHERE p.id = $1
    FOR UPDATE OF p
  `, [partnerId]);
  const row = result.rows[0];
  if (!row) throw new Error('PARTNER_NOT_FOUND');
  const rank = rankValue(row.snapshot_rank ?? row.rank, 'rank');
  return {
    rank,
    rankState: rankStateValue(row.snapshot_rank_state ?? row.rank_state, 'rank_state'),
    rateBps: safeInteger(row.snapshot_rate_bps ?? rankRule(rank).rateBps, 'rate_bps'),
    graceCycles: safeInteger(row.grace_cycles_in_window ?? 0, 'grace_cycles_in_window'),
    count: safeInteger(row.qualified_active_paid_l1, 'qualified_active_paid_l1')
  };
}

async function writeOutbox(client: PoolClient, eventType: string, aggregateType: string, aggregateId: string, payload: Record<string, unknown>, occurredAt: string): Promise<void> {
  await client.query(`
    INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
    VALUES ($1, $2, $3, $4::jsonb, $5)
  `, [eventType, aggregateType, aggregateId, JSON.stringify(payload), occurredAt]);
}

/**
 * Transactional post-verification payment pipeline. Provider signature checks
 * and normalization happen before this boundary; this method is not exposed as
 * a browser endpoint. It atomically writes payment qualification, commissions,
 * rank projection, immutable ledger lines and outbox events.
 */
export class QualifiedPaymentRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async process(input: QualifiedPaymentWriteInput): Promise<QualifiedPaymentWriteResult> {
    const paymentId = requiredString(input.paymentId, 'payment_id');
    const idempotencyKey = requiredString(input.idempotencyKey, 'idempotency_key');
    const userId = requiredString(input.userId, 'user_id');
    const provider = requiredString(input.provider, 'provider');
    const providerPaymentId = requiredString(input.providerPaymentId, 'provider_payment_id');
    const attributionId = requiredString(input.attributionId, 'attribution_id');
    const ruleVersion = requiredString(input.ruleVersion, 'rule_version');
    const paidAt = requiredIso(input.paidAt, 'paid_at');
    const providerEventId = input.providerEventId === undefined ? null : requiredString(input.providerEventId, 'provider_event_id');
    const rawBody = input.rawBody ?? '';
    if (rawBody.length > 100_000) throw new Error('INVALID_PAYMENT_VALUE:raw_body');
    const signatureVerifiedAt = input.signatureVerifiedAt === undefined ? paidAt : requiredIso(input.signatureVerifiedAt, 'signature_verified_at');
    requiredString(input.qcbPolicy.version, 'qcb_policy_version');
    // Validate money/deductions even when the subscription later turns out not
    // to qualify; malformed provider payloads must never enter the database.
    calculateQcb(input.payment, input.qcbPolicy);
    const requestFingerprint = fingerprint(input);
    return this.database.withTransaction(async (client) => {
      if (providerEventId) {
        const existingEvent = await client.query(`
          SELECT id, raw_body
          FROM webhook_events
          WHERE provider = $1 AND provider_event_id = $2
          FOR UPDATE
        `, [provider, providerEventId]);
        if (existingEvent.rows[0]) {
          const storedRawBody = Buffer.isBuffer(existingEvent.rows[0].raw_body)
            ? existingEvent.rows[0].raw_body
            : Buffer.from(String(existingEvent.rows[0].raw_body ?? ''), 'utf8');
          if (rawBody && !storedRawBody.equals(Buffer.from(rawBody, 'utf8'))) throw new Error('WEBHOOK_IDEMPOTENCY_CONFLICT');
        }
      }
      const existingKey = await client.query(`
        SELECT request_fingerprint, response_body
        FROM idempotency_records
        WHERE scope = 'QUALIFIED_PAYMENT' AND idempotency_key = $1
        FOR UPDATE
      `, [idempotencyKey]);
      if (existingKey.rows[0]) {
        if (existingKey.rows[0].request_fingerprint !== requestFingerprint) throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT');
        return { ...resultFromStored(existingKey.rows[0].response_body), status: 'DUPLICATE' as const };
      }

      const existingPayment = await client.query(`
        SELECT id, provider, provider_payment_id
        FROM payments
        WHERE id = $1 OR (provider = $2 AND provider_payment_id = $3)
           OR (provider = $2 AND provider_event_id = $4)
        FOR UPDATE
      `, [paymentId, provider, providerPaymentId, providerEventId]);
      if (existingPayment.rows[0]) throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT');

      const attributionResult = await client.query(`
        SELECT id, user_id, direct_partner_id, second_level_partner_id, status, source_channel, campaign, attributed_at, qualified_at
        FROM referral_attributions
        WHERE id = $1
        FOR UPDATE
      `, [attributionId]);
      const attributionRow = attributionResult.rows[0];
      if (!attributionRow) throw new Error('ATTRIBUTION_NOT_FOUND');
      const attribution: Attribution = {
        id: requiredString(attributionRow.id, 'attribution_id'),
        userId: requiredString(attributionRow.user_id, 'attribution_user_id'),
        directPartnerId: requiredString(attributionRow.direct_partner_id, 'direct_partner_id'),
        secondLevelPartnerId: attributionRow.second_level_partner_id ? requiredString(attributionRow.second_level_partner_id, 'second_level_partner_id') : undefined,
        status: attributionRow.status as Attribution['status'],
        sourceChannel: requiredString(attributionRow.source_channel, 'source_channel'),
        campaign: attributionRow.campaign ? String(attributionRow.campaign) : undefined,
        attributedAt: requiredIso(attributionRow.attributed_at, 'attributed_at'),
        qualifiedAt: attributionRow.qualified_at ? requiredIso(attributionRow.qualified_at, 'qualified_at') : undefined
      };
      if (!['ATTRIBUTED', 'LOCKED', 'REJECTED'].includes(attribution.status)) throw new Error('INVALID_ATTRIBUTION_STATUS');
      const subscriptionResult = await client.query(`
        SELECT state FROM subscriptions
        WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
        FOR UPDATE
      `, [userId]);
      const subscriptionState = subscriptionResult.rows[0]?.state as QualifiedPayment['subscriptionState'] | undefined;
      const directContext = await getPartnerContext(client, attribution.directPartnerId);
      const secondContext = attribution.secondLevelPartnerId ? await getPartnerContext(client, attribution.secondLevelPartnerId) : undefined;
      const qualifiedInput: QualifiedPayment = {
        id: paymentId,
        userId,
        payment: input.payment,
        subscriptionState: subscriptionState ?? 'REGISTERED',
        qcbPolicy: input.qcbPolicy,
        attribution,
        directPartnerRank: rankRule(directContext.rank, directContext.rateBps),
        secondLevelPartnerRank: secondContext ? rankRule(secondContext.rank, secondContext.rateBps) : undefined,
        ruleVersion,
        createdAt: paidAt,
        maxAllocationBps: input.maxAllocationBps,
        isTestPayment: input.isTestPayment,
        fraudStatus: input.fraudStatus
      };
      const qualification = qualifyPayment(qualifiedInput);
      await client.query(`
        INSERT INTO payments (id, user_id, provider, provider_payment_id, gross_amount_minor, currency, status, is_test_payment, provider_event_id, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'SUCCEEDED', $7, $8, $9)
      `, [paymentId, userId, provider, providerPaymentId, input.payment.gross.amountMinor.toString(), input.payment.gross.currency, input.isTestPayment === true, providerEventId, paidAt]);

      let result: QualifiedPaymentWriteResult;
      if (!qualification.qualified) {
        result = { status: 'NOT_QUALIFIED', paymentId, reason: qualification.reason, qcbAmountMinor: qualification.qcb.amountMinor.toString(), currency: qualification.qcb.currency, commissionIds: [] };
        await writeOutbox(client, 'PAYMENT_NOT_QUALIFIED', 'PAYMENT', paymentId, { reason: result.reason, userId }, paidAt);
      } else {
        const wasAlreadyQualified = Boolean(attribution.qualifiedAt);
        const allocations: Array<{ partnerId: string; referralLevel: 'L1' | 'L2'; rateBps: number }> = [
          { partnerId: attribution.directPartnerId, referralLevel: 'L1' as const, rateBps: directContext.rateBps }
        ];
        if (secondContext && attribution.secondLevelPartnerId) allocations.push({ partnerId: attribution.secondLevelPartnerId, referralLevel: 'L2' as const, rateBps: secondContext.rateBps });
        const calculation = calculateCommissions(qualification.qcb, allocations, input.maxAllocationBps ?? 5000);
        await client.query(`
          INSERT INTO qualified_payments (payment_id, attribution_id, qcb_amount_minor, currency, qcb_policy_version, qualification_reason, rule_version, qualified_at)
          VALUES ($1, $2, $3, $4, $5, 'ACTIVE_PAID_SUBSCRIPTION', $6, $7)
        `, [paymentId, attributionId, qualification.qcb.amountMinor.toString(), qualification.qcb.currency, input.qcbPolicy.version, ruleVersion, paidAt]);
        await client.query(`
          UPDATE referral_attributions SET status = 'LOCKED', qualified_at = COALESCE(qualified_at, $2)
          WHERE id = $1
        `, [attributionId, paidAt]);
        if (!wasAlreadyQualified) {
          const nextCount = directContext.count + 1;
          const evaluation = evaluateRank(nextCount, { rank: directContext.rank, state: directContext.rankState, graceCyclesInWindow: directContext.graceCycles }, undefined, DEFAULT_RANK_RULES);
          const nextRank = evaluation.rank ?? directContext.rank;
          const rankEventId = randomUUID();
          await client.query(`
            UPDATE partners SET qualified_active_paid_l1 = $2, rank = $3, rank_state = $4 WHERE id = $1
          `, [attribution.directPartnerId, nextCount, nextRank, evaluation.state]);
          await client.query(`
            INSERT INTO partner_rank_snapshots (id, partner_id, qualified_active_paid_l1, rank, rank_state, rate_bps, grace_cycles_in_window, rule_version, reason, occurred_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'QUALIFIED_L1_PAYMENT', $9)
          `, [randomUUID(), attribution.directPartnerId, nextCount, nextRank, evaluation.state, evaluation.rateBps, directContext.graceCycles, ruleVersion, paidAt]);
          await client.query(`
            INSERT INTO rank_events (id, partner_id, event_type, previous_rank, new_rank, previous_state, new_state, qualified_active_paid_l1, rule_version, idempotency_key, payload, occurred_at)
            VALUES ($1, $2, 'QUALIFIED_L1_PAYMENT', $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
          `, [rankEventId, attribution.directPartnerId, directContext.rank, nextRank, directContext.rankState, evaluation.state, nextCount, ruleVersion, `rank:payment:${paymentId}`, JSON.stringify({ rateBps: evaluation.rateBps, reason: 'QUALIFIED_L1_PAYMENT' }), paidAt]);
        }
        // Keep non-financial partner projections in the same commit as the
        // qualified payment/rank change. Outbox events are emitted only for
        // newly unlocked achievements or an actual Ambassador tier change.
        await new PartnerEngagementRepository(this.database).syncPartnerWithClient(client, attribution.directPartnerId, paidAt);
        if (!calculation.cap.passed) {
          result = { status: 'CAP_VALIDATION_FAILED', paymentId, reason: calculation.cap.reason, qcbAmountMinor: qualification.qcb.amountMinor.toString(), currency: qualification.qcb.currency, commissionIds: [] };
          await writeOutbox(client, 'CAP_VALIDATION_FAILED', 'PAYMENT', paymentId, { qcbAmountMinor: qualification.qcb.amountMinor.toString(), totalAllocationBps: calculation.cap.totalAllocationBps }, paidAt);
        } else {
          const snapshots = createCommissionSnapshots(qualifiedInput, input.holdCommission !== false);
          const commissionIds: string[] = [];
          for (const snapshot of snapshots) {
            commissionIds.push(snapshot.id);
            const ledgerTransactionId = randomUUID();
            await client.query(`
              INSERT INTO commissions (
                id, payment_id, partner_id, referral_level, qcb_amount_minor, currency, qcb_policy_version,
                achieved_rank, effective_rank, rate_bps, raw_commission_minor, rounded_commission_minor,
                rounding_policy, cap_result, rule_version, state, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'HALF_UP', $13::jsonb, $14, $15, $16)
            `, [snapshot.id, paymentId, snapshot.partnerId, snapshot.referralLevel, snapshot.qcb.amountMinor.toString(), snapshot.qcb.currency, snapshot.qcbPolicyVersion, snapshot.achievedRank, snapshot.effectiveRank, snapshot.rateBps, snapshot.rawCommission.amountMinor.toString(), snapshot.roundedCommission.amountMinor.toString(), JSON.stringify(snapshot.capResult), snapshot.ruleVersion, snapshot.state, snapshot.createdAt]);
            await client.query(`
              INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
              VALUES ($1, 'COMMISSION_CREATED', $2, $3, $4)
            `, [ledgerTransactionId, `commission:${paymentId}:${snapshot.partnerId}:${snapshot.referralLevel}`, ruleVersion, paidAt]);
            await client.query(`
              INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
              VALUES ($1, 'PLATFORM_REVENUE', 'DEBIT', $2, $3, NULL),
                     ($1, $4, 'CREDIT', $2, $3, $5)
            `, [ledgerTransactionId, snapshot.roundedCommission.amountMinor.toString(), snapshot.roundedCommission.currency, snapshot.state === 'HELD' ? 'PARTNER_HELD' : 'PARTNER_AVAILABLE', snapshot.partnerId]);
            await writeOutbox(client, 'COMMISSION_CREATED', 'COMMISSION', snapshot.id, { paymentId, partnerId: snapshot.partnerId, referralLevel: snapshot.referralLevel }, paidAt);
          }
          await writeOutbox(client, 'PAYMENT_QUALIFIED', 'PAYMENT', paymentId, { directPartnerId: attribution.directPartnerId, qcbAmountMinor: qualification.qcb.amountMinor.toString() }, paidAt);
          result = { status: 'QUALIFIED', paymentId, reason: 'QUALIFIED', qcbAmountMinor: qualification.qcb.amountMinor.toString(), currency: qualification.qcb.currency, commissionIds };
        }
      }
      if (providerEventId) {
        await client.query(`
          INSERT INTO webhook_events (id, provider, provider_event_id, signature_verified_at, raw_body, processed_at, processing_status)
          VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSED')
        `, [randomUUID(), provider, providerEventId, signatureVerifiedAt, Buffer.from(rawBody, 'utf8'), paidAt]);
      }
      await client.query(`
        INSERT INTO idempotency_records (scope, idempotency_key, request_fingerprint, response_status, response_body)
        VALUES ('QUALIFIED_PAYMENT', $1, $2, 200, $3::jsonb)
      `, [idempotencyKey, requestFingerprint, JSON.stringify(result)]);
      return result;
    });
  }
}
