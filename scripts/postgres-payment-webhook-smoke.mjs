import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `payment-webhook-user-${suffix}`;
const directPartnerId = `payment-webhook-direct-${suffix}`;
const uplinePartnerId = `payment-webhook-upline-${suffix}`;
const attributionId = `payment-webhook-attribution-${suffix}`;
const paymentId = `payment-webhook-payment-${suffix}`;
const provider = 'WEB';
const secret = `payment-webhook-secret-${suffix}`;
const port = 3600 + (process.pid % 300);
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
  throw new Error('payment webhook server did not start');
}

function request(rawBody, eventId, timestamp, signature) {
  return fetch(`http://127.0.0.1:${port}/api/webhooks/${provider}/payment`, {
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
await client.query(`INSERT INTO users (id, email, display_name) VALUES
  ($1, $2, 'Payment Webhook User'), ($3, $4, 'Payment Webhook Direct'), ($5, $6, 'Payment Webhook Upline')`, [
  userId, `${userId}@example.test`, directPartnerId, `${directPartnerId}@example.test`, uplinePartnerId, `${uplinePartnerId}@example.test`
]);
await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status) VALUES
  ($1, $2, 'PAY_WEB_DIRECT_${suffix}', 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD'),
  ($3, $4, 'PAY_WEB_UPLINE_${suffix}', 'GOLD', 'ACTIVE', 154, 'QUALITY_GOOD')`, [directPartnerId, directPartnerId, uplinePartnerId, uplinePartnerId]);
await client.query(`INSERT INTO subscriptions (id, user_id, plan_code, state, provider, billing_consent_at, current_period_start, current_period_end, created_at, updated_at)
  VALUES ($1, $2, 'PREMIUM_MONTHLY', 'PREMIUM_ACTIVE', 'WEB', $3, $3, '2030-01-01T00:00:00.000Z', $3, $3)`, [`subscription-payment-webhook-${suffix}`, userId, now]);
await client.query(`INSERT INTO referral_attributions (id, user_id, direct_partner_id, second_level_partner_id, status, source_channel, campaign, attributed_at)
  VALUES ($1, $2, $3, $4, 'ATTRIBUTED', 'WEB', 'payment_webhook_smoke', $5)`, [attributionId, userId, directPartnerId, uplinePartnerId, now]);

const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'staging', PORT: String(port), DATABASE_URL: databaseUrl, PAYMENT_WEBHOOK_SECRET: secret },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForServer();
  const payload = {
    paymentId,
    providerPaymentId: `provider-payment-${suffix}`,
    userId,
    attributionId,
    gross: { amountMinor: '1000', currency: 'UAH' },
    storeCosts: { amountMinor: '100', currency: 'UAH' },
    qcbPolicy: { version: 'web-qcb-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true },
    ruleVersion: 'comp-v1',
    paidAt: now,
    holdCommission: true,
    fraudStatus: 'OK'
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const eventId = `provider-payment-${suffix}`;

  const invalid = await request(rawBody, `invalid-${eventId}`, timestamp, '0'.repeat(64));
  assert.equal(invalid.status, 401);
  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM payments WHERE id = $1', [paymentId])).rows[0].count, 0);

  const applied = await request(rawBody, eventId, timestamp, sign(timestamp, rawBody));
  assert.equal(applied.status, 200);
  const appliedBody = await applied.json();
  assert.equal(appliedBody.status, 'QUALIFIED');
  assert.equal(appliedBody.qcbAmountMinor, '900');
  assert.equal(appliedBody.commissionIds.length, 2);

  const payment = await client.query('SELECT provider_event_id, status FROM payments WHERE id = $1', [paymentId]);
  assert.deepEqual(payment.rows[0], { provider_event_id: eventId, status: 'SUCCEEDED' });
  const qualified = await client.query('SELECT qcb_amount_minor, currency FROM qualified_payments WHERE payment_id = $1', [paymentId]);
  assert.deepEqual(qualified.rows[0], { qcb_amount_minor: '900', currency: 'UAH' });
  const commissions = await client.query('SELECT partner_id, referral_level, rounded_commission_minor, state FROM commissions WHERE payment_id = $1 ORDER BY referral_level', [paymentId]);
  assert.deepEqual(commissions.rows, [
    { partner_id: directPartnerId, referral_level: 'L1', rounded_commission_minor: '45', state: 'HELD' },
    { partner_id: uplinePartnerId, referral_level: 'L2', rounded_commission_minor: '180', state: 'HELD' }
  ]);
  assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM ledger_transactions WHERE source = 'COMMISSION_CREATED' AND idempotency_key LIKE $1", [`commission:${paymentId}:%`])).rows[0].count, 2);
  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM webhook_events WHERE provider = $1 AND provider_event_id = $2 AND raw_body = $3', [provider, eventId, Buffer.from(rawBody, 'utf8')])).rows[0].count, 1);
  assert.equal((await client.query('SELECT qualified_active_paid_l1, rank FROM partners WHERE id = $1', [directPartnerId])).rows[0].qualified_active_paid_l1, 1);

  const duplicate = await request(rawBody, eventId, timestamp, sign(timestamp, rawBody));
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).status, 'DUPLICATE');

  const conflictingBody = JSON.stringify({ ...payload, gross: { amountMinor: '1001', currency: 'UAH' } });
  const conflict = await request(conflictingBody, eventId, timestamp, sign(timestamp, conflictingBody));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, 'WEBHOOK_IDEMPOTENCY_CONFLICT');
  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM payments WHERE id = $1', [paymentId])).rows[0].count, 1);
  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM ledger_transactions WHERE source = \'COMMISSION_CREATED\' AND idempotency_key LIKE $1', [`commission:${paymentId}:%`])).rows[0].count, 2);

  console.log('PostgreSQL payment webhook qualification smoke: PASS');
} finally {
  server.kill('SIGTERM');
  await client.end();
}
