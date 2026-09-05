import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { PayoutRepository } from '../src/server/payoutRepository';
import { PayoutDispatchRepository } from '../src/server/payoutDispatchRepository';
import type { PayoutProvider } from '../src/domain/partnerPlatform';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `dispatch-user-${suffix}`;
const partnerId = `dispatch-partner-${suffix}`;
const methodId = `dispatch-method-${suffix}`;
const fxRateId = `dispatch-fx-${suffix}`;
const payoutId = `dispatch-payout-${suffix}`;
const now = new Date().toISOString();
let createCalls = 0;
let getCalls = 0;

const provider: PayoutProvider = {
  connected: true,
  async createRecipient() { return { providerRecipientId: 'recipient-test', status: 'VERIFIED' }; },
  async verifyRecipient() { return { status: 'VERIFIED' }; },
  async calculateFee(requested) { return { amountMinor: requested.amountMinor / 20n, currency: requested.currency }; },
  async createPayout(input) {
    createCalls += 1;
    assert.equal(input.idempotencyKey, `payout:${payoutId}`);
    assert.equal(input.requested.amountMinor, 50000n);
    assert.equal(input.destination, 'UA••••4821');
    return { providerPayoutId: `provider-${suffix}`, status: 'PROCESSING' };
  },
  async getPayout(providerPayoutId) {
    getCalls += 1;
    assert.equal(providerPayoutId, `provider-${suffix}`);
    return { status: 'PAID' };
  },
  async cancelPayout() { return { status: 'FAILED' }; },
  async handleWebhook() { return { accepted: true }; },
  async reconcile() { return { checked: 1, mismatches: 0 }; }
};

try {
  await database.withTransaction(async (client) => {
    await client.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Dispatch Test']);
    await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status)
      VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 1, 'QUALITY_GOOD')`, [partnerId, userId, `DISPATCH_${suffix}`]);
    await client.query(`INSERT INTO payout_methods (id, partner_id, provider, destination_ciphertext, destination_last4, verification_status)
      VALUES ($1, $2, 'TEST_PROVIDER', decode('deadbeef', 'hex'), '4821', 'VERIFIED')`, [methodId, partnerId]);
    await client.query(`INSERT INTO fx_rates (id, provider, version, base_currency, payout_currency, rate_numerator, rate_denominator, quoted_at, expires_at)
      VALUES ($1, 'TEST_FX', $2, 'USD', 'UAH', 4000, 100, $3, '2030-01-01T00:00:00.000Z')`, [fxRateId, `dispatch-fx-v1-${suffix}`, now]);
    await client.query(`INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
      VALUES ($1, 'TEST_COMMISSION', $2, 'comp-v1', $3)`, [`dispatch-source-${suffix}`, `dispatch-source:${suffix}`, now]);
    await client.query(`INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
      VALUES ($1, 'PLATFORM_REVENUE', 'DEBIT', 100000, 'UAH', NULL),
             ($1, 'PARTNER_AVAILABLE', 'CREDIT', 100000, 'UAH', $2)`, [`dispatch-source-${suffix}`, partnerId]);
  });

  const payouts = new PayoutRepository(database);
  const held = await payouts.request({
    id: payoutId,
    idempotencyKey: `dispatch-request:${suffix}`,
    partnerId,
    payoutMethodId: methodId,
    requested: { amountMinor: 50000n, currency: 'UAH' },
    minimumBase: { amountMinor: 1000n, currency: 'USD' },
    requestedGrossMinimum: true,
    fxRateId,
    providerFee: { amountMinor: 2500n, currency: 'UAH' },
    fxFee: { amountMinor: 0n, currency: 'UAH' },
    withholding: { amountMinor: 0n, currency: 'UAH' },
    kyc: 'VERIFIED',
    compliance: 'OK',
    fraud: 'OK',
    createdAt: now
  });
  assert.equal(held.status, 'HELD');

  const dispatch = new PayoutDispatchRepository(database, payouts);
  const sent = await dispatch.dispatch({
    payoutId,
    provider: 'TEST_PROVIDER',
    adapter: provider,
    at: now,
    resolveDestination: async ({ destinationCiphertext }) => {
      assert.equal(destinationCiphertext.toString('hex'), 'deadbeef');
      return 'UA••••4821';
    }
  });
  assert.deepEqual(sent, { status: 'DISPATCHED', payoutId, providerPayoutId: `provider-${suffix}` });
  assert.equal(createCalls, 1);

  const duplicateDispatch = await dispatch.dispatch({
    payoutId,
    provider: 'TEST_PROVIDER',
    adapter: provider,
    at: now,
    resolveDestination: async () => 'must-not-be-called'
  });
  assert.deepEqual(duplicateDispatch, { status: 'ALREADY_PROCESSING', payoutId, providerPayoutId: `provider-${suffix}` });
  assert.equal(createCalls, 1);

  const reconciled = await dispatch.reconcile({ provider: 'TEST_PROVIDER', adapter: provider, at: now });
  assert.deepEqual(reconciled, { checked: 1, settled: 1, processing: 0, failures: 0 });
  assert.equal(getCalls, 1);
  const status = await database.query('SELECT status, provider_payout_id FROM payout_requests WHERE id = $1', [payoutId]);
  assert.deepEqual(status.rows[0], { status: 'PAID', provider_payout_id: `provider-${suffix}` });
  const wallet = await database.query(`SELECT available_minor, locked_for_payout_minor, paid_minor FROM wallet_projections WHERE partner_id = $1 AND currency = 'UAH'`, [partnerId]);
  assert.deepEqual(wallet.rows[0], { available_minor: '50000', locked_for_payout_minor: '0', paid_minor: '50000' });
  assert.equal((await database.query("SELECT COUNT(*)::int AS count FROM event_outbox WHERE aggregate_id = $1 AND event_type IN ('PAYOUT_DISPATCHING', 'PAYOUT_ACCEPTED', 'PAYOUT_PAID')", [payoutId])).rows[0].count, 3);
  console.log('PostgreSQL payout dispatch/reconciliation smoke: PASS');
} finally {
  await database.close();
}
