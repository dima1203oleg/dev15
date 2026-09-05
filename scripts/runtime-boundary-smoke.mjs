import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 3100 + (process.pid % 500);
const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'staging',
    PORT: String(port),
    SIREN_DATA_MODE: 'DEMO_DATA',
    SIREN_FINANCIAL_MODE: 'DEMO_DATA'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getJson(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  return { response, body: await response.json() };
}

try {
  let health;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      health = await getJson('/api/health');
      break;
    } catch {
      await wait(100);
    }
  }

  assert.ok(health, 'staging-like server did not start');
  assert.match(health.response.headers.get('x-request-id') ?? '', /^[A-Za-z0-9._:-]{1,128}$/);
  assert.deepEqual(health.body, {
    status: 'ok',
    threatDataMode: 'NOT_CONNECTED',
    financialDataMode: 'NOT_CONNECTED',
    payoutProvider: 'NOT_CONNECTED',
    integrationConfiguration: {
      threatServer: 'NOT_CONFIGURED',
      identity: 'NOT_CONFIGURED',
      database: 'NOT_CONFIGURED',
      queue: 'NOT_CONFIGURED',
      billing: 'NOT_CONFIGURED',
      fx: 'NOT_CONFIGURED',
      kyc: 'NOT_CONFIGURED',
      payout: 'NOT_CONFIGURED'
    }
  });

  const threats = await getJson('/api/threats/live');
  assert.equal(threats.response.status, 503);
  assert.equal(threats.body.error, 'NOT_CONNECTED');
  const echoedRequest = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { 'x-request-id': 'boundary-smoke-1' } });
  assert.equal(echoedRequest.headers.get('x-request-id'), 'boundary-smoke-1');

  const partner = await getJson('/api/partner/dashboard');
  assert.equal(partner.response.status, 503);
  assert.equal(partner.body.error, 'FINANCIAL_DATA_NOT_CONNECTED');

  const payoutWebhook = await fetch(`http://127.0.0.1:${port}/api/webhooks/test-provider/payout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payoutId: 'payout-1', providerPayoutId: 'provider-1', status: 'PAID', occurredAt: new Date().toISOString() })
  });
  assert.equal(payoutWebhook.status, 503);
  assert.equal((await payoutWebhook.json()).error, 'PAYOUT_WEBHOOK_NOT_CONNECTED');

  const session = await getJson('/api/auth/session');
  assert.equal(session.response.status, 503);
  assert.equal(session.body.error, 'FINANCIAL_DATA_NOT_CONNECTED');

  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy') ?? '', /default-src 'self'/);
  assert.equal(page.headers.get('x-frame-options'), 'DENY');
  assert.match(page.headers.get('permissions-policy') ?? '', /geolocation=\(self\)/);
  assert.match(await page.text(), /SIREN/i);

  console.log('Runtime boundary smoke: PASS');
} finally {
  server.kill('SIGTERM');
}
