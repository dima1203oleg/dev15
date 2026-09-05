import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { PayoutRepository } from '../src/server/payoutRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `payout-user-${suffix}`;
const partnerId = `payout-partner-${suffix}`;
const methodId = `payout-method-${suffix}`;
const fxRateId = `fx-${suffix}`;
const sourceTransactionId = `payout-source-ledger-${suffix}`;
const failedPayoutId = `payout-failed-${suffix}`;
const paidPayoutId = `payout-paid-${suffix}`;
const now = '2026-02-01T00:00:00.000Z';

try {
  await database.withTransaction(async (client) => {
    await client.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Payout Test']);
    await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status)
      VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 1, 'QUALITY_GOOD')`, [partnerId, userId, `PAYOUT_${suffix}`]);
    await client.query(`INSERT INTO payout_methods (id, partner_id, provider, destination_ciphertext, destination_last4, verification_status)
      VALUES ($1, $2, 'TEST_PROVIDER', decode('deadbeef', 'hex'), '4821', 'VERIFIED')`, [methodId, partnerId]);
    await client.query(`INSERT INTO fx_rates (id, provider, version, base_currency, payout_currency, rate_numerator, rate_denominator, quoted_at, expires_at)
      VALUES ($1, 'TEST_FX', $2, 'USD', 'UAH', 4000, 100, '2026-01-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z')`, [fxRateId, `fx-v1-${suffix}`]);
    await client.query(`INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at)
      VALUES ($1, 'TEST_COMMISSION', $2, 'comp-v1', $3)`, [sourceTransactionId, `payout-source:${suffix}`, now]);
    await client.query(`INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
      VALUES ($1, 'PLATFORM_REVENUE', 'DEBIT', 150000, 'UAH', NULL),
             ($1, 'PARTNER_AVAILABLE', 'CREDIT', 150000, 'UAH', $2)`, [sourceTransactionId, partnerId]);
  });

  const repository = new PayoutRepository(database);
  const baseInput = {
    partnerId,
    payoutMethodId: methodId,
    requested: { amountMinor: 50000n, currency: 'UAH' as const },
    minimumBase: { amountMinor: 1000n, currency: 'USD' as const },
    requestedGrossMinimum: true,
    fxRateId,
    providerFee: { amountMinor: 2500n, currency: 'UAH' as const },
    fxFee: { amountMinor: 0n, currency: 'UAH' as const },
    withholding: { amountMinor: 0n, currency: 'UAH' as const },
    compliance: 'OK' as const,
    fraud: 'OK' as const,
    createdAt: now
  };
  const blocked = await repository.request({ ...baseInput, id: `payout-blocked-${suffix}`, idempotencyKey: `payout-blocked:${suffix}`, kyc: 'PENDING' });
  assert.equal(blocked.status, 'REJECTED');
  assert.equal(blocked.reason, 'KYC_REQUIRED');

  const held = await repository.request({ ...baseInput, id: failedPayoutId, idempotencyKey: `payout-failed:${suffix}`, kyc: 'VERIFIED' });
  assert.equal(held.status, 'HELD');
  assert.equal(held.requestedAmountMinor, '50000');
  assert.equal(held.providerFeeMinor, '2500');
  assert.equal(held.netAmountMinor, '47500');
  assert.equal(held.minimumPayoutMinor, '40000');
  assert.equal((await repository.request({ ...baseInput, id: failedPayoutId, idempotencyKey: `payout-failed:${suffix}`, kyc: 'VERIFIED' })).status, 'DUPLICATE');
  const heldWallet = await database.query(`SELECT available_minor, locked_for_payout_minor FROM wallet_projections WHERE partner_id = $1 AND currency = 'UAH'`, [partnerId]);
  assert.deepEqual(heldWallet.rows[0], { available_minor: '100000', locked_for_payout_minor: '50000' });

  assert.equal(await repository.settle({ payoutId: failedPayoutId, provider: 'TEST_PROVIDER', providerEventId: `provider-failed:${suffix}`, providerPayoutId: `provider-payout-failed:${suffix}`, status: 'FAILED', rawBody: '{"status":"failed"}', signatureVerifiedAt: now, occurredAt: now }), 'FAILED');
  assert.equal(await repository.settle({ payoutId: failedPayoutId, provider: 'TEST_PROVIDER', providerEventId: `provider-failed:${suffix}`, providerPayoutId: `provider-payout-failed:${suffix}`, status: 'FAILED', rawBody: '{"status":"failed"}', signatureVerifiedAt: now, occurredAt: now }), 'DUPLICATE');
  const restoredWallet = await database.query(`SELECT available_minor, locked_for_payout_minor, paid_minor FROM wallet_projections WHERE partner_id = $1 AND currency = 'UAH'`, [partnerId]);
  assert.deepEqual(restoredWallet.rows[0], { available_minor: '150000', locked_for_payout_minor: '0', paid_minor: '0' });

  const paid = await repository.request({ ...baseInput, id: paidPayoutId, idempotencyKey: `payout-paid:${suffix}`, kyc: 'VERIFIED' });
  assert.equal(paid.status, 'HELD');
  assert.equal(await repository.settle({ payoutId: paidPayoutId, provider: 'TEST_PROVIDER', providerEventId: `provider-paid:${suffix}`, providerPayoutId: `provider-payout-paid:${suffix}`, status: 'PAID', rawBody: '{"status":"paid"}', signatureVerifiedAt: now, occurredAt: now }), 'PAID');
  const paidWallet = await database.query(`SELECT available_minor, locked_for_payout_minor, paid_minor FROM wallet_projections WHERE partner_id = $1 AND currency = 'UAH'`, [partnerId]);
  assert.deepEqual(paidWallet.rows[0], { available_minor: '100000', locked_for_payout_minor: '0', paid_minor: '50000' });
  console.log('PostgreSQL payout lock/settlement smoke: PASS');
} finally {
  await database.close();
}
