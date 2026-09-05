import { randomUUID } from 'node:crypto';
import type { QueryResultRow } from 'pg';
import { DEFAULT_RANK_RULES, resolveRank } from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';

export interface PersistedPartnerSummary {
  id: string;
  userId: string;
  referralCode: string;
  rank: string;
  effectiveRank: string;
  partnerRateBps: number;
  rankState: string;
  qualityStatus: string;
  ambassadorTier: string;
  isAmbassadorApproved: boolean;
  activeL1PaidCount: number;
  activeL2PaidCount: number;
  totalL1Count: number;
  totalL2Count: number;
  totalClicks: number;
  createdAt: string;
}

export interface PersistedWalletProjection {
  partnerId: string;
  pendingMinor: number;
  heldMinor: number;
  availableMinor: number;
  lockedPayoutMinor: number;
  paidTotalMinor: number;
  reversedMinor: number;
  debtMinor: number;
  currency: string;
}

export interface PersistedPartnerDashboard {
  partner: PersistedPartnerSummary;
  wallet: PersistedWalletProjection;
  rankProgress: {
    currentPaidL1: number;
    nextRank: string;
    targetThreshold: number;
    remainingToNext: number;
    percentageToNext: number;
  };
}

export interface PersistedNetworkItem {
  id: string;
  userAnonymousLabel: string;
  sourceChannel: string;
  utmCampaign?: string;
  isQualifiedPaid: boolean;
  subscriptionPlan?: string;
  monthlyQcbMinor: number;
  registeredAt: string;
  lastPaymentAt?: string;
  status: string;
}

export interface PersistedNetworkPage {
  count: number;
  activePaidCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  items: PersistedNetworkItem[];
}

export interface PersistedLedgerEntry {
  id: string;
  transactionId: string;
  timestamp: string;
  debitAccount: string;
  creditAccount: string;
  amountMinor: number;
  currency: string;
  partnerId: string;
  description: string;
  idempotencyKey: string;
}

export interface PersistedPayout {
  id: string;
  partnerId: string;
  amountMinor: number;
  currency: string;
  provider: string;
  destinationAccount: string;
  status: string;
  idempotencyKey: string;
  requestedAt: string;
  completedAt?: string;
  failureReason?: string;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`INVALID_DATABASE_VALUE:${field}`);
  return value;
}

function safeInteger(value: unknown, field: string): number {
  const parsed = typeof value === 'bigint' ? Number(value) : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`UNSAFE_DATABASE_INTEGER:${field}`);
  return parsed;
}

