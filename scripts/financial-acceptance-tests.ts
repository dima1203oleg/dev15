import assert from 'node:assert/strict';
import {
  DEFAULT_RANK_RULES,
  InMemoryPartnerPlatform,
  ImmutableLedger,
  WebhookInbox,
  ambassadorTierForQualifiedL1,
  calculateCommissions,
  calculateQcb,
  canQualifySubscription,
  checkPayoutEligibility,
  createCommissionSnapshots,
  newlyUnlockedAchievements,
  resolveRank,
  startTrial,
  shouldRunAutoPayout,
  trialReminderSchedule,
  topLeaderboard,
  validateAllocationCap,
  type FxSnapshot
} from '../src/domain/partnerPlatform';

const usd = (amountMinor: bigint) => ({ amountMinor, currency: 'USD' as const });
const uah = (amountMinor: bigint) => ({ amountMinor, currency: 'UAH' as const });

// Trial and attribution contract.
const trial = startTrial('user-1', '2026-09-01T00:00:00.000Z', 30);
assert.equal(trial.endsAt, '2026-10-01T00:00:00.000Z');
assert.equal(trialReminderSchedule(trial).length, 3);
assert.equal(canQualifySubscription('TRIAL_ACTIVE'), false);
assert.equal(canQualifySubscription('PREMIUM_ACTIVE'), true);

// QCB is calculated from the qualified transaction, never from the plan label.
const qcb = calculateQcb({ gross: usd(100n), storeCosts: usd(15n), processingCosts: usd(5n) }, {
  version: 'web-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true
});
assert.equal(qcb.amountMinor, 80n);

const starter = resolveRank(1);
const platinum = resolveRank(200);
assert.equal(starter?.rank, 'STARTER');
assert.equal(starter?.rateBps, 500);
assert.equal(platinum?.rateBps, 2500);

const standard = calculateCommissions(usd(100n), [
  { partnerId: 'p1', referralLevel: 'L1', rateBps: 2500 },
  { partnerId: 'p2', referralLevel: 'L2', rateBps: 2500 }
]);
assert.equal(standard.cap.passed, true);
assert.equal(standard.commissions.reduce((sum, item) => sum + item.roundedCommissionMinor, 0n), 50n);
assert.equal(validateAllocationCap([
  { partnerId: 'p1', referralLevel: 'L1', rateBps: 2500 },
  { partnerId: 'p2', referralLevel: 'L2', rateBps: 2500 },
  { partnerId: 'campaign', referralLevel: 'L1', rateBps: 500 }
]).passed, false);

// Rounding normalization is deterministic and cannot exceed the rounded cap.
const tiny = calculateCommissions(usd(2n), [
  { partnerId: 'p1', referralLevel: 'L1', rateBps: 2500 },
  { partnerId: 'p2', referralLevel: 'L2', rateBps: 2500 }
]);
assert.equal(tiny.commissions.reduce((sum, item) => sum + item.roundedCommissionMinor, 0n), 1n);

const attribution = {
  id: 'attr-1', userId: 'user-1', directPartnerId: 'p1', secondLevelPartnerId: 'p2', status: 'LOCKED' as const,
  sourceChannel: 'DIRECT', attributedAt: trial.startedAt, qualifiedAt: trial.endsAt
};
const snapshots = createCommissionSnapshots({
  id: 'payment-1', userId: 'user-1', attribution,
  payment: { gross: usd(100n) }, qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[4], secondLevelPartnerRank: DEFAULT_RANK_RULES[4], ruleVersion: 'comp-v1', createdAt: trial.endsAt
}, true);
assert.equal(snapshots.length, 2);
assert.equal(snapshots[0].state, 'HELD');
assert.equal(snapshots[0].qcb.amountMinor, 100n);

