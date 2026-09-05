import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { SubscriptionRepository } from '../src/server/subscriptionRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `subscription-user-${suffix}`;
const expiringUserId = `subscription-expiring-user-${suffix}`;
const subscriptionId = `subscription-${suffix}`;
const expiringSubscriptionId = `subscription-expiring-${suffix}`;
const startedAt = '2026-01-01T00:00:00.000Z';

try {
  await database.withTransaction(async (client) => {
    await client.query(`INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3), ($4, $5, $6)`, [
      userId, `${userId}@example.test`, 'Subscription Test', expiringUserId, `${expiringUserId}@example.test`, 'Expiring Test'
    ]);
  });
  const repository = new SubscriptionRepository(database);
  const created = await repository.startTrial({ id: subscriptionId, userId, planCode: 'PREMIUM_MONTHLY', startedAt });
  assert.equal(created.status, 'CREATED');
  assert.equal(created.subscription.state, 'TRIAL_ACTIVE');
  assert.equal(created.subscription.trialEndsAt, '2026-01-31T00:00:00.000Z');
  assert.equal((await repository.startTrial({ id: subscriptionId, userId, planCode: 'PREMIUM_MONTHLY', startedAt })).status, 'DUPLICATE');
  await assert.rejects(
    repository.startTrial({ id: subscriptionId, userId, planCode: 'PREMIUM_MONTHLY', startedAt, trialDays: 29 }),
    /SUBSCRIPTION_IDEMPOTENCY_CONFLICT/
  );
  await assert.rejects(
    repository.startTrial({ id: `subscription-conflict-${suffix}`, userId, planCode: 'PREMIUM_MONTHLY', startedAt }),
    /SUBSCRIPTION_ALREADY_EXISTS/
  );

  const reminderJobs = await database.query(`SELECT notification_type FROM notification_jobs WHERE recipient_id = $1 ORDER BY notification_type`, [userId]);
  assert.deepEqual(reminderJobs.rows.map((row) => row.notification_type), ['TRIAL_T_MINUS_1', 'TRIAL_T_MINUS_3', 'TRIAL_T_MINUS_7']);
  const due = await repository.listDueNotifications('2026-01-25T00:00:00.000Z');
  assert.equal(due.length, 1);
  assert.equal(await repository.markNotificationSent(due[0]!.id, '2026-01-25T00:01:00.000Z'), true);
  assert.equal(await repository.markNotificationSent(due[0]!.id, '2026-01-25T00:02:00.000Z'), false);

  const expiring = await repository.startTrial({ id: expiringSubscriptionId, userId: expiringUserId, planCode: 'PREMIUM_MONTHLY', startedAt });
  assert.equal(expiring.status, 'CREATED');
  assert.equal(await repository.expireDueTrials('2026-02-01T00:00:00.000Z'), 2);
  assert.equal((await repository.get(subscriptionId))?.state, 'TRIAL_EXPIRED');
  assert.equal((await repository.get(expiringSubscriptionId))?.state, 'TRIAL_EXPIRED');
  assert.equal(await repository.expireDueTrials('2026-02-01T00:00:00.000Z'), 0);

  const providerUserId = `subscription-provider-user-${suffix}`;
  const providerSubscriptionId = `subscription-provider-${suffix}`;
  await database.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [providerUserId, `${providerUserId}@example.test`, 'Provider Test']);
  await repository.startTrial({ id: providerSubscriptionId, userId: providerUserId, planCode: 'PREMIUM_MONTHLY', startedAt });
  assert.equal(await repository.applyVerifiedProviderEvent({ subscriptionId: providerSubscriptionId, providerEventId: `provider-request-${suffix}`, event: 'PAYMENT_REQUESTED', payload: { provider: 'TEST' }, occurredAt: startedAt }), 'APPLIED');
  assert.equal(await repository.applyVerifiedProviderEvent({ subscriptionId: providerSubscriptionId, providerEventId: `provider-success-${suffix}`, event: 'PAYMENT_SUCCEEDED', payload: { provider: 'TEST' }, occurredAt: startedAt }), 'APPLIED');
  assert.equal(await repository.applyVerifiedProviderEvent({ subscriptionId: providerSubscriptionId, providerEventId: `provider-success-${suffix}`, event: 'PAYMENT_SUCCEEDED', payload: { provider: 'TEST' }, occurredAt: startedAt }), 'DUPLICATE');
  assert.equal((await repository.get(providerSubscriptionId))?.state, 'PREMIUM_ACTIVE');

  await database.query('DELETE FROM subscription_events WHERE subscription_id = ANY($1::text[])', [[subscriptionId, expiringSubscriptionId, providerSubscriptionId]]);
  await database.query('DELETE FROM notification_jobs WHERE recipient_id = ANY($1::text[])', [[userId, expiringUserId, providerUserId]]);
  await database.query('DELETE FROM subscriptions WHERE id = ANY($1::text[])', [[subscriptionId, expiringSubscriptionId, providerSubscriptionId]]);
  await database.query('DELETE FROM users WHERE id = ANY($1::text[])', [[userId, expiringUserId, providerUserId]]);
  console.log('PostgreSQL subscription/trial smoke: PASS');
} finally {
  await database.close();
}