function optionalIso(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_DATABASE_DATE:${field}`);
  return date.toISOString();
}

function networkStatus(row: Record<string, unknown>): string {
  if (row.attribution_status === 'REJECTED') return 'REJECTED';
  if (row.qualified_at) return 'ACTIVE';
  return 'TRIAL_OR_UNQUALIFIED';
}

/**
 * PostgreSQL boundary for authenticated partner surfaces. Financial values are
 * read from wallet_projections and immutable ledger tables; the only writes in
 * this class are non-financial campaign attribution records.
 */
export class PostgresPartnerRepository {
  constructor(private readonly database: PostgresBoundary) {}

  private async getDashboardBy(field: 'p.id' | 'p.user_id', value: string): Promise<PersistedPartnerDashboard | null> {
    const result = await this.database.query<Record<string, unknown>>(`
      SELECT
        p.id, p.user_id, p.referral_code, p.rank, p.rank_state,
        p.qualified_active_paid_l1, p.quality_status, p.created_at,
        COALESCE(a.tier, 'NONE') AS ambassador_tier,
        COALESCE(a.approved, false) AS ambassador_approved,
        COALESCE((SELECT COUNT(*) FROM referral_attributions ra WHERE ra.direct_partner_id = p.id AND ra.status <> 'REJECTED'), 0)::bigint AS l1_total,
        COALESCE((SELECT COUNT(*) FROM referral_attributions ra WHERE ra.second_level_partner_id = p.id AND ra.status <> 'REJECTED'), 0)::bigint AS l2_total,
        COALESCE((SELECT COUNT(*) FROM referral_attributions ra WHERE ra.direct_partner_id = p.id AND ra.qualified_at IS NOT NULL AND ra.status = 'LOCKED'), 0)::bigint AS l1_paid,
        COALESCE((SELECT COUNT(*) FROM referral_attributions ra WHERE ra.second_level_partner_id = p.id AND ra.qualified_at IS NOT NULL AND ra.status = 'LOCKED'), 0)::bigint AS l2_paid,
        COALESCE((SELECT COUNT(*) FROM partner_link_clicks c WHERE c.partner_id = p.id), 0)::bigint AS total_clicks,
        w.currency, w.pending_minor, w.held_minor, w.available_minor,
        w.locked_for_payout_minor, w.paid_minor, w.reversed_minor, w.debt_minor
      FROM partners p
      LEFT JOIN ambassador_profiles a ON a.partner_id = p.id
      LEFT JOIN wallet_projections w ON w.partner_id = p.id
      WHERE ${field} = $1
    `, [value]);
    const row = result.rows[0];
    if (!row) return null;

    const activeL1PaidCount = safeInteger(row.qualified_active_paid_l1, 'qualified_active_paid_l1');
    const resolved = resolveRank(activeL1PaidCount, DEFAULT_RANK_RULES) ?? DEFAULT_RANK_RULES[0];
    const currentRuleIndex = DEFAULT_RANK_RULES.findIndex((rule) => rule.rank === resolved.rank);
    const nextRule = DEFAULT_RANK_RULES[currentRuleIndex + 1];
    const targetThreshold = nextRule?.minQualifiedActivePaidL1 ?? resolved.minQualifiedActivePaidL1;

    return {
      partner: {
        id: requiredString(row.id, 'id'),
        userId: requiredString(row.user_id, 'user_id'),
        referralCode: requiredString(row.referral_code, 'referral_code'),
        rank: requiredString(row.rank, 'rank'),
        effectiveRank: resolved.rank,
        partnerRateBps: resolved.rateBps,
        rankState: requiredString(row.rank_state, 'rank_state'),
        qualityStatus: requiredString(row.quality_status, 'quality_status'),
        ambassadorTier: requiredString(row.ambassador_tier, 'ambassador_tier'),
        isAmbassadorApproved: row.ambassador_approved === true,
        activeL1PaidCount,
        activeL2PaidCount: safeInteger(row.l2_paid, 'l2_paid'),
        totalL1Count: safeInteger(row.l1_total, 'l1_total'),
        totalL2Count: safeInteger(row.l2_total, 'l2_total'),
        totalClicks: safeInteger(row.total_clicks, 'total_clicks'),
        createdAt: requiredIso(row.created_at, 'created_at')
      },
      wallet: {
        partnerId: requiredString(row.id, 'id'),
        pendingMinor: safeInteger(row.pending_minor ?? 0, 'pending_minor'),
        heldMinor: safeInteger(row.held_minor ?? 0, 'held_minor'),
        availableMinor: safeInteger(row.available_minor ?? 0, 'available_minor'),
        lockedPayoutMinor: safeInteger(row.locked_for_payout_minor ?? 0, 'locked_for_payout_minor'),
        paidTotalMinor: safeInteger(row.paid_minor ?? 0, 'paid_minor'),
        reversedMinor: safeInteger(row.reversed_minor ?? 0, 'reversed_minor'),
        debtMinor: safeInteger(row.debt_minor ?? 0, 'debt_minor'),
        currency: requiredString(row.currency ?? 'UAH', 'currency')
      },
      rankProgress: {
        currentPaidL1: activeL1PaidCount,
        nextRank: nextRule?.rank ?? 'MAX',
        targetThreshold,
        remainingToNext: nextRule ? Math.max(0, nextRule.minQualifiedActivePaidL1 - activeL1PaidCount) : 0,
        percentageToNext: nextRule ? Math.min(100, Math.round((activeL1PaidCount / nextRule.minQualifiedActivePaidL1) * 100)) : 100
      }
    };
  }

  async getDashboard(partnerId: string): Promise<PersistedPartnerDashboard | null> {
    return this.getDashboardBy('p.id', partnerId);
  }

  async getDashboardForUser(userId: string): Promise<PersistedPartnerDashboard | null> {
    return this.getDashboardBy('p.user_id', userId);
  }

  async getPartnerIdForUser(userId: string): Promise<string | null> {
    const result = await this.database.query<Record<string, unknown>>('SELECT id FROM partners WHERE user_id = $1', [userId]);
    return result.rows[0] ? requiredString(result.rows[0].id, 'partner_id') : null;
  }

  async findPartnerByReferralCode(referralCode: string): Promise<{ id: string; referralCode: string } | null> {
    const result = await this.database.query<Record<string, unknown>>(
      'SELECT id, referral_code FROM partners WHERE referral_code = $1',
      [referralCode]
    );
    const row = result.rows[0];
    return row ? { id: requiredString(row.id, 'partner_id'), referralCode: requiredString(row.referral_code, 'referral_code') } : null;
  }

  async createCampaignLink(partnerId: string, campaign: string, content = ''): Promise<{ id: string }> {
    if (!/^[A-Za-z0-9._~-]{1,64}$/.test(campaign) || !/^[A-Za-z0-9._~-]{0,64}$/.test(content)) throw new Error('INVALID_CAMPAIGN_PARAMETERS');
    const id = randomUUID();
    const result = await this.database.query<Record<string, unknown>>(`
      INSERT INTO partner_campaign_links (id, partner_id, campaign, content)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (partner_id, campaign, content)
      DO UPDATE SET campaign = EXCLUDED.campaign
      RETURNING id
    `, [id, partnerId, campaign, content]);
    return { id: requiredString(result.rows[0]?.id, 'campaign_link_id') };
  }

  async recordClick(input: { partnerId: string; referralCode: string; campaignLinkId?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; requestId?: string; ipHash?: string }): Promise<void> {
    await this.database.query(`
      INSERT INTO partner_link_clicks (partner_id, campaign_link_id, referral_code, utm_source, utm_medium, utm_campaign, utm_content, request_id, ip_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [input.partnerId, input.campaignLinkId ?? null, input.referralCode, input.utmSource ?? null, input.utmMedium ?? null, input.utmCampaign ?? null, input.utmContent ?? null, input.requestId ?? null, input.ipHash ?? null]);
  }

  async listLedger(partnerId: string, limit = 100): Promise<PersistedLedgerEntry[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_LEDGER_PAGE');
    const result = await this.database.query<Record<string, unknown>>(`
      SELECT
        lt.id,
        lt.id AS transaction_id,
        lt.created_at,
        MAX(CASE WHEN other_line.direction = 'DEBIT' THEN other_line.account_code END) AS debit_account,
        MAX(CASE WHEN other_line.direction = 'CREDIT' THEN other_line.account_code END) AS credit_account,
        partner_line.amount_minor,
        partner_line.currency,
        partner_line.partner_id,
        lt.source,
        lt.idempotency_key
      FROM ledger_transactions lt
      JOIN ledger_lines partner_line ON partner_line.transaction_id = lt.id AND partner_line.partner_id = $1
      JOIN ledger_lines other_line ON other_line.transaction_id = lt.id
      GROUP BY lt.id, lt.created_at, partner_line.amount_minor, partner_line.currency, partner_line.partner_id, lt.source, lt.idempotency_key
      ORDER BY lt.created_at DESC, lt.id DESC
      LIMIT $2
    `, [partnerId, limit]);
    return result.rows.map((row) => ({
      id: requiredString(row.id, 'ledger_id'),
      transactionId: requiredString(row.transaction_id, 'transaction_id'),
      timestamp: requiredIso(row.created_at, 'ledger_created_at'),
      debitAccount: requiredString(row.debit_account, 'debit_account'),
      creditAccount: requiredString(row.credit_account, 'credit_account'),
      amountMinor: safeInteger(row.amount_minor, 'ledger_amount_minor'),
      currency: requiredString(row.currency, 'ledger_currency'),
      partnerId: requiredString(row.partner_id, 'ledger_partner_id'),
      description: requiredString(row.source, 'ledger_source'),
      idempotencyKey: requiredString(row.idempotency_key, 'ledger_idempotency_key')
    }));
  }

  async listPayouts(partnerId: string, limit = 100): Promise<PersistedPayout[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_PAYOUT_PAGE');
    const result = await this.database.query<Record<string, unknown>>(`
      SELECT pr.id, pr.partner_id, pr.requested_amount_minor, pr.currency,
             pm.provider, pm.destination_last4, pr.status, pr.idempotency_key,
             pr.created_at, pr.updated_at, pr.failure_reason
      FROM payout_requests pr
      JOIN payout_methods pm ON pm.id = pr.payout_method_id
      WHERE pr.partner_id = $1
      ORDER BY pr.created_at DESC, pr.id DESC
      LIMIT $2
    `, [partnerId, limit]);
    return result.rows.map((row) => ({
      id: requiredString(row.id, 'payout_id'),
      partnerId: requiredString(row.partner_id, 'payout_partner_id'),
      amountMinor: safeInteger(row.requested_amount_minor, 'payout_amount_minor'),
      currency: requiredString(row.currency, 'payout_currency'),
      provider: requiredString(row.provider, 'payout_provider'),
      destinationAccount: `•••• ${requiredString(row.destination_last4, 'payout_destination_last4')}`,
      status: requiredString(row.status, 'payout_status'),
      idempotencyKey: requiredString(row.idempotency_key, 'payout_idempotency_key'),
      requestedAt: requiredIso(row.created_at, 'payout_created_at'),
      completedAt: row.status === 'PAID' ? optionalIso(row.updated_at) : undefined,
      failureReason: row.failure_reason ? String(row.failure_reason) : undefined
    }));
  }

  async listNetwork(partnerId: string, level: 'L1' | 'L2', limit: number, offset: number): Promise<PersistedNetworkPage> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) throw new Error('INVALID_NETWORK_PAGE');
    const where = level === 'L1' ? 'ra.direct_partner_id = $1' : 'ra.second_level_partner_id = $1';
    const countResult = await this.database.query<Record<string, unknown>>(`
      SELECT
        COUNT(*) FILTER (WHERE ${where} AND ra.status <> 'REJECTED')::bigint AS count,
        COUNT(*) FILTER (WHERE ${where} AND ra.status = 'LOCKED' AND ra.qualified_at IS NOT NULL)::bigint AS active_paid_count
      FROM referral_attributions ra
    `, [partnerId]);
    const countRow = countResult.rows[0] ?? {};
    const count = safeInteger(countRow.count ?? 0, 'network_count');
    const activePaidCount = safeInteger(countRow.active_paid_count ?? 0, 'network_active_paid_count');
    const page = await this.database.query<Record<string, unknown>>(`
      SELECT
        ra.id,
        'Користувач #' || SUBSTRING(md5(ra.user_id), 1, 8) AS user_anonymous_label,
        ra.source_channel, ra.campaign, ra.status AS attribution_status,
        ra.qualified_at,
        s.plan_code,
        COALESCE(latest_qp.qcb_amount_minor, 0)::bigint AS qcb_amount_minor,
        u.created_at AS registered_at,
        latest_qp.qualified_at AS last_payment_at
      FROM referral_attributions ra
      JOIN users u ON u.id = ra.user_id
      LEFT JOIN subscriptions s ON s.user_id = ra.user_id
      LEFT JOIN LATERAL (
        SELECT qp.qcb_amount_minor, qp.qualified_at
        FROM qualified_payments qp
        WHERE qp.attribution_id = ra.id
        ORDER BY qp.qualified_at DESC
        LIMIT 1
      ) latest_qp ON true
      WHERE ${where} AND ra.status <> 'REJECTED'
      ORDER BY ra.attributed_at DESC, ra.id DESC
      LIMIT $2 OFFSET $3
    `, [partnerId, limit, offset]);

    const items = page.rows.map((row) => ({
      id: requiredString(row.id, 'attribution_id'),
      userAnonymousLabel: requiredString(row.user_anonymous_label, 'user_anonymous_label'),
      sourceChannel: requiredString(row.source_channel, 'source_channel'),
      utmCampaign: row.campaign ? String(row.campaign) : undefined,
      isQualifiedPaid: Boolean(row.qualified_at),
      subscriptionPlan: row.plan_code ? String(row.plan_code) : undefined,
      monthlyQcbMinor: safeInteger(row.qcb_amount_minor ?? 0, 'qcb_amount_minor'),
      registeredAt: requiredIso(row.registered_at, 'registered_at'),
      lastPaymentAt: optionalIso(row.last_payment_at),
      status: networkStatus(row)
    }));
    return { count, activePaidCount, offset, limit, hasMore: offset + items.length < count, items };
  }
}
