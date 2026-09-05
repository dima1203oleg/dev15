import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `subscription-webhook-user-${suffix}`;
const subscriptionId = `subscription-webhook-${suffix}`;
const provider = 'WEB';
const secret = `payment-webhook-secret-${suffix}`;
const port = 3500 + (process.pid % 300);
const now = new Date().toISOString();

function sign(timestamp, rawBody) {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {
      // Server startup includes a bounded database probe.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('subscription webhook server did not start');
}

function request(rawBody, eventId, timestamp, signature) {
  return fetch(`http://127.0.0.1:${port}/api/webhooks/${provider}/subscription`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-siren-event-id': eventId,
      'x-siren-timestamp': timestamp,
      'x-siren-signature': signature
    },
    body: rawBody
  });
}

await client.connect();
await client.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Subscription Webhook Test']);
await client.query(`INSERT INTO subscriptions (id, user_id, plan_code, state, created_at, updated_at)
  VALUES ($1, $2, 'PREMIUM_MONTHLY', 'TRIAL_ACTIVE', $3, $3)`, [subscriptionId, userId, now]);

const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'staging', PORT: String(port), DATABASE_URL: databaseUrl, PAYMENT_WEBHOOK_SECRET: secret },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForServer();
  const requestedPayload = { subscriptionId, event: 'PAYMENT_REQUESTED', occurredAt: now, providerSubscriptionId: `provider-sub-${suffix}`, billingConsentAt: now };
  const requestedBody = JSON.stringify(requestedPayload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const eventId = `provider-request-${suffix}`;

  const invalid = await request(requestedBody, `invalid-${eventId}`, timestamp, '0'.repeat(64));
  assert.equal(invalid.status, 401);
  assert.equal((await client.query('SELECT state FROM subscriptions WHERE id = $1', [subscriptionId])).rows[0].state, 'TRIAL_ACTIVE');

  const applied = await request(requestedBody, eventId, timestamp, sign(timestamp, requestedBody));
  assert.equal(applied.status, 200);
  assert.deepEqual(await applied.json(), { status: 'APPLIED', provider, providerEventId: eventId });

  const duplicate = await request(requestedBody, eventId, timestamp, sign(timestamp, requestedBody));
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), { status: 'DUPLICATE', provider, providerEventId: eventId });

  const conflictingBody = JSON.stringify({ ...requestedPayload, event: 'TRIAL_EXPIRED' });
  const conflict = await request(conflictingBody, eventId, timestamp, sign(timestamp, conflictingBody));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, 'WEBHOOK_IDEMPOTENCY_CONFLICT');

  const succeededPayload = { subscriptionId, event: 'PAYMENT_SUCCEEDED', occurredAt: now, providerSubscriptionId: `provider-sub-${suffix}`, currentPeriodStart: now, currentPeriodEnd: '2030-01-01T00:00:00.000Z' };
  const succeededBody = JSON.stringify(succeededPayload);
  const successEventId = `provider-success-${suffix}`;
  const succeeded = await request(succeededBody, successEventId, timestamp, sign(timestamp, succeededBody));
  assert.equal(succeeded.status, 200);
  assert.deepEqual(await succeeded.json(), { status: 'APPLIED', provider, providerEventId: successEventId });

  const state = await client.query('SELECT state, provider, provider_subscription_id, billing_consent_at, current_period_end FROM subscriptions WHERE id = $1', [subscriptionId]);
  assert.deepEqual(state.rows[0], { state: 'PREMIUM_ACTIVE', provider, provider_subscription_id: `provider-sub-${suffix}`, billing_consent_at: new Date(now), current_period_end: new Date('2030-01-01T00:00:00.000Z') });
  console.log('PostgreSQL subscription webhook gateway smoke: PASS');
} finally {
  server.kill('SIGTERM');
  await client.end();
}
