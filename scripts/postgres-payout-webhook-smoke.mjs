import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `webhook-user-${suffix}`;
const partnerId = `webhook-partner-${suffix}`;
const methodId = `webhook-method-${suffix}`;
const payoutId = `webhook-payout-${suffix}`;
const sourceTransactionId = `webhook-source-${suffix}`;
const provider = 'TEST_PROVIDER';
const providerPayoutId = `provider-payout-${suffix}`;
const eventId = `provider-event-${suffix}`;
const secret = `webhook-secret-${suffix}`;
const port = 3300 + (process.pid % 400);
const now = new Date().toISOString();

function sign(timestamp, rawBody) {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {
      // The server may still be probing PostgreSQL.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const output = await new Promise((resolve) => {
    let value = '';
    server.stderr?.on('data', (chunk) => { value += chunk.toString(); });
    setTimeout(() => resolve(value), 100);
  });
  throw new Error(`webhook server did not start: ${output}`);
}

async function signedRequest(rawBody, timestamp, signature, requestEventId = eventId) {
  return fetch(`http://127.0.0.1:${port}/api/webhooks/${provider}/payout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-siren-event-id': requestEventId,
      'x-siren-timestamp': timestamp,
      'x-siren-signature': signature
    },
    body: rawBody
  });
}

await client.connect();
const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'staging',
    PORT: String(port),
    DATABASE_URL: databaseUrl,
    PAYOUT_WEBHOOK_SECRET: secret
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForServer(server);
  await client.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Webhook Test']);
  await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status)
    VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 1, 'QUALITY_GOOD')`, [partnerId, userId, `WEBHOOK_${suffix}`]);
  await client.query(`INSERT INTO payout_methods (id, partner_id, provider, destination_ciphertext, destination_last4, verification_status)
    VALUES ($1, $2, $3, decode('deadbeef', 'hex'), '4821', 'VERIFIED')`, [methodId, partnerId, provider]);
  await client.query(`INSERT INTO payout_requests (id, idempotency_key, partner_id, payout_method_id, requested_amount_minor, currency, provider_fee_minor, fx_fee_minor, withholding_minor, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 50000, 'UAH', 2500, 0, 0, 'PAYOUT_HELD', $5, $5)`, [payoutId, `webhook-request:${suffix}`, partnerId, methodId, now]);
  await client.query(`INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
    VALUES ($1, 'TEST_COMMISSION', $2, 'test-v1', $3)`, [sourceTransactionId, `webhook-source:${suffix}`, now]);
  await client.query(`INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
    VALUES ($1, 'PLATFORM_REVENUE', 'DEBIT', 150000, 'UAH', NULL),
           ($1, 'PARTNER_AVAILABLE', 'CREDIT', 150000, 'UAH', $2)`, [sourceTransactionId, partnerId]);
  await client.query(`INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
    VALUES ($1, 'PAYOUT_REQUESTED', $2, 'payout-v1', $3)`, [`webhook-lock-${suffix}`, `webhook-lock:${suffix}`, now]);
  await client.query(`INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
    VALUES ($1, 'PARTNER_AVAILABLE', 'DEBIT', 50000, 'UAH', $2),
           ($1, 'PARTNER_LOCKED', 'CREDIT', 50000, 'UAH', $2)`, [`webhook-lock-${suffix}`, partnerId]);

  const rawBody = JSON.stringify({ payoutId, providerPayoutId, status: 'PAID', occurredAt: now });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const invalid = await signedRequest(rawBody, timestamp, '0'.repeat(64), `invalid-${eventId}`);
  assert.equal(invalid.status, 401);
  assert.equal((await client.query('SELECT status FROM payout_requests WHERE id = $1', [payoutId])).rows[0].status, 'PAYOUT_HELD');

  const settled = await signedRequest(rawBody, timestamp, sign(timestamp, rawBody));
  assert.equal(settled.status, 200);
  assert.deepEqual(await settled.json(), { status: 'PAID', provider, providerEventId: eventId });

  const duplicate = await signedRequest(rawBody, timestamp, sign(timestamp, rawBody));
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), { status: 'DUPLICATE', provider, providerEventId: eventId });

  const conflictingBody = JSON.stringify({ payoutId, providerPayoutId, status: 'FAILED', occurredAt: now });
  const conflict = await signedRequest(conflictingBody, timestamp, sign(timestamp, conflictingBody));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, 'WEBHOOK_IDEMPOTENCY_CONFLICT');

  const state = await client.query('SELECT status, provider_payout_id FROM payout_requests WHERE id = $1', [payoutId]);
  assert.deepEqual(state.rows[0], { status: 'PAID', provider_payout_id: providerPayoutId });
  const wallet = await client.query(`SELECT available_minor, locked_for_payout_minor, paid_minor FROM wallet_projections WHERE partner_id = $1 AND currency = 'UAH'`, [partnerId]);
  assert.deepEqual(wallet.rows[0], { available_minor: '100000', locked_for_payout_minor: '0', paid_minor: '50000' });
  const webhook = await client.query('SELECT processing_status FROM webhook_events WHERE provider = $1 AND provider_event_id = $2', [provider, eventId]);
  assert.equal(webhook.rows[0].processing_status, 'PROCESSED');
  console.log('PostgreSQL payout webhook gateway smoke: PASS');
} finally {
  server.kill('SIGTERM');
  await client.end();
}
