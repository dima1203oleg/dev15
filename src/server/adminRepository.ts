import type { QueryResultRow } from 'pg';
import type { PostgresBoundary } from './postgresBoundary';

export interface AdminOverviewProjection {
  status: 'LIVE';
  asOf: string;
  subscriptions: {
    activeTrials: number;
    paidSubscribers: number;
    trialToPaidUsers: number;
  };
  finance: {
    qualifiedRevenueByCurrency: Array<{ currency: string; amountMinor: string }>;
    partnerCommissionByCurrency: Array<{ currency: string; amountMinor: string }>;
    outstandingLiabilitiesByCurrency: Array<{ currency: string; amountMinor: string }>;
    pendingPayouts: number;
    mrr: null;
    contributionMargin: null;
    unavailableMetrics: string[];
  };
  risk: {
    openFraudCases: number;
    chargebacks: number;
    qualityReviews: number;
  };
  topPartners: Array<{ partnerId: string; qualifiedActivePaidL1: number; rank: string; qualityStatus: string }>;
}

function safeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`UNSAFE_ADMIN_VALUE:${field}`);
  return parsed;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`INVALID_ADMIN_VALUE:${field}`);
  return value;
}

function moneyRows(rows: QueryResultRow[], field: string): Array<{ currency: string; amountMinor: string }> {
  return rows.map((row) => ({ currency: requiredString(row.currency, `${field}_currency`), amountMinor: requiredString(String(row.amount_minor), `${field}_amount`) }));
}

/** Read-only admin projection from durable records; no mutable balances are used. */
export class AdminRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async getOverview(asOf = new Date().toISOString()): Promise<AdminOverviewProjection> {
    const normalizedAsOf = new Date(asOf);
    if (!Number.isFinite(normalizedAsOf.getTime())) throw new Error('INVALID_ADMIN_VALUE:as_of');
    const at = normalizedAsOf.toISOString();
    const [subscription, revenue, commissions, liabilities, payout, risk, topPartners] = await Promise.all([
      this.database.query(`
        SELECT
          (SELECT COUNT(*) FROM subscriptions WHERE state IN ('TRIAL_ACTIVE', 'TRIAL_ENDING'))::int AS active_trials,
          (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE state = 'PREMIUM_ACTIVE')::int AS paid_subscribers,
          (SELECT COUNT(DISTINCT paid.user_id)
           FROM subscriptions paid
           WHERE paid.state = 'PREMIUM_ACTIVE'
             AND EXISTS (SELECT 1 FROM subscriptions trial WHERE trial.user_id = paid.user_id AND trial.trial_ends_at IS NOT NULL))::int AS trial_to_paid_users
      `),
      this.database.query(`
        SELECT qp.currency,
               COALESCE(SUM(GREATEST(qp.qcb_amount_minor - COALESCE(adjustments.amount_minor, 0), 0)), 0)::numeric AS amount_minor
        FROM qualified_payments qp
        LEFT JOIN (
          SELECT payment_id, SUM(amount_minor)::bigint AS amount_minor
          FROM payment_adjustments
          GROUP BY payment_id
        ) adjustments ON adjustments.payment_id = qp.payment_id
        GROUP BY qp.currency ORDER BY qp.currency
      `),
      this.database.query(`
        SELECT currency, COALESCE(SUM(rounded_commission_minor) FILTER (WHERE state NOT IN ('REVERSED', 'ADJUSTED')), 0)::numeric AS amount_minor
        FROM commissions GROUP BY currency ORDER BY currency
      `),
      this.database.query(`
        SELECT currency, COALESCE(SUM(pending_minor + held_minor + available_minor + locked_for_payout_minor), 0)::numeric AS amount_minor
        FROM wallet_projections GROUP BY currency ORDER BY currency
      `),
      this.database.query(`SELECT COUNT(*)::int AS count FROM payout_requests WHERE status IN ('REQUESTED', 'VALIDATING', 'PAYOUT_HELD', 'PROCESSING')`),
      this.database.query(`
        SELECT
          (SELECT COUNT(*) FROM fraud_cases WHERE status IN ('REVIEW', 'BLOCKED'))::int AS open_fraud_cases,
          (SELECT COUNT(*) FROM payment_adjustments WHERE kind = 'CHARGEBACK')::int AS chargebacks,
          (SELECT COUNT(*) FROM partner_quality_scores WHERE status IN ('QUALITY_REVIEW', 'QUALITY_RESTRICTED'))::int AS quality_reviews
      `),
      this.database.query(`
        SELECT id, qualified_active_paid_l1, rank, quality_status
        FROM partners ORDER BY qualified_active_paid_l1 DESC, id ASC LIMIT 100
      `)
    ]);
    const subscriptionRow = subscription.rows[0] ?? {};
    const riskRow = risk.rows[0] ?? {};
    return {
      status: 'LIVE',
      asOf: at,
      subscriptions: {
        activeTrials: safeInteger(subscriptionRow.active_trials ?? 0, 'active_trials'),
        paidSubscribers: safeInteger(subscriptionRow.paid_subscribers ?? 0, 'paid_subscribers'),
        trialToPaidUsers: safeInteger(subscriptionRow.trial_to_paid_users ?? 0, 'trial_to_paid_users')
      },
      finance: {
        qualifiedRevenueByCurrency: moneyRows(revenue.rows, 'qualified_revenue'),
        partnerCommissionByCurrency: moneyRows(commissions.rows, 'partner_commission'),
        outstandingLiabilitiesByCurrency: moneyRows(liabilities.rows, 'outstanding_liability'),
        pendingPayouts: safeInteger(payout.rows[0]?.count ?? 0, 'pending_payouts'),
        mrr: null,
        contributionMargin: null,
        unavailableMetrics: ['MRR_REQUIRES_ACTIVE_PRICE_BOOK', 'CONTRIBUTION_MARGIN_REQUIRES_SETTLEMENT_COSTS']
      },
      risk: {
        openFraudCases: safeInteger(riskRow.open_fraud_cases ?? 0, 'open_fraud_cases'),
        chargebacks: safeInteger(riskRow.chargebacks ?? 0, 'chargebacks'),
        qualityReviews: safeInteger(riskRow.quality_reviews ?? 0, 'quality_reviews')
      },
      topPartners: topPartners.rows.map((row) => ({
        partnerId: requiredString(row.id, 'top_partner_id'),
        qualifiedActivePaidL1: safeInteger(row.qualified_active_paid_l1, 'top_partner_l1'),
        rank: requiredString(row.rank, 'top_partner_rank'),
        qualityStatus: requiredString(row.quality_status, 'top_partner_quality')
      }))
    };
  }
}
