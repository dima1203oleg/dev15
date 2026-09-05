import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { QualifiedPaymentRepository } from '../src/server/qualifiedPaymentRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `payment-user-${suffix}`;
const trialUserId = `payment-trial-user-${suffix}`;
const directPartnerId = `payment-direct-partner-${suffix}`;
const uplinePartnerId = `payment-upline-partner-${suffix}`;
const attributionId = `payment-attribution-${suffix}`;
const trialAttributionId = `payment-trial-attribution-${suffix}`;
const paymentId = `payment-qualified-${suffix}`;
const renewalPaymentId = `payment-renewal-${suffix}`;
const capPaymentId = `payment-cap-${suffix}`;
const trialPaymentId = `payment-trial-${suffix}`;
const now = '2026-02-01T00:00:00.000Z';

try {
  await database.withTransaction(async (client) => {
    await client.query(`INSERT INTO users (id, email, display_name) VALUES
      ($1, $2, 'Paid User'), ($3, $4, 'Trial User'), ($5, $6, 'Direct Partner'), ($7, $8, 'Upline Partner')`, [
      userId, `${userId}@example.test`, trialUserId, `${trialUserId}@example.test`, directPartnerId, `${directPartnerId}@example.test`, uplinePartnerId, `${uplinePartnerId}@example.test`
    ]);
    await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status) VALUES
      ($1, $2, 'PAY_DIRECT_${suffix}', 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD'),
      ($3, $4, 'PAY_UPLINE_${suffix}', 'GOLD', 'ACTIVE', 154, 'QUALITY_GOOD')`, [directPartnerId, directPartnerId, uplinePartnerId, uplinePartnerId]);
    await client.query(`INSERT INTO subscriptions (id, user_id, plan_code, state, provider, billing_consent_at, current_period_start, current_period_end, created_at, updated_at) VALUES
      ($1, $2, 'PREMIUM_MONTHLY', 'PREMIUM_ACTIVE', 'WEB', $3, $3, '2026-03-01T00:00:00.000Z', $3, $3),
      ($4, $5, 'PREMIUM_MONTHLY', 'TRIAL_ACTIVE', NULL, NULL, NULL, NULL, $3, $3)`, [
      `subscription-paid-${suffix}`, userId, now, `subscription-trial-${suffix}`, trialUserId
    ]);
    await client.query(`INSERT INTO referral_attributions (id, user_id, direct_partner_id, second_level_partner_id, status, source_channel, campaign, attributed_at)
      VALUES ($1, $2, $3, $4, 'ATTRIBUTED', 'WEB', 'payment_smoke', $5),
             ($6, $7, $3, $4, 'ATTRIBUTED', 'WEB', 'trial_smoke', $5)`, [attributionId, userId, directPartnerId, uplinePartnerId, now, trialAttributionId, trialUserId]);
  });

  const repository = new QualifiedPaymentRepository(database);
  const input = {
    paymentId,
    idempotencyKey: `qualified-payment:${suffix}`,
    userId,
    provider: 'WEB',
    providerPaymentId: `provider-payment-${suffix}`,
    payment: { gross: { amountMinor: 1000n, currency: 'UAH' as const } },
    attributionId,
    qcbPolicy: { version: 'web-qcb-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true },
    ruleVersion: 'comp-v1',
    paidAt: now,
    holdCommission: true,
    fraudStatus: 'OK' as const
  };
  const qualified = await repository.process(input);
  assert.equal(qualified.status, 'QUALIFIED');
  assert.equal(qualified.qcbAmountMinor, '1000');
  assert.equal(qualified.commissionIds.length, 2);
  assert.equal((await repository.process(input)).status, 'DUPLICATE');
  await assert.rejects(repository.process({ ...input, payment: { gross: { amountMinor: 1001n, currency: 'UAH' as const } } }), /PAYMENT_IDEMPOTENCY_CONFLICT/);

  const directProjection = await database.query(`SELECT available_minor, held_minor FROM wallet_projections WHERE partner_id = $1`, [directPartnerId]);
  assert.equal(directProjection.rows[0].available_minor, '0');
  assert.equal(directProjection.rows[0].held_minor, '50');
  const uplineProjection = await database.query(`SELECT held_minor FROM wallet_projections WHERE partner_id = $1`, [uplinePartnerId]);
  assert.equal(uplineProjection.rows[0].held_minor, '200');
  const commissionRows = await database.query(`SELECT COUNT(*)::int AS count FROM commissions WHERE payment_id = $1`, [paymentId]);
  assert.equal(commissionRows.rows[0].count, 2);
  const ledgerRows = await database.query(`SELECT COUNT(*)::int AS count FROM ledger_transactions WHERE source = 'COMMISSION_CREATED' AND idempotency_key LIKE $1`, [`commission:${paymentId}:%`]);
  assert.equal(ledgerRows.rows[0].count, 2);
  const attribution = await database.query(`SELECT status, qualified_at FROM referral_attributions WHERE id = $1`, [attributionId]);
  assert.equal(attribution.rows[0].status, 'LOCKED');
  assert.ok(attribution.rows[0].qualified_at);
  const rank = await database.query(`SELECT qualified_active_paid_l1, rank, rank_state FROM partners WHERE id = $1`, [directPartnerId]);
  assert.deepEqual(rank.rows[0], { qualified_active_paid_l1: 1, rank: 'STARTER', rank_state: 'ACTIVE' });
  const outbox = await database.query(`SELECT COUNT(*)::int AS count FROM event_outbox WHERE aggregate_id = $1 OR aggregate_id = ANY($2::text[])`, [paymentId, qualified.commissionIds]);
  assert.equal(outbox.rows[0].count, 3);

  const renewal = await repository.process({
    ...input,
    paymentId: renewalPaymentId,
    idempotencyKey: `qualified-payment-renewal:${suffix}`,
    providerPaymentId: `provider-renewal-payment-${suffix}`
  });
  assert.equal(renewal.status, 'QUALIFIED');
  assert.equal(renewal.commissionIds.length, 2);
  const renewalRank = await database.query(`SELECT qualified_active_paid_l1, rank, rank_state FROM partners WHERE id = $1`, [directPartnerId]);
  assert.deepEqual(renewalRank.rows[0], { qualified_active_paid_l1: 1, rank: 'STARTER', rank_state: 'ACTIVE' });
  const renewalDirectProjection = await database.query(`SELECT held_minor FROM wallet_projections WHERE partner_id = $1`, [directPartnerId]);
  assert.equal(renewalDirectProjection.rows[0].held_minor, '100');
  const renewalUplineProjection = await database.query(`SELECT held_minor FROM wallet_projections WHERE partner_id = $1`, [uplinePartnerId]);
  assert.equal(renewalUplineProjection.rows[0].held_minor, '400');

  const capFailed = await repository.process({
    ...input,
    paymentId: capPaymentId,
    idempotencyKey: `qualified-payment-cap:${suffix}`,
    providerPaymentId: `provider-cap-payment-${suffix}`,
    maxAllocationBps: 100
  });
  assert.equal(capFailed.status, 'CAP_VALIDATION_FAILED');
  assert.equal(capFailed.commissionIds.length, 0);
  const capCommissionRows = await database.query(`SELECT COUNT(*)::int AS count FROM commissions WHERE payment_id = $1`, [capPaymentId]);
  assert.equal(capCommissionRows.rows[0].count, 0);
  const capLedgerRows = await database.query(`SELECT COUNT(*)::int AS count FROM ledger_transactions WHERE idempotency_key LIKE $1`, [`commission:${capPaymentId}:%`]);
  assert.equal(capLedgerRows.rows[0].count, 0);

  const notQualified = await repository.process({
    ...input,
    paymentId: trialPaymentId,
    idempotencyKey: `qualified-payment-trial:${suffix}`,
    userId: trialUserId,
    providerPaymentId: `provider-trial-payment-${suffix}`,
    attributionId: trialAttributionId
  });
  assert.equal(notQualified.status, 'NOT_QUALIFIED');
  assert.equal(notQualified.reason, 'SUBSCRIPTION_NOT_QUALIFIED');
  const trialCommissionRows = await database.query(`SELECT COUNT(*)::int AS count FROM commissions WHERE payment_id = $1`, [trialPaymentId]);
  assert.equal(trialCommissionRows.rows[0].count, 0);

  console.log('PostgreSQL qualified payment/commission smoke: PASS');
} finally {
  await database.close();
}
