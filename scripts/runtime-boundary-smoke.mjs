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
  assert.deepEqual(health.body, {
    status: 'ok',
    threatDataMode: 'NOT_CONNECTED',
    financialDataMode: 'NOT_CONNECTED',
    payoutProvider: 'NOT_CONNECTED'
  });

  const threats = await getJson('/api/threats/live');
  assert.equal(threats.response.status, 503);
  assert.equal(threats.body.error, 'NOT_CONNECTED');

  const partner = await getJson('/api/partner/dashboard');
  assert.equal(partner.response.status, 503);
  assert.equal(partner.body.error, 'FINANCIAL_DATA_NOT_CONNECTED');

  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /SIREN/i);

  console.log('Runtime boundary smoke: PASS');
} finally {
  server.kill('SIGTERM');
}
