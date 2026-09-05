import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 3900 + (process.pid % 300);
const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'staging',
    PORT: String(port),
    SIREN_DATA_MODE: 'NOT_CONNECTED',
    SIREN_FINANCIAL_MODE: 'NOT_CONNECTED',
    DATABASE_URL: 'postgresql://siren:test@127.0.0.1:1/siren'
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
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      health = await getJson('/api/health');
      break;
    } catch {
      await wait(100);
    }
  }
  assert.ok(health, 'database boundary server did not start');
  assert.equal(health.body.integrationConfiguration.database, 'CONFIGURED');

  const readiness = await getJson('/api/ready');
  assert.equal(readiness.response.status, 503);
  assert.equal(readiness.body.checks.database, 'ERROR');
  assert.equal(readiness.body.runtime.database, 'ERROR');

  console.log('Database boundary smoke: PASS');
} finally {
  server.kill('SIGTERM');
}
