import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const { Pool } = pg;
const db = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 2_000 });
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `http-user-${suffix}`;
const partnerId = `http-partner-${suffix}`;
const referralCode = `HTTP_${suffix}`;
const payoutMethodId = `payout-method-${suffix}`;
const payoutRequestId = `payout-request-${suffix}`;
const ruleVersion = `comp-http-${suffix}`;
let subscriptionId;
const now = new Date().toISOString();

const { privateKey, publicKey } = await generateKeyPair('RS256');
const publicJwk = await exportJWK(publicKey);
publicJwk.kid = 'siren-http-test-key';
publicJwk.alg = 'RS256';
const jwksServer = createServer((request, response) => {
  if (request.url !== '/.well-known/jwks.json') {
    response.writeHead(404).end();
    return;
  }
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify({ keys: [publicJwk] }));
});
await new Promise((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
const jwksPort = jwksServer.address().port;

const appPort = 6800 + (process.pid % 100);
const issuer = `http://127.0.0.1:${jwksPort}`;
const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'staging',
    PORT: String(appPort),
    SIREN_DATA_MODE: 'NOT_CONNECTED',
    SIREN_FINANCIAL_MODE: 'NOT_CONNECTED',
    SIREN_PUBLIC_ORIGIN: `http://127.0.0.1:${appPort}`,
    DATABASE_URL: databaseUrl,
    IDENTITY_ISSUER_URL: issuer,
    IDENTITY_AUDIENCE: 'siren-api',
    IDENTITY_JWKS_URL: `${issuer}/.well-known/jwks.json`,
    IDENTITY_ROLE_CLAIM: 'roles'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverStderr = '';
server.stderr.on('data', (chunk) => { serverStderr = `${serverStderr}${chunk}`.slice(-2000); });

const token = await new SignJWT({ roles: ['PARTNER'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'siren-http-test-key' })
  .setIssuer(issuer)
  .setAudience('siren-api')
  .setSubject(userId)
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);
const adminToken = await new SignJWT({ roles: ['FINANCE_ADMIN', 'CONTRACT_ADMIN'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'siren-http-test-key' })
  .setIssuer(issuer)
  .setAudience('siren-api')
  .setSubject(`admin-${suffix}`)
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);
const reviewerToken = await new SignJWT({ roles: ['FINANCE_ADMIN', 'CONTRACT_ADMIN'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'siren-http-test-key' })
  .setIssuer(issuer)
  .setAudience('siren-api')
  .setSubject(`reviewer-${suffix}`)
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function request(path, options = {}) {
  const response = await fetch(`http://127.0.0.1:${appPort}${path}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, ...(options.headers ?? {}) }
  });
  const contentType = response.headers.get('content-type') ?? '';
  return { response, body: contentType.includes('application/json') ? await response.json() : await response.text() };
}

try {
  await db.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'HTTP Test']);
  await db.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status)
    VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD')`, [partnerId, userId, referralCode]);
  await db.query(`INSERT INTO payout_methods (id, partner_id, provider, destination_ciphertext, destination_last4, verification_status)
    VALUES ($1, $2, 'TEST_PROVIDER', decode('deadbeef', 'hex'), '6789', 'VERIFIED')`, [payoutMethodId, partnerId]);
  await db.query(`INSERT INTO payout_requests (id, idempotency_key, partner_id, payout_method_id, requested_amount_minor, currency, status, failure_reason, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 1000, 'UAH', 'FAILED', 'TEST_PROVIDER_FAILURE', $5, $5)`, [payoutRequestId, `payout:${suffix}`, partnerId, payoutMethodId, now]);

  let health;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { health = await request('/api/health', { headers: { authorization: undefined } }); break; } catch { await wait(100); }
  }
  assert.ok(health, `server did not start: ${serverStderr}`);
  assert.equal(health.body.integrationConfiguration.database, 'CONFIGURED');

  const session = await request('/api/auth/session');
  assert.equal(session.response.status, 200);
  assert.equal(session.body.user.id, userId);
  assert.deepEqual(session.body.user.roles, ['PARTNER']);

  const noSubscription = await request('/api/subscription');
  assert.equal(noSubscription.response.status, 404);
  const trial = await request('/api/subscription/trial', {
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(trial.response.status, 201);
  assert.equal(trial.body.status, 'CREATED');
  assert.equal(trial.body.subscription.state, 'TRIAL_ACTIVE');
  assert.equal(trial.body.subscription.planCode, 'PREMIUM_MONTHLY');
  subscriptionId = trial.body.subscription.id;
  assert.equal(new Date(trial.body.subscription.trialEndsAt).getTime() - new Date(trial.body.subscription.createdAt).getTime(), 30 * 24 * 60 * 60 * 1000);
  const reminders = await db.query(`SELECT notification_type FROM notification_jobs WHERE recipient_id = $1 ORDER BY notification_type`, [userId]);
  assert.deepEqual(reminders.rows.map((row) => row.notification_type), ['TRIAL_T_MINUS_1', 'TRIAL_T_MINUS_3', 'TRIAL_T_MINUS_7']);
  const duplicateTrial = await request('/api/subscription/trial', { method: 'POST' });
  assert.equal(duplicateTrial.response.status, 409);

  const dashboard = await request('/api/partner/dashboard');
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.body.partner.id, partnerId);
  assert.equal(dashboard.body.partner.referralCode, referralCode);
  assert.equal(dashboard.body.wallet.availableMinor, 0);

  const network = await request('/api/partner/network?limit=10&offset=0');
  assert.equal(network.response.status, 200);
  assert.equal(network.body.l1.count, 0);
  assert.equal(network.body.l2.count, 0);

  const achievements = await request('/api/partner/achievements');
  assert.equal(achievements.response.status, 200);
  assert.deepEqual(achievements.body.achievements, []);
  const ambassador = await request('/api/partner/ambassador');
  assert.equal(ambassador.response.status, 200);
  assert.equal(ambassador.body.ambassador, null);
  const leaderboard = await request('/api/partner/leaderboard?metric=MONTHLY');
  assert.equal(leaderboard.response.status, 200);
  assert.deepEqual(leaderboard.body.entries, []);

  const ledger = await request('/api/partner/ledger');
  assert.equal(ledger.response.status, 200);
  assert.deepEqual(ledger.body.entries, []);

  const payouts = await request('/api/partner/payouts');
  assert.equal(payouts.response.status, 200);
  assert.equal(payouts.body.payouts.length, 1);
  assert.equal(payouts.body.payouts[0].destinationAccount, '•••• 6789');

  const partnerAdminAccess = await request('/api/admin/financial-rules');
  assert.equal(partnerAdminAccess.response.status, 403);

  const adminOverview = await request('/api/admin/overview', { headers: { authorization: `Bearer ${adminToken}` } });
  assert.equal(adminOverview.response.status, 200);
  assert.equal(adminOverview.body.status, 'LIVE');
  assert.equal(adminOverview.body.subscriptions.activeTrials, 1);
  assert.equal(adminOverview.body.finance.mrr, null);
  assert.ok(Array.isArray(adminOverview.body.finance.unavailableMetrics));

  const draft = await request('/api/admin/financial-rules', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      version: ruleVersion,
      ruleType: 'COMPENSATION',
      value: { maxAllocationBps: 5000, ratesBps: { STARTER: 500, PLATINUM: 2500 } },
      reason: 'HTTP smoke maker-checker test'
    })
  });
  assert.equal(draft.response.status, 201);
  assert.equal(draft.body.rule.state, 'DRAFT');

  const validated = await request(`/api/admin/financial-rules/${ruleVersion}/validate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(validated.response.status, 200);
  assert.equal(validated.body.rule.state, 'VALIDATED');

  const sameMakerApproval = await request(`/api/admin/financial-rules/${ruleVersion}/approve`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(sameMakerApproval.response.status, 409);
  assert.equal(sameMakerApproval.body.error, 'MAKER_CHECKER_REQUIRED');

  const approved = await request(`/api/admin/financial-rules/${ruleVersion}/approve`, {
    method: 'POST',
    headers: { authorization: `Bearer ${reviewerToken}` }
  });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.body.rule.state, 'APPROVED');

  const scheduled = await request(`/api/admin/financial-rules/${ruleVersion}/schedule`, {
    method: 'POST',
    headers: { authorization: `Bearer ${reviewerToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ effectiveFrom: '2027-01-01T00:00:00.000Z' })
  });
  assert.equal(scheduled.response.status, 200);
  assert.equal(scheduled.body.rule.state, 'SCHEDULED');

  const referralLink = await request('/api/partner/referral-link');
  assert.equal(referralLink.response.status, 200);
  assert.equal(referralLink.body.status, 'LIVE');
  assert.equal(referralLink.body.referralUrl, `http://127.0.0.1:${appPort}/r/${referralCode}`);

  const share = await request('/api/partner/share', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ campaign: 'http_campaign', content: 'test_01' })
  });
  assert.equal(share.response.status, 200);
  assert.equal(share.body.status, 'LIVE');
  assert.match(share.body.campaignLinkId, /^[0-9a-f-]{36}$/);
  assert.equal(share.body.referralUrl, `http://127.0.0.1:${appPort}/r/${referralCode}?utm_source=partner&utm_medium=referral&utm_campaign=http_campaign&utm_content=test_01`);

  const click = await fetch(`${share.body.referralUrl}`, { redirect: 'manual' });
  assert.equal(click.status, 302);
  assert.equal(click.headers.get('location'), `/?ref=${referralCode}&utm_source=partner&utm_medium=referral&utm_campaign=http_campaign&utm_content=test_01`);
  const clicks = await db.query('SELECT COUNT(*)::int AS count FROM partner_link_clicks WHERE partner_id = $1', [partnerId]);
  assert.equal(clicks.rows[0].count, 1);

  console.log('PostgreSQL authenticated HTTP smoke: PASS');
} finally {
  await db.query('DELETE FROM partner_link_clicks WHERE partner_id = $1', [partnerId]).catch(() => {});
  await db.query('DELETE FROM partner_campaign_links WHERE partner_id = $1', [partnerId]).catch(() => {});
  await db.query('DELETE FROM payout_requests WHERE id = $1', [payoutRequestId]).catch(() => {});
  await db.query('DELETE FROM payout_methods WHERE id = $1', [payoutMethodId]).catch(() => {});
  if (subscriptionId) {
    await db.query('DELETE FROM subscription_events WHERE subscription_id = $1', [subscriptionId]).catch(() => {});
    await db.query('DELETE FROM notification_jobs WHERE recipient_id = $1', [userId]).catch(() => {});
    await db.query('DELETE FROM subscriptions WHERE id = $1', [subscriptionId]).catch(() => {});
  }
  await db.query('DELETE FROM audit_logs WHERE target_entity = $1 AND target_id = $2', ['FINANCIAL_RULE_VERSION', ruleVersion]).catch(() => {});
  await db.query('DELETE FROM financial_rule_versions WHERE version = $1', [ruleVersion]).catch(() => {});
  await db.query('DELETE FROM partners WHERE id = $1', [partnerId]).catch(() => {});
  await db.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
  await db.end();
  jwksServer.close();
  server.kill('SIGTERM');
}
