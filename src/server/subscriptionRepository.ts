import { randomUUID } from 'node:crypto';
import type { QueryResultRow } from 'pg';
import {
  addCalendarDays,
  startTrial,
  transitionSubscriptionState,
  trialReminderSchedule,
  type SubscriptionState,
  type SubscriptionTransitionEvent
} from '../domain/partnerPlatform';
import type { PostgresBoundary } from './postgresBoundary';

export interface PersistedSubscription {
  id: string;
  userId: string;
  planCode: string;
  state: SubscriptionState;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  provider?: string;
  billingConsentAt?: string;
  createdAt: string;
  updatedAt: string;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`INVALID_SUBSCRIPTION_VALUE:${field}`);
  return value;
}

function requiredIso(value: unknown, field: string): string {
  const date = new Date(value instanceof Date ? value : String(value));
  if (!Number.isFinite(date.getTime())) throw new Error(`INVALID_SUBSCRIPTION_VALUE:${field}`);
  return date.toISOString();
}

function optionalIso(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return requiredIso(value, 'optional_date');
}

function mapSubscription(row: QueryResultRow): PersistedSubscription {
  return {
    id: requiredString(row.id, 'id'),
    userId: requiredString(row.user_id, 'user_id'),
    planCode: requiredString(row.plan_code, 'plan_code'),
    state: row.state as SubscriptionState,
    trialEndsAt: optionalIso(row.trial_ends_at),
    currentPeriodStart: optionalIso(row.current_period_start),
    currentPeriodEnd: optionalIso(row.current_period_end),
    provider: row.provider ? requiredString(row.provider, 'provider') : undefined,
    billingConsentAt: optionalIso(row.billing_consent_at),
    createdAt: requiredIso(row.created_at, 'created_at'),
    updatedAt: requiredIso(row.updated_at, 'updated_at')
  };
}

function subscriptionFingerprint(input: { userId: string; planCode: string; trialEndsAt: string; startedAt: string; trialDays: number }): string {
  return JSON.stringify(input);
}

/**
 * Durable subscription boundary. The caller owns identity and provider
 * signature verification; this class only persists normalized state changes
 * and idempotent notification/event records.
 */
export class SubscriptionRepository {
  constructor(private readonly database: PostgresBoundary) {}