// The orchestration boundary increments rank only for a real qualified paid payment.
const platform = new InMemoryPartnerPlatform(new ImmutableLedger(), { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true }, true);
platform.addPartner({ id: 'p1', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'ACTIVE' });
platform.addPartner({ id: 'p2', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'ACTIVE' });
const trialResult = platform.processPaidPayment({ id: 'trial-payment', userId: 'trial-user', payment: { gross: usd(100n) }, attribution, createdAt: trial.startedAt, ruleVersion: 'comp-v1', isTestPayment: true, fraudStatus: 'OK' });
assert.equal(trialResult.status, 'NOT_QUALIFIED');
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 0);
const paidResult = platform.processPaidPayment({ id: 'paid-payment', userId: 'paid-user', payment: { gross: usd(100n) }, attribution, createdAt: trial.endsAt, ruleVersion: 'comp-v1', fraudStatus: 'OK' });
assert.equal(paidResult.status, 'QUALIFIED');
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 1);
assert.equal(platform.processPaidPayment({ id: 'paid-payment', userId: 'paid-user', payment: { gross: usd(100n) }, attribution, createdAt: trial.endsAt, ruleVersion: 'comp-v1', fraudStatus: 'OK' }).status, 'DUPLICATE');
platform.releaseHold(paidResult.commissions[0].id, '2026-10-02T00:00:00.000Z');
assert.equal(platform.getCommission(paidResult.commissions[0].id)?.state, 'AVAILABLE');
platform.reversePayment('paid-payment', 'REFUND', '2026-10-03T00:00:00.000Z');
assert.equal(platform.getCommission(paidResult.commissions[0].id)?.state, 'REVERSED');

const webhooks = new WebhookInbox();
assert.equal(webhooks.accept('provider', 'evt-1'), true);
assert.equal(webhooks.accept('provider', 'evt-1'), false);

// Double-entry ledger is balanced, idempotent and projects wallet buckets.
const ledger = new ImmutableLedger();
ledger.commission({ id: 'commission-1', partnerId: 'p1', amountMinor: 25n, currency: 'USD', hold: true, source: 'PAYMENT_1', idempotencyKey: 'commission:1', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
ledger.commission({ id: 'commission-1', partnerId: 'p1', amountMinor: 25n, currency: 'USD', hold: true, source: 'PAYMENT_1', idempotencyKey: 'commission:1', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
assert.equal(ledger.all.length, 1);
ledger.moveBucket({ id: 'vest-1', partnerId: 'p1', from: 'HELD', to: 'AVAILABLE', amountMinor: 25n, currency: 'USD', source: 'HOLD_EXPIRED', idempotencyKey: 'vest:1', createdAt: trial.endsAt });
ledger.moveBucket({ id: 'lock-1', partnerId: 'p1', from: 'AVAILABLE', to: 'LOCKED_FOR_PAYOUT', amountMinor: 25n, currency: 'USD', source: 'PAYOUT_REQUESTED', idempotencyKey: 'payout:1', createdAt: trial.endsAt });
ledger.moveBucket({ id: 'paid-1', partnerId: 'p1', from: 'LOCKED_FOR_PAYOUT', to: 'PAID', amountMinor: 25n, currency: 'USD', source: 'PAYOUT_PAID', idempotencyKey: 'payout-paid:1', createdAt: trial.endsAt });
const wallet = ledger.project('p1', 'USD');
assert.deepEqual(wallet, { pending: 0n, held: 0n, available: 0n, lockedForPayout: 0n, paid: 25n, reversed: 0n, debt: 0n });

const fx: FxSnapshot = { baseCurrency: 'USD', payoutCurrency: 'UAH', rateNumerator: 4200n, rateDenominator: 100n, provider: 'configured-test-fx', quotedAt: trial.endsAt, expiresAt: '2026-10-02T00:00:00.000Z', version: 'fx-v1' };
const belowMinimum = checkPayoutEligibility({ requested: uah(41999n), available: uah(100000n), fx, policy: { minimumBase: usd(1000n), requestedGrossMinimum: true }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(belowMinimum.allowed, false);
assert.equal(belowMinimum.code, 'BELOW_MINIMUM_PAYOUT');
const allowed = checkPayoutEligibility({ requested: uah(42000n), available: uah(100000n), fx, policy: { minimumBase: usd(1000n), requestedGrossMinimum: true }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(allowed.allowed, true);

assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'THRESHOLD' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' }), true);
assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'THRESHOLD' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'REVIEW', payoutMethod: 'VERIFIED' }), false);

assert.deepEqual(newlyUnlockedAchievements(99, 100), [100]);
assert.equal(ambassadorTierForQualifiedL1(500, false), 'CANDIDATE');
assert.equal(ambassadorTierForQualifiedL1(1000, true), 'ELITE');
assert.deepEqual(topLeaderboard([
  { partnerId: 'private', score: 999n, publicProfileOptIn: false },
  { partnerId: 'public-b', score: 20n, publicProfileOptIn: true },
  { partnerId: 'public-a', score: 20n, publicProfileOptIn: true }
], 'MONTHLY').map((entry) => entry.partnerId), ['public-a', 'public-b']);

console.log('Financial acceptance tests: PASS');
