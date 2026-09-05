import { randomUUID } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import {
  ambassadorTierForQualifiedL1,
  newlyUnlockedAchievements,
  type AmbassadorTier,
  type AchievementThreshold,
  type LeaderboardMetric
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';

export interface PartnerAchievement {
  id: string;
  threshold: number;
  label: string;
  unlockedAt: string;
}

export interface AmbassadorProjection {
  partnerId: string;
  tier: AmbassadorTier;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt: string;
}

export interface LeaderboardProjection {
  snapshotId: string;
  metric: LeaderboardMetric;
  position: number;
  partnerId: string;
  score: string;
  publicProfileOptIn: boolean;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_ENGAGEMENT_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_ENGAGEMENT_VALUE:${field}`);
  return date.toISOString();
}

function safeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`UNSAFE_ENGAGEMENT_VALUE:${field}`);
  return parsed;
}

function metricValue(value: unknown): LeaderboardMetric {
  const metric = String(value);
  if (!['WEEKLY', 'MONTHLY', 'GROWTH', 'QUALIFIED_L1', 'REVENUE', 'ALL_TIME', 'REGIONAL'].includes(metric)) throw new Error('INVALID_LEADERBOARD_METRIC');
  return metric as LeaderboardMetric;
}

function mapAchievement(row: QueryResultRow): PartnerAchievement {
  return {
    id: requiredString(row.id, 'achievement_id'),
    threshold: safeInteger(row.threshold, 'achievement_threshold'),
    label: requiredString(row.label, 'achievement_label'),
    unlockedAt: requiredIso(row.unlocked_at, 'achievement_unlocked_at')
  };
}

function mapAmbassador(row: QueryResultRow): AmbassadorProjection {
  return {
    partnerId: requiredString(row.partner_id, 'ambassador_partner_id'),
    tier: String(row.tier) as AmbassadorTier,
    approved: row.approved === true,
    approvedBy: row.approved_by ? requiredString(row.approved_by, 'ambassador_approved_by') : undefined,
    approvedAt: row.approved_at ? requiredIso(row.approved_at, 'ambassador_approved_at') : undefined,
    updatedAt: requiredIso(row.updated_at, 'ambassador_updated_at')
  };
}

function periodForMetric(metric: LeaderboardMetric, start?: string, end?: string): { start: string | null; end: string | null } {
  const normalizedEnd = end ? requiredIso(end, 'period_end') : new Date().toISOString();
  if (metric === 'ALL_TIME' || metric === 'QUALIFIED_L1' || metric === 'REVENUE') return { start: start ? requiredIso(start, 'period_start') : null, end: normalizedEnd };
  const defaultDays = metric === 'WEEKLY' || metric === 'GROWTH' ? 7 : 30;
  const defaultStart = new Date(new Date(normalizedEnd).getTime() - defaultDays * 24 * 60 * 60 * 1000).toISOString();
  return { start: start ? requiredIso(start, 'period_start') : defaultStart, end: normalizedEnd };
}

/** Durable achievements, Ambassador projection and leaderboard snapshot boundary. */
export class PartnerEngagementRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async syncPartner(partnerIdValue: string, occurredAtValue: string): Promise<{ achievements: PartnerAchievement[]; ambassador: AmbassadorProjection; ambassadorChanged: boolean }> {
    const partnerId = requiredString(partnerIdValue, 'partner_id');
    const occurredAt = requiredIso(occurredAtValue, 'occurred_at');
    return this.database.withTransaction(async (client) => this.syncPartnerWithClient(client, partnerId, occurredAt));
  }

  async syncPartnerWithClient(client: PoolClient, partnerIdValue: string, occurredAtValue: string): Promise<{ achievements: PartnerAchievement[]; ambassador: AmbassadorProjection; ambassadorChanged: boolean }> {
    const partnerId = requiredString(partnerIdValue, 'partner_id');
    const occurredAt = requiredIso(occurredAtValue, 'occurred_at');
    const partner = await client.query(`SELECT qualified_active_paid_l1 FROM partners WHERE id = $1 FOR UPDATE`, [partnerId]);
    if (!partner.rows[0]) throw new Error('PARTNER_NOT_FOUND');
    const currentCount = safeInteger(partner.rows[0].qualified_active_paid_l1, 'qualified_active_paid_l1');
    const existing = await client.query(`
      SELECT a.threshold
      FROM partner_achievements pa
      JOIN achievements a ON a.id = pa.achievement_id
      WHERE pa.partner_id = $1
    `, [partnerId]);
    const previousCount = Math.max(0, ...existing.rows.map((row) => safeInteger(row.threshold, 'achievement_threshold')));
    const targetThresholds = new Set<AchievementThreshold>(newlyUnlockedAchievements(previousCount, currentCount));
    const achievements: PartnerAchievement[] = [];
    for (const threshold of targetThresholds) {
      const result = await client.query(`
        INSERT INTO partner_achievements (partner_id, achievement_id, unlocked_at)
        SELECT $1, a.id, $2
        FROM achievements a
        WHERE a.threshold = $3
        ON CONFLICT (partner_id, achievement_id) DO NOTHING
        RETURNING achievement_id, unlocked_at
      `, [partnerId, occurredAt, threshold]);
      if (result.rows[0]) {
        const details = await client.query('SELECT id, threshold, label FROM achievements WHERE id = $1', [result.rows[0].achievement_id]);
        const achievement = mapAchievement({ ...details.rows[0], unlocked_at: result.rows[0].unlocked_at });
        achievements.push(achievement);
        await client.query(`
          INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
          VALUES ('ACHIEVEMENT_UNLOCKED', 'PARTNER', $1, $2::jsonb, $3)
        `, [partnerId, JSON.stringify({ achievementId: achievement.id, threshold: achievement.threshold }), occurredAt]);
      }
    }

    const previousAmbassadorResult = await client.query(`SELECT tier, approved FROM ambassador_profiles WHERE partner_id = $1 FOR UPDATE`, [partnerId]);
    const approved = previousAmbassadorResult.rows[0]?.approved === true;
    const tier = ambassadorTierForQualifiedL1(currentCount, approved);
    const previousTier = previousAmbassadorResult.rows[0]?.tier as AmbassadorTier | undefined;
    const ambassadorResult = await client.query(`
      INSERT INTO ambassador_profiles (partner_id, tier, approved, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (partner_id) DO UPDATE SET tier = EXCLUDED.tier, updated_at = EXCLUDED.updated_at
      RETURNING partner_id, tier, approved, approved_by, approved_at, updated_at
    `, [partnerId, tier, approved, occurredAt]);
    const ambassador = mapAmbassador(ambassadorResult.rows[0]);
    const ambassadorChanged = previousTier !== undefined && previousTier !== tier;
    if (ambassadorChanged || (previousTier === undefined && tier !== 'NONE')) {
      await client.query(`
        INSERT INTO event_outbox (event_type, aggregate_type, aggregate_id, payload, occurred_at)
        VALUES ('AMBASSADOR_ELIGIBILITY_CHANGED', 'PARTNER', $1, $2::jsonb, $3)
      `, [partnerId, JSON.stringify({ previousTier: previousTier ?? 'NONE', tier }), occurredAt]);
    }
    return { achievements, ambassador, ambassadorChanged };
  }

  async listAchievements(partnerIdValue: string): Promise<PartnerAchievement[]> {
    const partnerId = requiredString(partnerIdValue, 'partner_id');
    const result = await this.database.query(`
      SELECT a.id, a.threshold, a.label, pa.unlocked_at
      FROM partner_achievements pa JOIN achievements a ON a.id = pa.achievement_id
      WHERE pa.partner_id = $1 ORDER BY a.threshold ASC
    `, [partnerId]);
    return result.rows.map(mapAchievement);
  }

  async getAmbassador(partnerIdValue: string): Promise<AmbassadorProjection | null> {
    const partnerId = requiredString(partnerIdValue, 'partner_id');
    const result = await this.database.query(`
      SELECT partner_id, tier, approved, approved_by, approved_at, updated_at
      FROM ambassador_profiles WHERE partner_id = $1
    `, [partnerId]);
    return result.rows[0] ? mapAmbassador(result.rows[0]) : null;
  }

  async createLeaderboardSnapshot(input: { metric: LeaderboardMetric; snapshotKey: string; periodStart?: string; periodEnd?: string }): Promise<{ status: 'CREATED' | 'DUPLICATE'; snapshotId: string; entries: number }> {
    const metric = metricValue(input.metric);
    if (metric === 'REGIONAL') throw new Error('REGION_NOT_AVAILABLE');
    const snapshotKey = requiredString(input.snapshotKey, 'snapshot_key');
    const period = periodForMetric(metric, input.periodStart, input.periodEnd);
    return this.database.withTransaction(async (client) => {
      const existing = await client.query(`SELECT id FROM leaderboard_snapshots WHERE idempotency_key = $1 FOR UPDATE`, [snapshotKey]);
      if (existing.rows[0]) return { status: 'DUPLICATE' as const, snapshotId: requiredString(existing.rows[0].id, 'snapshot_id'), entries: 0 };
      const snapshot = await client.query(`
        INSERT INTO leaderboard_snapshots (id, metric, period_start, period_end, idempotency_key)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [randomUUID(), metric, period.start, period.end, snapshotKey]);
      const snapshotId = requiredString(snapshot.rows[0].id, 'snapshot_id');
      const scoreExpression = metric === 'REVENUE' || metric === 'ALL_TIME'
        ? `COALESCE((SELECT SUM(c.rounded_commission_minor)::numeric FROM commissions c WHERE c.partner_id = p.id AND c.state NOT IN ('REVERSED', 'ADJUSTED') AND ($1::timestamptz IS NULL OR c.created_at >= $1) AND c.created_at <= $2), 0)::numeric`
        : `COALESCE((SELECT COUNT(DISTINCT ra.id)::numeric FROM referral_attributions ra WHERE ra.direct_partner_id = p.id AND ra.status = 'LOCKED' AND ra.qualified_at IS NOT NULL AND ($1::timestamptz IS NULL OR ra.qualified_at >= $1) AND ra.qualified_at <= $2), 0)::numeric`;
      const entries = await client.query(`
        SELECT p.id AS partner_id, p.public_profile_opt_in, ${scoreExpression} AS score
        FROM partners p
        WHERE p.public_profile_opt_in = true
        ORDER BY score DESC, p.id ASC
        LIMIT 100
      `, [period.start, period.end]);
      for (const [index, row] of entries.rows.entries()) {
        await client.query(`
          INSERT INTO leaderboard_entries (snapshot_id, partner_id, position, score, public_profile_opt_in)
          VALUES ($1, $2, $3, $4, $5)
        `, [snapshotId, row.partner_id, index + 1, row.score, row.public_profile_opt_in === true]);
      }
      return { status: 'CREATED' as const, snapshotId, entries: entries.rows.length };
    });
  }

  async latestLeaderboard(metricValueInput: string, limit = 100): Promise<LeaderboardProjection[]> {
    const metric = metricValue(metricValueInput);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('INVALID_LEADERBOARD_LIMIT');
    const result = await this.database.query(`
      SELECT snapshot.id AS snapshot_id, snapshot.metric, entry.position, entry.partner_id, entry.score, entry.public_profile_opt_in
      FROM leaderboard_snapshots snapshot
      JOIN leaderboard_entries entry ON entry.snapshot_id = snapshot.id
      WHERE snapshot.metric = $1
        AND snapshot.id = (SELECT s.id FROM leaderboard_snapshots s WHERE s.metric = $1 ORDER BY s.period_end DESC NULLS LAST, s.created_at DESC, s.id DESC LIMIT 1)
        AND entry.public_profile_opt_in = true
      ORDER BY entry.position ASC
      LIMIT $2
    `, [metric, limit]);
    return result.rows.map((row) => ({
      snapshotId: requiredString(row.snapshot_id, 'snapshot_id'),
      metric: metricValue(row.metric),
      position: safeInteger(row.position, 'leaderboard_position'),
      partnerId: requiredString(row.partner_id, 'leaderboard_partner_id'),
      score: requiredString(String(row.score), 'leaderboard_score'),
      publicProfileOptIn: row.public_profile_opt_in === true
    }));
  }
}