  async startTrial(input: { id: string; userId: string; planCode: string; startedAt: string; trialDays?: number }): Promise<{ status: 'CREATED' | 'DUPLICATE'; subscription: PersistedSubscription }> {
    const id = requiredString(input.id, 'id');
    const userId = requiredString(input.userId, 'user_id');
    const planCode = requiredString(input.planCode, 'plan_code');
    const startedAt = requiredIso(input.startedAt, 'started_at');
    const trialDays = input.trialDays ?? 30;
    const trial = startTrial(userId, startedAt, trialDays);
    const fingerprint = subscriptionFingerprint({ userId, planCode, trialEndsAt: trial.endsAt, startedAt, trialDays });

    return this.database.withTransaction(async (client) => {
      // Lock before reading so concurrent first-trial requests cannot both
      // pass when no subscription row exists yet.
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`subscription-trial:${userId}`]);
      const existing = await client.query(`
        SELECT id, user_id, plan_code, state, trial_ends_at, current_period_start, current_period_end,
               provider, billing_consent_at, created_at, updated_at
        FROM subscriptions
        WHERE id = $1
        FOR UPDATE
      `, [id]);
      if (existing.rows[0]) {
        const current = mapSubscription(existing.rows[0]);
        const currentFingerprint = subscriptionFingerprint({
          userId: current.userId,
          planCode: current.planCode,
          trialEndsAt: current.trialEndsAt ?? '',
          startedAt: current.createdAt,
          trialDays
        });
        if (currentFingerprint !== fingerprint) throw new Error('SUBSCRIPTION_IDEMPOTENCY_CONFLICT');
        return { status: 'DUPLICATE' as const, subscription: current };
      }
      const user = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (!user.rows[0]) throw new Error('USER_NOT_FOUND');
      const existingForUser = await client.query(`
        SELECT id
        FROM subscriptions
        WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
        FOR UPDATE
      `, [userId]);
      if (existingForUser.rows[0]) throw new Error('SUBSCRIPTION_ALREADY_EXISTS');
      const now = startedAt;
      const inserted = await client.query(`
        INSERT INTO subscriptions (id, user_id, plan_code, state, trial_ends_at, created_at, updated_at)
        VALUES ($1, $2, $3, 'TRIAL_ACTIVE', $4, $5, $5)
        RETURNING id, user_id, plan_code, state, trial_ends_at, current_period_start, current_period_end,
                  provider, billing_consent_at, created_at, updated_at
      `, [id, userId, planCode, trial.endsAt, now]);
      const subscription = mapSubscription(inserted.rows[0]);
      await client.query(`
        INSERT INTO subscription_events (id, subscription_id, event_type, payload, occurred_at)
        VALUES ($1, $2, 'TRIAL_STARTED', $3::jsonb, $4)
      `, [randomUUID(), id, JSON.stringify({ trialDays, trialEndsAt: trial.endsAt }), startedAt]);
      for (const reminder of trialReminderSchedule(trial)) {
        await client.query(`
          INSERT INTO notification_jobs (id, recipient_id, notification_type, channel, scheduled_for, status, idempotency_key, payload)
          VALUES ($1, $2, $3, 'IN_APP', $4, 'SCHEDULED', $5, $6::jsonb)
          ON CONFLICT (idempotency_key) DO NOTHING
        `, [reminder.id, userId, reminder.type, reminder.scheduledFor, reminder.idempotencyKey, JSON.stringify({ trialEndsAt: trial.endsAt, daysRemaining: Number(reminder.type.replace('TRIAL_T_MINUS_', '')) })]);
      }
      return { status: 'CREATED' as const, subscription };
    });
  }

  async get(id: string): Promise<PersistedSubscription | null> {
    const result = await this.database.query(`
      SELECT id, user_id, plan_code, state, trial_ends_at, current_period_start, current_period_end,
             provider, billing_consent_at, created_at, updated_at
      FROM subscriptions WHERE id = $1
    `, [requiredString(id, 'id')]);
    return result.rows[0] ? mapSubscription(result.rows[0]) : null;
  }

  async getForUser(userId: string): Promise<PersistedSubscription | null> {
    const result = await this.database.query(`
      SELECT id, user_id, plan_code, state, trial_ends_at, current_period_start, current_period_end,
             provider, billing_consent_at, created_at, updated_at
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `, [requiredString(userId, 'user_id')]);
    return result.rows[0] ? mapSubscription(result.rows[0]) : null;
  }

  /** Expire only trials whose deadline has passed; billing consent is never inferred. */
  async expireDueTrials(at: string, limit = 100): Promise<number> {
    const occurredAt = requiredIso(at, 'expiration_time');
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_TRIAL_BATCH');
    return this.database.withTransaction(async (client) => {
      const due = await client.query(`
        SELECT id, user_id
        FROM subscriptions
        WHERE state IN ('TRIAL_ACTIVE', 'TRIAL_ENDING') AND trial_ends_at IS NOT NULL AND trial_ends_at <= $1
        ORDER BY trial_ends_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $2
      `, [occurredAt, limit]);
      for (const row of due.rows) {
        const eventId = randomUUID();
        await client.query(`
          UPDATE subscriptions SET state = 'TRIAL_EXPIRED', updated_at = $2
          WHERE id = $1 AND state IN ('TRIAL_ACTIVE', 'TRIAL_ENDING')
        `, [row.id, occurredAt]);
        await client.query(`
          INSERT INTO subscription_events (id, subscription_id, event_type, payload, occurred_at)
          VALUES ($1, $2, 'TRIAL_EXPIRED', '{}'::jsonb, $3)
        `, [eventId, row.id, occurredAt]);
        await client.query(`
          INSERT INTO notification_jobs (id, recipient_id, notification_type, channel, scheduled_for, status, idempotency_key, payload)
          VALUES ($1, $2, 'TRIAL_EXPIRED', 'IN_APP', $3, 'SCHEDULED', $4, '{}'::jsonb)
          ON CONFLICT (idempotency_key) DO NOTHING
        `, [`${row.id}-trial-expired`, row.user_id, occurredAt, `${row.id}:trial-expired`]);
      }
      return due.rowCount ?? 0;
    });
  }

  /** Apply only a signature-verified, normalized provider event. */
  async applyVerifiedProviderEvent(input: { subscriptionId: string; providerEventId: string; event: SubscriptionTransitionEvent; payload: Record<string, unknown>; occurredAt: string }): Promise<'APPLIED' | 'DUPLICATE'> {
    const subscriptionId = requiredString(input.subscriptionId, 'subscription_id');
    const providerEventId = requiredString(input.providerEventId, 'provider_event_id');
    const occurredAt = requiredIso(input.occurredAt, 'occurred_at');
    return this.database.withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM subscription_events WHERE provider_event_id = $1 FOR UPDATE', [providerEventId]);
      if (existing.rows[0]) return 'DUPLICATE';
      const result = await client.query(`
        SELECT id, user_id, plan_code, state, trial_ends_at, current_period_start, current_period_end,
               provider, billing_consent_at, created_at, updated_at
        FROM subscriptions WHERE id = $1 FOR UPDATE
      `, [subscriptionId]);
      if (!result.rows[0]) throw new Error('SUBSCRIPTION_NOT_FOUND');
      const current = mapSubscription(result.rows[0]);
      const nextState = transitionSubscriptionState(current.state, input.event);
      await client.query(`
        UPDATE subscriptions SET state = $2, updated_at = $3 WHERE id = $1
      `, [subscriptionId, nextState, occurredAt]);
      await client.query(`
        INSERT INTO subscription_events (id, subscription_id, event_type, provider_event_id, payload, occurred_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      `, [randomUUID(), subscriptionId, input.event, providerEventId, JSON.stringify(input.payload), occurredAt]);
      return 'APPLIED';
    });
  }

  async listDueNotifications(at: string, limit = 100): Promise<Array<{ id: string; recipientId: string; notificationType: string; scheduledFor: string; payload: Record<string, unknown> }>> {
    const scheduledBefore = requiredIso(at, 'notification_time');
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('INVALID_NOTIFICATION_BATCH');
    const result = await this.database.query(`
      SELECT id, recipient_id, notification_type, scheduled_for, payload
      FROM notification_jobs
      WHERE status = 'SCHEDULED' AND scheduled_for <= $1
      ORDER BY scheduled_for ASC, id ASC
      LIMIT $2
    `, [scheduledBefore, limit]);
    return result.rows.map((row) => ({
      id: requiredString(row.id, 'notification_id'),
      recipientId: requiredString(row.recipient_id, 'notification_recipient'),
      notificationType: requiredString(row.notification_type, 'notification_type'),
      scheduledFor: requiredIso(row.scheduled_for, 'scheduled_for'),
      payload: row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload as Record<string, unknown> : {}
    }));
  }

  async markNotificationSent(id: string, sentAt: string): Promise<boolean> {
    const result = await this.database.query(`
      UPDATE notification_jobs SET status = 'SENT', sent_at = $2
      WHERE id = $1 AND status = 'SCHEDULED'
      RETURNING id
    `, [requiredString(id, 'notification_id'), requiredIso(sentAt, 'sent_at')]);
    return result.rowCount === 1;
  }
}
