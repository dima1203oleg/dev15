import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 3600 + (process.pid % 300);
const server = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(port),
    SIREN_DATA_MODE: 'NOT_CONNECTED',
    SIREN_FINANCIAL_MODE: 'DEMO_DATA'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverExited = false;
let serverExitCode = null;
let serverStderr = '';
server.stderr.on('data', (chunk) => {
  serverStderr = `${serverStderr}${chunk}`.slice(-2000);
});
server.on('exit', (code) => {
  serverExited = true;
  serverExitCode = code;
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getJson(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  return { response, body: await response.json() };
}

try {
  let health;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (serverExited) break;
    try {
      health = await getJson('/api/health');
      break;
    } catch {
      await wait(100);
    }
  }
  assert.ok(health, `demo server did not start (exit=${serverExitCode ?? 'pending'}): ${serverStderr || 'startup timeout'}`);
  assert.equal(health.body.financialDataMode, 'DEMO_DATA');

  const referralLink = await getJson('/api/partner/referral-link');
  assert.equal(referralLink.response.status, 200);
  assert.equal(referralLink.body.referralCode, 'SIREN_ATLAS');
  assert.match(referralLink.body.referralUrl, /\/r\/SIREN_ATLAS$/);

  const networkResponse = await fetch(`http://127.0.0.1:${port}/api/partner/network?limit=1&offset=1`);
  const network = await networkResponse.json();
  assert.equal(networkResponse.status, 200);
  assert.equal(network.l1.count, 25);
  assert.equal(network.l1.items.length, 1);
  assert.equal(network.l1.offset, 1);
  assert.equal(network.l1.limit, 1);
  assert.equal(network.l1.hasMore, true);
  assert.equal(Object.hasOwn(network.l1.items[0], 'userId'), false);
  assert.equal(Object.hasOwn(network.l1.items[0], 'referrerL1Id'), false);

  const dashboard = await getJson('/api/partner/dashboard');
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.body.wallet.availableMinor, 6940);
  assert.equal(dashboard.body.wallet.pendingMinor, 2980);
  assert.equal(dashboard.body.wallet.lifetimeEarnedMinor, 9920);

  const payouts = await getJson('/api/partner/payouts');
  assert.equal(payouts.response.status, 200);
  assert.equal(payouts.body.payouts[0].destinationAccount, '•••• 6789');
  assert.equal(payouts.body.payouts[0].destinationAccount.includes('UA823220010000026007123456789'), false);

  const click = await fetch(`http://127.0.0.1:${port}/r/SIREN_ATLAS`, { redirect: 'manual' });
  assert.equal(click.status, 302);
  assert.equal(click.headers.get('location'), '/?ref=SIREN_ATLAS');
  assert.match(click.headers.get('set-cookie') ?? '', /siren_referral=SIREN_ATLAS/);

  console.log('Demo API smoke: PASS');
} finally {
  server.kill('SIGTERM');
}
