import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { PostgresPartnerRepository } from '../src/server/postgresPartnerRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');

const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const partnerId = `partner-${suffix}`;
const secondPartnerId = `partner-second-${suffix}`;
const userId = `user-${suffix}`;
const secondUserId = `user-second-${suffix}`;
const attributionId = `attribution-${suffix}`;
const secondAttributionId = `attribution-second-${suffix}`;
const paymentId = `payment-${suffix}`;
const qualifiedPaymentId = paymentId;
const transactionId = `ledger-${suffix}`;
const now = new Date().toISOString();

try {
  await database.withTransaction(async (client) => {
    await client.query(`INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3), ($4, $5, $6)`, [
      userId, `${userId}@example.test`, 'Test User', secondUserId, `${secondUserId}@example.test`, 'Second User'
    ]);
    await client.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status) VALUES
      ($1, $2, $3, 'BRONZE', 'GRACE', 1, 'QUALITY_GOOD'),
      ($4, $5, $6, 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD')`, [
      partnerId, userId, `REF_${suffix}`, secondPartnerId, secondUserId, `REF2_${suffix}`
    ]);
    await client.query(`INSERT INTO subscriptions (id, user_id, plan_code, state, provider, billing_consent_at, created_at, updated_at) VALUES
      ($1, $2, 'PREMIUM_MONTHLY', 'PREMIUM_ACTIVE', 'WEB', $3, $3, $3),
      ($4, $5, 'PREMIUM_MONTHLY', 'TRIAL_ACTIVE', NULL, NULL, $3, $3)`, [
      `subscription-${suffix}`, userId, now, `subscription-second-${suffix}`, secondUserId
    ]);
    await client.query(`INSERT INTO referral_attributions (id, user_id, direct_partner_id, second_level_partner_id, status, source_channel, campaign, attributed_at, qualified_at)
      VALUES ($1, $2, $3, NULL, 'LOCKED', 'TELEGRAM', 'test_campaign', $4, $4),
             ($5, $6, $7, $3, 'ATTRIBUTED', 'QR', 'test_qr', $4, NULL)`, [
      attributionId, userId, partnerId, now, secondAttributionId, secondUserId, secondPartnerId
    ]);
    await client.query(`INSERT INTO payments (id, user_id, provider, provider_payment_id, gross_amount_minor, currency, status, is_test_payment, paid_at)
      VALUES ($1, $2, 'WEB', $3, 1000, 'UAH', 'SUCCEEDED', false, $4)`, [paymentId, userId, `provider-${suffix}`, now]);
    await client.query(`INSERT INTO qualified_payments (payment_id, attribution_id, qcb_amount_minor, currency, qcb_policy_version, qualification_reason, rule_version, qualified_at)
      VALUES ($1, $2, 1000, 'UAH', 'qcb-v1', 'ACTIVE_PAID_SUBSCRIPTION', 'comp-v1', $3)`, [qualifiedPaymentId, attributionId, now]);
    await client.query(`INSERT INTO ledger_transactions (id, source, idempotency_key, rule_version, created_at) VALUES ($1, 'TEST_COMMISSION', $2, 'comp-v1', $3)`, [transactionId, `ledger:${suffix}`, now]);
    await client.query(`INSERT INTO ledger_lines (transaction_id, account_code, direction, amount_minor, currency, partner_id)
      VALUES ($1, 'PLATFORM_REVENUE', 'DEBIT', 500, 'UAH', NULL),
             ($1, 'PARTNER_AVAILABLE', 'CREDIT', 500, 'UAH', $2)`, [transactionId, partnerId]);
  });

  const repository = new PostgresPartnerRepository(database);
  assert.equal(await repository.recordRankEvaluation({
    partnerId,
    qualifiedActivePaidL1: 1,
    rank: 'BRONZE',
    rankState: 'GRACE',
    rateBps: 1000,
    graceCyclesInWindow: 1,
    ruleVersion: 'rank-v1',
    reason: 'THRESHOLD_GRACE',
    eventType: 'GRACE_STARTED',
    idempotencyKey: `rank:${suffix}`,
    occurredAt: now
  }), 'CREATED');
  assert.equal(await repository.recordRankEvaluation({
    partnerId,
    qualifiedActivePaidL1: 1,
    rank: 'BRONZE',
    rankState: 'GRACE',
    rateBps: 1000,
    graceCyclesInWindow: 1,
    ruleVersion: 'rank-v1',
    reason: 'THRESHOLD_GRACE',
    eventType: 'GRACE_STARTED',
    idempotencyKey: `rank:${suffix}`,
    occurredAt: now
  }), 'DUPLICATE');
  const dashboard = await repository.getDashboard(partnerId);
  assert.ok(dashboard);
  assert.equal(dashboard.partner.activeL1PaidCount, 1);
  assert.equal(dashboard.partner.totalL1Count, 1);
  assert.equal(dashboard.partner.totalL2Count, 1);
  assert.equal(dashboard.partner.effectiveRank, 'BRONZE');
  assert.equal(dashboard.partner.partnerRateBps, 1000);
  assert.equal(dashboard.partner.rankState, 'GRACE');
  assert.equal(dashboard.rankProgress.nextRank, 'SILVER');
  assert.equal(dashboard.rankProgress.remainingToNext, 29);
  assert.equal(dashboard.wallet.availableMinor, 500);

  await assert.rejects(
    database.query(`DELETE FROM partner_rank_snapshots WHERE partner_id = $1`, [partnerId]),
    /IMMUTABLE_RANK_HISTORY/
  );

  const l1 = await repository.listNetwork(partnerId, 'L1', 10, 0);
  assert.equal(l1.count, 1);
  assert.equal(l1.activePaidCount, 1);
  assert.match(l1.items[0]!.userAnonymousLabel, /^Користувач #[a-f0-9]{8}$/);
  assert.equal(l1.items[0]!.utmCampaign, 'test_campaign');
  assert.equal(Object.hasOwn(l1.items[0]!, 'email'), false);

  const l2 = await repository.listNetwork(partnerId, 'L2', 10, 0);
  assert.equal(l2.count, 1);
  assert.equal(l2.activePaidCount, 0);
  console.log('PostgreSQL partner repository smoke: PASS');
} finally {
  await database.close();
}
