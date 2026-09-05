import type { QueryResultRow } from 'pg';
import type { PostgresBoundary } from './postgresBoundary';

export type FinancialRuleState = 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'SCHEDULED' | 'ACTIVE';

export interface FinancialRuleVersion {
  version: string;
  ruleType: string;
  state: FinancialRuleState;
  value: Record<string, unknown>;
  createdBy: string;
  approvedBy?: string;
  effectiveFrom?: string;
  reason: string;
  createdAt: string;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_RULE_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_RULE_VALUE:${field}`);
  return date.toISOString();
}

function ruleToken(value: unknown, field: string): string {
  const token = requiredString(value, field);
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(token)) throw new Error(`INVALID_RULE_VALUE:${field}`);
  return token;
}

function ruleValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_RULE_VALUE:value');
  return value as Record<string, unknown>;
}

function mapRule(row: QueryResultRow): FinancialRuleVersion {
  return {
    version: ruleToken(row.version, 'version'),
    ruleType: ruleToken(row.rule_type, 'rule_type'),
    state: row.state as FinancialRuleState,
    value: ruleValue(row.value),
    createdBy: requiredString(row.created_by, 'created_by'),
    approvedBy: row.approved_by ? requiredString(row.approved_by, 'approved_by') : undefined,
    effectiveFrom: row.effective_from ? requiredIso(row.effective_from, 'effective_from') : undefined,
    reason: requiredString(row.reason, 'reason'),
    createdAt: requiredIso(row.created_at, 'created_at')
  };
}

function auditValue(rule: FinancialRuleVersion): string {
  return JSON.stringify({ state: rule.state, value: rule.value, approvedBy: rule.approvedBy, effectiveFrom: rule.effectiveFrom });
}

/**
 * Maker/checker boundary for financial configuration. Rules are mutable only
 * through the finite lifecycle; money records retain the selected version and
 * are never recalculated when a later rule becomes active.
 */
export class FinancialRuleRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async list(ruleType?: string): Promise<FinancialRuleVersion[]> {
    const result = await this.database.query(`
      SELECT version, rule_type, state, value, created_by, approved_by, effective_from, reason, created_at
      FROM financial_rule_versions
      WHERE ($1::text IS NULL OR rule_type = $1)
      ORDER BY created_at DESC, version DESC
    `, [ruleType ?? null]);
    return result.rows.map(mapRule);
  }

  async createDraft(input: { version: string; ruleType: string; value: Record<string, unknown>; createdBy: string; reason: string }): Promise<FinancialRuleVersion> {
    const version = ruleToken(input.version, 'version');
    const ruleType = ruleToken(input.ruleType, 'rule_type');
    const createdBy = requiredString(input.createdBy, 'created_by');
    const reason = requiredString(input.reason, 'reason');
    const value = ruleValue(input.value);
    return this.database.withTransaction(async (client) => {
      const result = await client.query(`
        INSERT INTO financial_rule_versions (version, rule_type, state, value, created_by, reason)
        VALUES ($1, $2, 'DRAFT', $3::jsonb, $4, $5)
        RETURNING version, rule_type, state, value, created_by, approved_by, effective_from, reason, created_at
      `, [version, ruleType, JSON.stringify(value), createdBy, reason]);
      const rule = mapRule(result.rows[0]);
      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_entity, target_id, previous_value, new_value, reason)
        VALUES ($1, 'FINANCIAL_RULE_DRAFT_CREATED', 'FINANCIAL_RULE_VERSION', $2, NULL, $3::jsonb, $4)
      `, [createdBy, version, auditValue(rule), reason]);
      return rule;
    });
  }

  async transition(versionValue: string, action: 'VALIDATE' | 'APPROVE' | 'SCHEDULE', actorId: string, effectiveFrom?: string): Promise<FinancialRuleVersion> {
    const version = ruleToken(versionValue, 'version');
    const actor = requiredString(actorId, 'actor_id');
    const scheduledAt = action === 'SCHEDULE' ? requiredIso(effectiveFrom, 'effective_from') : undefined;
    return this.database.withTransaction(async (client) => {
      const result = await client.query(`
        SELECT version, rule_type, state, value, created_by, approved_by, effective_from, reason, created_at
        FROM financial_rule_versions
        WHERE version = $1
        FOR UPDATE
      `, [version]);
      if (!result.rows[0]) throw new Error('FINANCIAL_RULE_NOT_FOUND');
      const previous = mapRule(result.rows[0]);
      const expectedState: Record<typeof action, FinancialRuleState> = { VALIDATE: 'DRAFT', APPROVE: 'VALIDATED', SCHEDULE: 'APPROVED' };
      if (previous.state !== expectedState[action]) throw new Error('INVALID_FINANCIAL_RULE_TRANSITION');
      if (action === 'APPROVE' && previous.createdBy === actor) throw new Error('MAKER_CHECKER_REQUIRED');
      const nextState: FinancialRuleState = action === 'VALIDATE' ? 'VALIDATED' : action === 'APPROVE' ? 'APPROVED' : 'SCHEDULED';
      const next = await client.query(`
        UPDATE financial_rule_versions
        SET state = $2,
            approved_by = CASE WHEN $2 = 'APPROVED' THEN $3 ELSE approved_by END,
            effective_from = CASE WHEN $2 = 'SCHEDULED' THEN $4 ELSE effective_from END
        WHERE version = $1
        RETURNING version, rule_type, state, value, created_by, approved_by, effective_from, reason, created_at
      `, [version, nextState, action === 'APPROVE' ? actor : null, scheduledAt ?? null]);
      const updated = mapRule(next.rows[0]);
      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_entity, target_id, previous_value, new_value, reason)
        VALUES ($1, $2, 'FINANCIAL_RULE_VERSION', $3, $4::jsonb, $5::jsonb, $6)
      `, [actor, `FINANCIAL_RULE_${action.toLowerCase()}`, version, auditValue(previous), auditValue(updated), previous.reason]);
      return updated;
    });
  }
}
