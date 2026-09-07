const baseUrl = (process.env.SIREN_INTEGRATION_BASE_URL || 'http://127.0.0.1:3100').replace(/\/+$/, '');
const timeoutMs = Number(process.env.SIREN_INTEGRATION_TIMEOUT_MS || 4000);
const failures = [];

const requestJson = async (path) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    failures.push(`${path}: response is not JSON (${response.status})`);
  }

  return { response, body };
};

const requireCheck = (condition, message) => {
  if (!condition) failures.push(message);
};

const run = async () => {
  console.log(`Checking local SIREN integration at ${baseUrl}`);

  const regions = await requestJson('/api/threats/regions');
  requireCheck(regions.response.ok, `/api/threats/regions returned ${regions.response.status}`);
  requireCheck(Array.isArray(regions.body?.regions), 'Threat regions must be an array');

  const live = await requestJson('/api/threats/live');
  requireCheck(live.response.ok, `/api/threats/live returned ${live.response.status}`);
  requireCheck(Array.isArray(live.body?.threats), 'Threat live payload must expose threats[]');

  const threatStatus = await requestJson('/api/threats/status');
  requireCheck(threatStatus.response.ok, `/api/threats/status returned ${threatStatus.response.status}`);
  requireCheck(typeof threatStatus.body?.status === 'string', 'Threat status must expose status');
  if (threatStatus.body?.status === 'DEMO_DATA') {
    console.log('  threat source: DEMO_DATA (explicit, not authoritative)');
  } else {
    requireCheck(threatStatus.body?.status === 'LIVE', `Unexpected threat status: ${threatStatus.body?.status}`);
  }

  const partner = await requestJson('/api/partner/dashboard');
  requireCheck(partner.response.ok, `/api/partner/dashboard returned ${partner.response.status}`);
  requireCheck(typeof partner.body?.status === 'string', 'Partner dashboard must expose status');
  requireCheck(typeof partner.body?.partner === 'object', 'Partner dashboard must expose partner');
  requireCheck(typeof partner.body?.wallet === 'object', 'Partner dashboard must expose wallet');

  const network = await requestJson('/api/partner/network');
  requireCheck(network.response.ok, `/api/partner/network returned ${network.response.status}`);
  requireCheck(typeof network.body?.status === 'string', 'Partner network must expose explicit status');
  requireCheck(typeof network.body?.l1 === 'object', 'Partner network must expose l1 aggregate');
  requireCheck(typeof network.body?.l2 === 'object', 'Partner network must expose l2 aggregate');

  const ledger = await requestJson('/api/partner/ledger');
  requireCheck(ledger.response.ok, `/api/partner/ledger returned ${ledger.response.status}`);
  requireCheck(typeof ledger.body?.status === 'string', 'Partner ledger must expose explicit status');
  requireCheck(Array.isArray(ledger.body?.entries), 'Partner ledger must expose entries[]');

  const payouts = await requestJson('/api/partner/payouts');
  requireCheck(payouts.response.ok, `/api/partner/payouts returned ${payouts.response.status}`);
  requireCheck(typeof payouts.body?.status === 'string', 'Partner payouts must expose explicit status');
  requireCheck(Array.isArray(payouts.body?.payouts), 'Partner payouts must expose payouts[]');

  const ready = await requestJson('/api/ready');
  if (ready.response.status === 200) {
    requireCheck(ready.body?.status === 'ready', '/api/ready 200 response must be ready');
    console.log('  production readiness: READY');
  } else {
    requireCheck(ready.response.status === 503, `/api/ready returned unexpected ${ready.response.status}`);
    requireCheck(ready.body?.status === 'not_ready', '/api/ready 503 response must be not_ready');
    console.log('  production readiness: NOT_READY (safe boundary, no live claims)');
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} integration check(s) failed:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('Local integration checks passed.');
};

run().catch((error) => {
  console.error(`Integration check could not reach ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
