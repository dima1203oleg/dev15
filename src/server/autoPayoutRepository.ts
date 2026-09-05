import type { QueryResultRow } from 'pg';
import type { PostgresBoundary } from './postgresBoundary';

export type AutoPayoutCadence = 'MONTHLY' | 'THRESHOLD';
export type AutoPayoutCurrency = 'USD' | 'UAH' | 'EUR' | 'PLN';

export interface AutoPayoutPolicyProjection {
  partnerId: string;
  enabled: boolean;
  cadence: AutoPayoutCadence;
  thresholdMinor: string;
  currency: AutoPayoutCurrency;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_AUTO_PAYOUT_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_AUTO_PAYOUT_VALUE:${field}`);
  return date.toISOString();
}

function requiredPositiveMinor(value: unknown, field: string): string {
  try {
    const parsed = typeof value === 'bigint' ? value : BigInt(String(value));
    if (parsed <= 0n) throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`INVALID_AUTO_PAYOUT_VALUE:${field}`);
  }
}

function cadenceValue(value: unknown): AutoPayoutCadence {
  if (value !== 'MONTHLY' && value !== 'THRESHOLD') throw new Error('INVALID_AUTO_PAYOUT_VALUE:cadence');
  return value;
}

function currencyValue(value: unknown): AutoPayoutCurrency {
  if (value !== 'USD' && value !== 'UAH' && value !== 'EUR' && value !== 'PLN') throw new Error('INVALID_AUTO_PAYOUT_VALUE:currency');
  return value;
}

function mapPolicy(row: QueryResultRow): AutoPayoutPolicyProjection {
  return {
    partnerId: requiredString(row.partner_id, 'partner_id'),
    enabled: row.enabled === true,
    cadence: cadenceValue(row.cadence),
    thresholdMinor: requiredPositiveMinor(row.threshold_minor, 'threshold_minor'),
    currency: currencyValue(row.currency),
    updatedBy: requiredString(row.updated_by, 'updated_by'),
    createdAt: requiredIso(row.created_at, 'created_at'),
    updatedAt: requiredIso(row.updated_at, 'updated_at')
  };
}

/** Persists user intent for auto-payout without claiming that a provider ran it. */
export class AutoPayoutRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async getForPartner(partnerIdValue: string): Promise<AutoPayoutPolicyProjection | null> {
    const partnerId = requiredString(partnerIdValue, 'partner_id');
    const result = await this.database.query(`
      SELECT partner_id, enabled, cadence, threshold_minor, currency, updated_by, created_at, updated_at
      FROM auto_payout_policies
      WHERE partner_id = $1
    `, [partnerId]);
    return result.rows[0] ? mapPolicy(result.rows[0]) : null;
  }

  async upsert(input: {
    partnerId: string;
    enabled: boolean;
    cadence: AutoPayoutCadence;
    thresholdMinor: string | bigint;
    currency: AutoPayoutCurrency;
    updatedBy: string;
    updatedAt: string;
  }): Promise<AutoPayoutPolicyProjection> {
    const partnerId = requiredString(input.partnerId, 'partner_id');
    if (typeof input.enabled !== 'boolean') throw new Error('INVALID_AUTO_PAYOUT_VALUE:enabled');
    const cadence = cadenceValue(input.cadence);
    const thresholdMinor = requiredPositiveMinor(input.thresholdMinor, 'threshold_minor');
    const currency = currencyValue(input.currency);
    const updatedBy = requiredString(input.updatedBy, 'updated_by');
    const updatedAt = requiredIso(input.updatedAt, 'updated_at');
    return this.database.withTransaction(async (client) => {
      const partner = await client.query('SELECT id FROM partners WHERE id = $1 FOR UPDATE', [partnerId]);
      if (!partner.rows[0]) throw new Error('PARTNER_NOT_FOUND');
      const previous = await client.query(`
        SELECT partner_id, enabled, cadence, threshold_minor, currency, updated_by, created_at, updated_at
        FROM auto_payout_policies
        WHERE partner_id = $1
        FOR UPDATE
      `, [partnerId]);
      const result = await client.query(`
        INSERT INTO auto_payout_policies (partner_id, enabled, cadence, threshold_minor, currency, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (partner_id) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          cadence = EXCLUDED.cadence,
          threshold_minor = EXCLUDED.threshold_minor,
          currency = EXCLUDED.currency,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
        RETURNING partner_id, enabled, cadence, threshold_minor, currency, updated_by, created_at, updated_at
      `, [partnerId, input.enabled, cadence, thresholdMinor, currency, updatedBy, updatedAt]);
      const policy = mapPolicy(result.rows[0]);
      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_entity, target_id, previous_value, new_value, reason)
        VALUES ($1, 'AUTO_PAYOUT_POLICY_UPDATED', 'AUTO_PAYOUT_POLICY', $2, $3::jsonb, $4::jsonb, $5)
      `, [updatedBy, partnerId, previous.rows[0] ? JSON.stringify(mapPolicy(previous.rows[0])) : null, JSON.stringify(policy), input.enabled ? 'Partner enabled automatic payout preference.' : 'Partner disabled automatic payout preference.']);
      return policy;
    });
  }
}
