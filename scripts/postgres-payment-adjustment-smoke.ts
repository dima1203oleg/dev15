import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { PaymentAdjustmentRepository } from '../src/server/paymentAdjustmentRepository';
import { QualifiedPaymentRepository } from '../src/server/qualifiedPaymentRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `adjustment-user-${suffix}`;
const directPartnerId = `adjustment-direct-${suffix}`;
const uplinePartnerId = `adjustment-upline-${suffix}`;
const attributionId = `adjustment-attribution-${suffix}`;
const paymentId = `adjustment-payment-${suffix}`;
const now = '2026-02-01T00:00:00.000Z';

try {
  await database.withTransaction(async (client) => {
    await client.query(`INSERT INTO users (id, email, display_name) VALUES
      ($1, $2, 'Adjustment User'), ($3, $4, 'Adjustment Direct'), ($5, $6, 'Adjustment Upline')`, [
      userId, `${userId}@example.test`, directPartnerId, `${directPartnerId}@example.test`, uplinePartnerId, `${uplinePartnerId}@example.test`
    ]);
    await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status) VALUES
      ($1, $2, 'ADJ_DIRECT_${suffix}', 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD'),
      ($3, $4, 'ADJ_UPLINE_${suffix}', 'GOLD', 'ACTIVE', 0, 'QUALITY_GOOD')`, [directPartnerId, directPartnerId, uplinePartnerId, uplinePartnerId]);
    await client.query(`INSERT INTO subscriptions (id, user_id, plan_code, state, provider, billing_consent_at, created_at, updated_at)
      VALUES ($1, $2, 'PREMIUM_MONTHLY', 'PREMIUM_ACTIVE', 'WEB', $3, $3, $3)`, [`adjustment-subscription-${suffix}`, userId, now]);
    await client.query(`INSERT INTO referral_attributions (id, user_id, direct_partner_id, second_level_partner_id, status, source_channel, attributed_at)
      VALUES ($1, $2, $3, $4, 'ATTRIBUTED', 'WEB', $5)`, [attributionId, userId, directPartnerId, uplinePartnerId, now]);
  });

  const payments = new QualifiedPaymentRepository(database);
  const qualified = await payments.process({
    paymentId, idempotencyKey: `adjustment-payment:${suffix}`, userId, provider: 'WEB', providerPaymentId: `adjustment-provider:${suffix}`,
    payment: { gross: { amountMinor: 1000n, currency: 'UAH' } }, attributionId,
    qcbPolicy: { version: 'web-qcb-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true },
    ruleVersion: 'comp-v1', paidAt: now, fraudStatus: 'OK'
  });
  assert.equal(qualified.status, 'QUALIFIED');
  const adjustments = new PaymentAdjustmentRepository(database);
  const applied = await adjustments.applyVerifiedProviderEvent({
    paymentId, provider: 'WEB', providerEventId: `refund:${suffix}`, kind: 'REFUND',
    amount: { amountMinor: 1000n, currency: 'UAH' }, rawBody: '{"type":"refund"}', signatureVerifiedAt: now, occurredAt: now
  });
  assert.deepEqual(applied, { status: 'APPLIED', paymentId, kind: 'REFUND', commissionCount: 2, rankDecremented: true });
  assert.equal((await adjustments.applyVerifiedProviderEvent({
    paymentId, provider: 'WEB', providerEventId: `refund:${suffix}`, kind: 'REFUND',
    amount: { amountMinor: 1000n, currency: 'UAH' }, rawBody: '{"type":"refund"}', signatureVerifiedAt: now, occurredAt: now
  })).status, 'DUPLICATE');
  const wallet = await database.query(`SELECT held_minor, reversed_minor, debt_minor FROM wallet_projections WHERE partner_id = $1`, [directPartnerId]);
  assert.deepEqual(wallet.rows[0], { held_minor: '0', reversed_minor: '50', debt_minor: '0' });
  const rank = await database.query(`SELECT qualified_active_paid_l1, rank_state FROM partners WHERE id = $1`, [directPartnerId]);
  assert.deepEqual(rank.rows[0], { qualified_active_paid_l1: 0, rank_state: 'BELOW_THRESHOLD' });
  await assert.rejects(() => adjustments.applyVerifiedProviderEvent({
    paymentId, provider: 'WEB', providerEventId: `refund-second:${suffix}`, kind: 'REFUND',
    amount: { amountMinor: 1000n, currency: 'UAH' }, rawBody: '{"type":"refund"}', signatureVerifiedAt: now, occurredAt: now
  }), /PAYMENT_ALREADY_ADJUSTED/);
  await assert.rejects(() => adjustments.applyVerifiedProviderEvent({
    paymentId, provider: 'WEB', providerEventId: `refund-partial:${suffix}`, kind: 'CHARGEBACK',
    amount: { amountMinor: 999n, currency: 'UAH' }, rawBody: '{"type":"chargeback"}', signatureVerifiedAt: now, occurredAt: now
  }), /PARTIAL_ADJUSTMENT_UNSUPPORTED/);
  await assert.rejects(database.query(`DELETE FROM payment_adjustments WHERE payment_id = $1`, [paymentId]), /IMMUTABLE_PAYMENT_HISTORY/);
  console.log('PostgreSQL payment adjustment smoke: PASS');
} finally {
  await database.close();
}
