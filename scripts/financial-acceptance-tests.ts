import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  DEFAULT_RANK_RULES,
  InMemoryPartnerPlatform,
  ImmutableLedger,
  NotConnectedPayoutProvider,
  PayoutOrchestrator,
  SecureWebhookInbox,
  TransactionalOutbox,
  WebhookInbox,
  ambassadorTierForQualifiedL1,
  calculateCommissions,
  calculateQcb,
  canActivateRule,
  canStartAutomaticBilling,
  canTransitionRule,
  qualifyPayment,
  assessFraud,
  canQualifySubscription,
  convertWithFx,
  checkPayoutEligibility,
  createCommissionSnapshots,
  evaluateRank,
  newlyUnlockedAchievements,
  resolveRank,
  startTrial,
  shouldRunAutoPayout,
  trialReminderSchedule,
  transitionAfterTrial,
  transitionSubscriptionState,
  topLeaderboard,
  validateAllocationCap,
  validateRankRules,
  type PayoutProvider,
  type FxSnapshot
} from '../src/domain/partnerPlatform';

const usd = (amountMinor: bigint) => ({ amountMinor, currency: 'USD' as const });
const uah = (amountMinor: bigint) => ({ amountMinor, currency: 'UAH' as const });

// Trial and attribution contract.
const trial = startTrial('user-1', '2026-09-01T00:00:00.000Z', 30);
assert.equal(trial.endsAt, '2026-10-01T00:00:00.000Z');
assert.equal(trialReminderSchedule(trial).length, 3);
assert.equal(transitionAfterTrial(trial, '2026-09-30T23:59:59.000Z'), 'TRIAL_ACTIVE');
assert.equal(transitionAfterTrial(trial, trial.endsAt), 'TRIAL_EXPIRED');
assert.equal(transitionAfterTrial(trial, trial.endsAt, { provider: 'WEB', active: true, consentedAt: trial.startedAt }), 'PAYMENT_PENDING');
assert.equal(canStartAutomaticBilling({ provider: 'WEB', active: true, consentedAt: trial.startedAt }), true);
assert.equal(canStartAutomaticBilling({ provider: 'WEB', active: true }), false);
assert.equal(transitionSubscriptionState('PAYMENT_PENDING', 'PAYMENT_SUCCEEDED'), 'PREMIUM_ACTIVE');
assert.throws(() => transitionSubscriptionState('TRIAL_ACTIVE', 'PAYMENT_SUCCEEDED'), /INVALID_SUBSCRIPTION_TRANSITION/);
assert.throws(() => trialReminderSchedule(trial, [7, 7]), /INVALID_NOTIFICATION_SCHEDULE/);
assert.throws(() => trialReminderSchedule(trial, [31]), /INVALID_NOTIFICATION_SCHEDULE/);
assert.throws(() => startTrial('user-1', '2026-09-01T00:00:00.000Z', 1.5), /INVALID_TRIAL_POLICY/);
assert.throws(() => startTrial('user-1', '2026-09-01T00:00:00.000Z', 0), /INVALID_TRIAL_POLICY/);
assert.equal(canQualifySubscription('TRIAL_ACTIVE'), false);
assert.equal(canQualifySubscription('PREMIUM_ACTIVE'), true);
assert.equal(qualifyPayment({
  id: 'mismatch', userId: 'user-a', subscriptionState: 'PREMIUM_ACTIVE', attribution: { userId: 'user-b', id: 'attr-mismatch', directPartnerId: 'p1', status: 'ATTRIBUTED', sourceChannel: 'DIRECT' as const, attributedAt: trial.startedAt },
  payment: { gross: usd(100n) }, qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[0], ruleVersion: 'comp-v1', createdAt: trial.startedAt
}).reason, 'ATTRIBUTION_USER_MISMATCH');
assert.equal(qualifyPayment({
  id: 'trial-not-qualified', userId: 'user-1', subscriptionState: 'TRIAL_ACTIVE', attribution: { userId: 'user-1', id: 'attr-trial', directPartnerId: 'p1', status: 'LOCKED', sourceChannel: 'DIRECT', attributedAt: trial.startedAt },
  payment: { gross: usd(100n) }, qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[0], ruleVersion: 'comp-v1', createdAt: trial.startedAt
}).reason, 'SUBSCRIPTION_NOT_QUALIFIED');

// QCB is calculated from the qualified transaction, never from the plan label.
const qcb = calculateQcb({ gross: usd(100n), storeCosts: usd(15n), processingCosts: usd(5n) }, {
  version: 'web-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true
});
assert.equal(qcb.amountMinor, 80n);
assert.throws(() => calculateQcb({ gross: usd(100n), storeCosts: usd(-1n) }, {
  version: 'web-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true
}), /INVALID_MONEY/);

const starter = resolveRank(1);
const platinum = resolveRank(200);
assert.equal(starter?.rank, 'STARTER');
assert.equal(starter?.rateBps, 500);
assert.equal(platinum?.rateBps, 2500);
const rankDrop = evaluateRank(5, { rank: 'BRONZE', state: 'ACTIVE', graceCyclesInWindow: 0 });
assert.deepEqual(rankDrop, { state: 'BELOW_THRESHOLD', rank: 'BRONZE', rateBps: 1000, reason: 'THRESHOLD_NOT_MET' });
const rankGrace = evaluateRank(5, { rank: 'BRONZE', state: 'BELOW_THRESHOLD', graceCyclesInWindow: 0 });
assert.deepEqual(rankGrace, { state: 'GRACE', rank: 'BRONZE', rateBps: 1000, reason: 'GRACE_RATE_FROZEN' });
const exhaustedGrace = evaluateRank(5, { rank: 'BRONZE', state: 'GRACE', graceCyclesInWindow: 2 });
assert.equal(exhaustedGrace.state, 'BELOW_THRESHOLD');

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
assert.equal(validateAllocationCap([{ partnerId: '', referralLevel: 'L1', rateBps: 500 }]).passed, false);

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
  id: 'payment-1', userId: 'user-1', subscriptionState: 'PREMIUM_ACTIVE', attribution,
  payment: { gross: usd(100n) }, qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[4], secondLevelPartnerRank: DEFAULT_RANK_RULES[4], ruleVersion: 'comp-v1', createdAt: trial.endsAt
}, true);
assert.equal(snapshots.length, 2);
assert.equal(snapshots[0].state, 'HELD');
assert.equal(snapshots[0].qcb.amountMinor, 100n);
const samePartnerSnapshots = createCommissionSnapshots({
  id: 'same-partner-payment', userId: 'user-1', subscriptionState: 'PREMIUM_ACTIVE',
  attribution: { ...attribution, secondLevelPartnerId: 'p1' },
  payment: { gross: usd(100n) },
  qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[4], secondLevelPartnerRank: DEFAULT_RANK_RULES[4],
  ruleVersion: 'comp-v1', createdAt: trial.endsAt
}, true);
assert.equal(samePartnerSnapshots.length, 1, 'one partner cannot receive both L1 and L2 for one payment');
const selfReferralSnapshots = createCommissionSnapshots({
  id: 'self-referral-payment', userId: 'p1', subscriptionState: 'PREMIUM_ACTIVE',
  attribution: { ...attribution, userId: 'p1', status: 'LOCKED' },
  payment: { gross: usd(100n) },
  qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[4], secondLevelPartnerRank: DEFAULT_RANK_RULES[4],
  ruleVersion: 'comp-v1', createdAt: trial.endsAt
}, true);
assert.equal(selfReferralSnapshots.length, 0, 'self-referrals cannot create commissions even if attribution is marked locked');
const customCapSnapshots = createCommissionSnapshots({
  id: 'custom-cap-payment', userId: 'user-1', subscriptionState: 'PREMIUM_ACTIVE', attribution,
  payment: { gross: usd(100n) },
  qcbPolicy: { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true },
  directPartnerRank: DEFAULT_RANK_RULES[4], secondLevelPartnerRank: DEFAULT_RANK_RULES[4],
  maxAllocationBps: 3000, ruleVersion: 'comp-v2', createdAt: trial.endsAt
}, true);
assert.equal(customCapSnapshots.length, 0, 'versioned compensation cap must be applied before ledger creation');
assert.equal(validateAllocationCap([], 10001).passed, false);
assert.throws(() => calculateCommissions({ amountMinor: -1n, currency: 'USD' }, []), /INVALID_MONEY/);
assert.throws(() => assessFraud([{ name: 'negative-weight', weight: -1, present: true }]), /INVALID_FRAUD_SIGNAL/);

// The orchestration boundary increments rank only for a real qualified paid payment.
const platform = new InMemoryPartnerPlatform(new ImmutableLedger(), { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true }, true);
platform.addPartner({ id: 'p1', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'ACTIVE' });
platform.addPartner({ id: 'p2', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'ACTIVE' });
const trialResult = platform.processPaidPayment({ id: 'trial-payment', userId: 'trial-user', subscriptionState: 'TRIAL_ACTIVE', payment: { gross: usd(100n) }, attribution: { ...attribution, userId: 'trial-user' }, createdAt: trial.startedAt, ruleVersion: 'comp-v1', isTestPayment: true, fraudStatus: 'OK' });
assert.equal(trialResult.status, 'NOT_QUALIFIED');
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 0);
const paidAttribution = { ...attribution, userId: 'paid-user', status: 'ATTRIBUTED' as const, qualifiedAt: undefined };
const paidResult = platform.processPaidPayment({ id: 'paid-payment', userId: 'paid-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(100n) }, attribution: paidAttribution, createdAt: trial.endsAt, ruleVersion: 'comp-v1', fraudStatus: 'OK' });
assert.equal(paidResult.status, 'QUALIFIED');
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 1);
assert.equal(platform.processPaidPayment({ id: 'paid-payment', userId: 'paid-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(100n) }, attribution: paidAttribution, createdAt: trial.endsAt, ruleVersion: 'comp-v1', fraudStatus: 'OK' }).status, 'DUPLICATE');
assert.throws(() => platform.processPaidPayment({ id: 'paid-payment', userId: 'paid-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(101n) }, attribution: paidAttribution, createdAt: trial.endsAt, ruleVersion: 'comp-v1', fraudStatus: 'OK' }), /PAYMENT_IDEMPOTENCY_CONFLICT/);
const renewalResult = platform.processPaidPayment({ id: 'renewal-payment', userId: 'paid-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(100n) }, attribution: { ...paidAttribution, status: 'LOCKED', qualifiedAt: trial.endsAt }, createdAt: '2026-11-01T00:00:00.000Z', ruleVersion: 'comp-v1', fraudStatus: 'OK' });
assert.equal(renewalResult.status, 'QUALIFIED');
assert.equal(renewalResult.commissions.length, 2);
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 1, 'renewal must not increment the L1 rank counter');
platform.releaseHold(paidResult.commissions[0].id, '2026-10-02T00:00:00.000Z');
assert.equal(platform.getCommission(paidResult.commissions[0].id)?.state, 'AVAILABLE');
platform.reversePayment('paid-payment', 'REFUND', '2026-10-03T00:00:00.000Z');
assert.equal(platform.getCommission(paidResult.commissions[0].id)?.state, 'REVERSED');
assert.deepEqual(platform.getPartner('p1'), { id: 'p1', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'BELOW_THRESHOLD' });
assert.deepEqual(platform.reversePayment('paid-payment', 'REFUND', '2026-10-04T00:00:00.000Z'), [], 'a repeated reversal must be idempotent');
assert.equal(platform.getPartner('p1')?.qualifiedActivePaidL1, 0);

const webhooks = new WebhookInbox();
assert.equal(webhooks.accept('provider', 'evt-1'), true);
assert.equal(webhooks.accept('provider', 'evt-1'), false);
const outbox = new TransactionalOutbox();
const outboxEvent = { id: 'outbox-1', type: 'PAYMENT_QUALIFIED', aggregateType: 'payment', aggregateId: 'payment-1', payload: { qcbMinor: 100n.toString() }, occurredAt: trial.endsAt };
const firstOutboxSnapshot = outbox.enqueue(outboxEvent);
assert.deepEqual(firstOutboxSnapshot, outbox.enqueue(outboxEvent));
firstOutboxSnapshot.attempts = 99;
assert.equal(outbox.pending()[0]?.attempts, 0, 'outbox snapshots must not expose mutable internal state');
assert.equal(outbox.pending().length, 1);
assert.equal(outbox.markFailed('outbox-1', 'temporary worker failure').attempts, 1);
assert.equal(outbox.markPublished('outbox-1', '2026-10-01T00:01:00.000Z').publishedAt, '2026-10-01T00:01:00.000Z');
assert.equal(outbox.pending().length, 0);
assert.throws(() => outbox.enqueue({ ...outboxEvent, payload: { qcbMinor: '101' } }), /OUTBOX_IDEMPOTENCY_CONFLICT/);
assert.throws(() => outbox.markFailed('outbox-1', 'late failure'), /OUTBOX_EVENT_ALREADY_PUBLISHED/);

// Double-entry ledger is balanced, idempotent and projects wallet buckets.
const ledger = new ImmutableLedger();
ledger.commission({ id: 'commission-1', partnerId: 'p1', amountMinor: 25n, currency: 'USD', hold: true, source: 'PAYMENT_1', idempotencyKey: 'commission:1', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
ledger.commission({ id: 'commission-1', partnerId: 'p1', amountMinor: 25n, currency: 'USD', hold: true, source: 'PAYMENT_1', idempotencyKey: 'commission:1', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
assert.equal(ledger.all.length, 1);
assert.throws(() => ledger.commission({ id: 'different', partnerId: 'p1', amountMinor: 25n, currency: 'USD', hold: true, source: 'PAYMENT_1', idempotencyKey: 'commission:1', createdAt: trial.endsAt, ruleVersion: 'comp-v1' }), /IDEMPOTENCY_CONFLICT/);
assert.throws(() => ledger.append({
  id: 'mixed', source: 'PAYMENT_2', idempotencyKey: 'commission:2', createdAt: trial.endsAt, ruleVersion: 'comp-v1',
  lines: [
    { account: 'PLATFORM_REVENUE', direction: 'DEBIT', amountMinor: 25n, currency: 'USD' },
    { account: 'PARTNER_AVAILABLE', direction: 'CREDIT', amountMinor: 25n, currency: 'EUR', partnerId: 'p1' }
  ]
}), /MULTI_CURRENCY_TRANSACTION/);
assert.throws(() => ledger.append({
  id: 'malformed-line', source: 'PAYMENT_3', idempotencyKey: 'commission:3', createdAt: trial.endsAt,
  lines: [
    { account: 'PLATFORM_REVENUE', direction: 'DEBIT', amountMinor: 25n, currency: 'USD' },
    { account: 'PARTNER_AVAILABLE', direction: 'CREDIT', amountMinor: 25 as unknown as bigint, currency: 'USD', partnerId: 'p1' }
  ]
}), /INVALID_LEDGER_LINES/);
ledger.moveBucket({ id: 'vest-1', partnerId: 'p1', from: 'HELD', to: 'AVAILABLE', amountMinor: 25n, currency: 'USD', source: 'HOLD_EXPIRED', idempotencyKey: 'vest:1', createdAt: trial.endsAt });
assert.equal(ledger.moveBucket({ id: 'vest-1', partnerId: 'p1', from: 'HELD', to: 'AVAILABLE', amountMinor: 25n, currency: 'USD', source: 'HOLD_EXPIRED', idempotencyKey: 'vest:1', createdAt: trial.endsAt }).id, 'vest-1');
assert.throws(() => ledger.moveBucket({ id: 'overdraw', partnerId: 'p1', from: 'AVAILABLE', to: 'LOCKED_FOR_PAYOUT', amountMinor: 26n, currency: 'USD', source: 'PAYOUT_REQUESTED', idempotencyKey: 'payout:overdraw', createdAt: trial.endsAt }), /INSUFFICIENT_LEDGER_BUCKET/);
ledger.moveBucket({ id: 'lock-1', partnerId: 'p1', from: 'AVAILABLE', to: 'LOCKED_FOR_PAYOUT', amountMinor: 25n, currency: 'USD', source: 'PAYOUT_REQUESTED', idempotencyKey: 'payout:1', createdAt: trial.endsAt });
ledger.moveBucket({ id: 'paid-1', partnerId: 'p1', from: 'LOCKED_FOR_PAYOUT', to: 'PAID', amountMinor: 25n, currency: 'USD', source: 'PAYOUT_PAID', idempotencyKey: 'payout-paid:1', createdAt: trial.endsAt });
const wallet = ledger.project('p1', 'USD');
assert.deepEqual(wallet, { pending: 0n, held: 0n, available: 0n, lockedForPayout: 0n, paid: 25n, reversed: 0n, debt: 0n });

// Batch append and bucket moves are atomic: a later invalid item cannot leave
// an earlier valid transaction or wallet transition committed.
const atomicLedger = new ImmutableLedger();
const validBatchEntry = atomicLedger.commissionTransaction({ id: 'atomic-valid', partnerId: 'p1', amountMinor: 10n, currency: 'USD', hold: true, source: 'PAYMENT_ATOMIC', idempotencyKey: 'atomic:valid', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
const invalidBatchEntry = { ...validBatchEntry, id: 'atomic-invalid', idempotencyKey: 'atomic:invalid', lines: [{ ...validBatchEntry.lines[0], amountMinor: 11n }, validBatchEntry.lines[1]] };
assert.throws(() => atomicLedger.appendBatch([validBatchEntry, invalidBatchEntry]), /LEDGER_NOT_BALANCED/);
assert.equal(atomicLedger.all.length, 0);
assert.throws(() => atomicLedger.appendBatch([
  validBatchEntry,
  { ...validBatchEntry, idempotencyKey: 'ledger-id-duplicate', lines: validBatchEntry.lines.map((line) => ({ ...line })) }
]), /TRANSACTION_ID_CONFLICT/);
assert.equal(atomicLedger.all.length, 0);
atomicLedger.append(validBatchEntry);
assert.throws(() => atomicLedger.moveBuckets([
  { id: 'atomic-vest', partnerId: 'p1', from: 'HELD', to: 'AVAILABLE', amountMinor: 10n, currency: 'USD', source: 'HOLD_EXPIRED', idempotencyKey: 'atomic:vest', createdAt: trial.endsAt },
  { id: 'atomic-overdraw', partnerId: 'p1', from: 'HELD', to: 'AVAILABLE', amountMinor: 1n, currency: 'USD', source: 'HOLD_EXPIRED', idempotencyKey: 'atomic:overdraw', createdAt: trial.endsAt }
]), /INSUFFICIENT_LEDGER_BUCKET/);
assert.deepEqual(atomicLedger.project('p1', 'USD'), { pending: 0n, held: 10n, available: 0n, lockedForPayout: 0n, paid: 0n, reversed: 0n, debt: 0n });

const fx: FxSnapshot = { baseCurrency: 'USD', payoutCurrency: 'UAH', rateNumerator: 4200n, rateDenominator: 100n, provider: 'configured-test-fx', quotedAt: trial.endsAt, expiresAt: '2026-10-02T00:00:00.000Z', version: 'fx-v1' };
const belowMinimum = checkPayoutEligibility({ requested: uah(41999n), available: uah(100000n), fx, policy: { minimumBase: usd(1000n), requestedGrossMinimum: true }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(belowMinimum.allowed, false);
assert.equal(belowMinimum.code, 'BELOW_MINIMUM_PAYOUT');
const allowed = checkPayoutEligibility({ requested: uah(42000n), available: uah(100000n), fx, policy: { minimumBase: usd(1000n), requestedGrossMinimum: true }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(allowed.allowed, true);
const netMinimumNeedsQuote = checkPayoutEligibility({ requested: uah(42100n), available: uah(100000n), fx, policy: { minimumBase: usd(1000n), requestedGrossMinimum: false }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(netMinimumNeedsQuote.allowed, false);
assert.equal(netMinimumNeedsQuote.code, 'PAYOUT_FEE_QUOTE_REQUIRED');
const netMinimumAllowed = checkPayoutEligibility({ requested: uah(42100n), available: uah(100000n), fx, feeQuote: { providerFee: uah(100n) }, policy: { minimumBase: usd(1000n), requestedGrossMinimum: false }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(netMinimumAllowed.allowed, true);
const netMinimumRejected = checkPayoutEligibility({ requested: uah(42099n), available: uah(100000n), fx, feeQuote: { providerFee: uah(100n) }, policy: { minimumBase: usd(1000n), requestedGrossMinimum: false }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(netMinimumRejected.allowed, false);
assert.equal(netMinimumRejected.code, 'BELOW_MINIMUM_NET_PAYOUT');
const expiredFx = { ...fx, quotedAt: '2026-09-01T00:00:00.000Z', expiresAt: '2026-09-02T00:00:00.000Z' };
const expiredCheck = checkPayoutEligibility({ requested: uah(42000n), available: uah(100000n), fx: expiredFx, asOf: '2026-09-03T00:00:00.000Z', policy: { minimumBase: usd(1000n), requestedGrossMinimum: true }, kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' });
assert.equal(expiredCheck.allowed, false);
assert.equal(expiredCheck.code, 'FX_SNAPSHOT_EXPIRED');
assert.equal(expiredCheck.minimumPayout, null);
assert.throws(() => convertWithFx(usd(1000n), 'UAH', expiredFx, '2026-09-03T00:00:00.000Z'), /FX_SNAPSHOT_EXPIRED/);
assert.throws(() => convertWithFx(usd(1000n), 'UAH', { ...fx, provider: '' }, '2026-09-30T00:00:00.000Z'), /INVALID_FX_SNAPSHOT/);

assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'THRESHOLD' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' }), true);
assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'THRESHOLD' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'REVIEW', payoutMethod: 'VERIFIED' }), false);
assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'MONTHLY' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' }), false);
assert.equal(shouldRunAutoPayout({ enabled: true, threshold: uah(42000n), cadence: 'MONTHLY' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' }, { cadenceDue: true }), true);
assert.throws(() => shouldRunAutoPayout({ enabled: true, threshold: { amountMinor: -1n, currency: 'UAH' }, cadence: 'THRESHOLD' }, uah(50000n), { kyc: 'VERIFIED', compliance: 'OK', fraud: 'OK', payoutMethod: 'VERIFIED' }), /INVALID_MONEY/);
assert.throws(() => validateRankRules([{ rank: 'GOLD', minQualifiedActivePaidL1: 1, rateBps: 2000 }, { rank: 'GOLD', minQualifiedActivePaidL1: 75, rateBps: 2000 }]), /INVALID_RANK_RULES/);
assert.equal(canTransitionRule('DRAFT', 'VALIDATED'), true);
assert.equal(canTransitionRule('DRAFT', 'APPROVED'), false);
assert.equal(canActivateRule({ version: 'rates-v2', state: 'SCHEDULED', value: { rateBps: 2500 }, createdBy: 'admin-a', approvedBy: 'admin-b', effectiveFrom: '2026-10-01T00:00:00.000Z', reason: 'approved change' }), true);
assert.equal(canActivateRule({ version: 'rates-v2', state: 'SCHEDULED', value: { rateBps: 2500 }, createdBy: 'admin-a', approvedBy: 'admin-a', effectiveFrom: '2026-10-01T00:00:00.000Z', reason: 'self approved' }), false);
assert.equal(canActivateRule({ version: 'rates-v2', state: 'SCHEDULED', value: { rateBps: 2500 }, createdBy: 'admin-a', approvedBy: 'admin-b', effectiveFrom: 'not-a-date', reason: 'invalid date' }), false);
const customRankRules = [{ rank: 'STARTER' as const, minQualifiedActivePaidL1: 1, rateBps: 700 }];
const customRankPlatform = new InMemoryPartnerPlatform(new ImmutableLedger(), { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true }, true, customRankRules);
customRankPlatform.addPartner({ id: 'custom-p1', qualifiedActivePaidL1: 0, rank: 'STARTER', rankState: 'ACTIVE' });
const customRankResult = customRankPlatform.processPaidPayment({ id: 'custom-rank-payment', userId: 'custom-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(100n) }, attribution: { ...attribution, userId: 'custom-user', directPartnerId: 'custom-p1', secondLevelPartnerId: undefined }, createdAt: trial.endsAt, ruleVersion: 'comp-custom-v1', fraudStatus: 'OK' });
assert.equal(customRankResult.commissions[0]?.rateBps, 700);
const rollbackPlatform = new InMemoryPartnerPlatform(new ImmutableLedger(), { version: 'web-v1', includeStoreCosts: false, includeProcessingCosts: false, includeTaxes: true }, true);
rollbackPlatform.addPartner({ id: 'rollback-p1', qualifiedActivePaidL1: 74, rank: 'SILVER', rankState: 'ACTIVE' });
const rollbackResult = rollbackPlatform.processPaidPayment({ id: 'rollback-payment', userId: 'rollback-user', subscriptionState: 'PREMIUM_ACTIVE', payment: { gross: usd(100n) }, attribution: { ...attribution, userId: 'rollback-user', directPartnerId: 'rollback-p1', secondLevelPartnerId: undefined }, createdAt: trial.endsAt, ruleVersion: 'comp-rollback-v1', maxAllocationBps: 1000, fraudStatus: 'OK' });
assert.equal(rollbackResult.status, 'CAP_VALIDATION_FAILED');
assert.deepEqual(rollbackPlatform.getPartner('rollback-p1'), { id: 'rollback-p1', qualifiedActivePaidL1: 74, rank: 'SILVER', rankState: 'ACTIVE' }, 'failed payment must not leave an upgraded rank behind');
const disconnectedPayoutProvider = new NotConnectedPayoutProvider();
assert.equal(disconnectedPayoutProvider.connected, false);
await assert.rejects(() => disconnectedPayoutProvider.calculateFee(uah(42000n)), /PAYOUT_PROVIDER_NOT_CONNECTED/);

// Signed webhook admission and provider orchestration keep the immutable
// ledger as the source of truth for lock/settlement transitions.
const webhookInbox = new SecureWebhookInbox();
const webhookRawBody = '{"event":"payout.paid"}';
const webhookTimestamp = '1700000000';
const webhookSecret = 'test-webhook-secret';
const webhookSignature = createHmac('sha256', webhookSecret).update(`${webhookTimestamp}.${webhookRawBody}`).digest('hex');
const signedWebhook = { provider: 'test-provider', eventId: 'evt-payout-1', rawBody: webhookRawBody, signature: webhookSignature, timestamp: webhookTimestamp, secret: webhookSecret };
assert.equal(webhookInbox.accept(signedWebhook, 1700000000000), true);
assert.equal(webhookInbox.accept(signedWebhook, 1700000000000), false);
assert.throws(() => webhookInbox.accept({ ...signedWebhook, signature: '0'.repeat(64), eventId: 'evt-payout-2' }, 1700000000000), /WEBHOOK_SIGNATURE_INVALID/);
assert.throws(() => webhookInbox.accept({ ...signedWebhook, eventId: 'evt-payout-3', timestamp: '1700001000' }, 1700000000000), /WEBHOOK_TIMESTAMP_OUT_OF_RANGE/);

const payoutProvider: PayoutProvider = {
  connected: true,
  async createRecipient() { return { providerRecipientId: 'recipient-1', status: 'VERIFIED' }; },
  async verifyRecipient() { return { status: 'VERIFIED' }; },
  async calculateFee() { return uah(100n); },
  async createPayout() { return { providerPayoutId: 'provider-payout-1', status: 'PROCESSING' }; },
  async getPayout() { return { status: 'PROCESSING' }; },
  async cancelPayout() { return { status: 'CANCELED' }; },
  async handleWebhook() { return { accepted: true, eventType: 'PAYOUT_PAID' }; },
  async reconcile() { return { checked: 1, mismatches: 0 }; }
};
const payoutLedger = new ImmutableLedger();
payoutLedger.commission({ id: 'payout-source', partnerId: 'payout-partner', amountMinor: 50000n, currency: 'UAH', hold: false, source: 'PAYMENT_PAYOUT', idempotencyKey: 'payout-source:commission', createdAt: trial.endsAt, ruleVersion: 'comp-v1' });
const payoutOrchestrator = new PayoutOrchestrator(payoutLedger, payoutProvider);
const payoutInput = {
  id: 'payout-1', idempotencyKey: 'payout-request-1', partnerId: 'payout-partner', destination: 'UA••••6789',
  requested: uah(42000n), available: uah(50000n), fx,
  policy: { minimumBase: usd(1000n), requestedGrossMinimum: true },
  kyc: 'VERIFIED' as const, compliance: 'OK' as const, fraud: 'OK' as const, payoutMethod: 'VERIFIED' as const,
  createdAt: trial.endsAt, asOf: trial.endsAt
};
const payoutExecution = await payoutOrchestrator.request(payoutInput);
assert.equal(payoutExecution.eligibility.allowed, true);
assert.equal(payoutExecution.payout.state, 'PROCESSING');
assert.deepEqual(payoutLedger.project('payout-partner', 'UAH'), { pending: 0n, held: 0n, available: 8000n, lockedForPayout: 42000n, paid: 0n, reversed: 0n, debt: 0n });
assert.equal((await payoutOrchestrator.request(payoutInput)).payout.state, 'PROCESSING');
await assert.rejects(() => payoutOrchestrator.request({ ...payoutInput, idempotencyKey: 'payout-request-2' }), /PAYOUT_IDEMPOTENCY_CONFLICT/);
assert.equal(payoutOrchestrator.settle('payout-request-1', 'PAID', '2026-10-01T00:01:00.000Z', 'provider-payout-1').state, 'PAID');
assert.equal(payoutOrchestrator.settle('payout-request-1', 'PAID', '2026-10-01T00:02:00.000Z', 'provider-payout-1').state, 'PAID');
assert.deepEqual(payoutLedger.project('payout-partner', 'UAH'), { pending: 0n, held: 0n, available: 8000n, lockedForPayout: 0n, paid: 42000n, reversed: 0n, debt: 0n });
assert.throws(() => payoutOrchestrator.settle('payout-request-1', 'FAILED', '2026-10-01T00:03:00.000Z'), /PAYOUT_STATE_CONFLICT/);

assert.deepEqual(newlyUnlockedAchievements(99, 100), [100]);
assert.equal(ambassadorTierForQualifiedL1(500, false), 'CANDIDATE');
assert.equal(ambassadorTierForQualifiedL1(500, true), 'AMBASSADOR');
assert.equal(ambassadorTierForQualifiedL1(1000, true), 'ELITE');
const leaderboardInput = [
  { partnerId: 'private', score: 999n, publicProfileOptIn: false },
  { partnerId: 'public-b', score: 20n, publicProfileOptIn: true },
  { partnerId: 'public-a', score: 20n, publicProfileOptIn: true }
];
assert.deepEqual(topLeaderboard(leaderboardInput, 'MONTHLY').map((entry) => entry.partnerId), ['public-a', 'public-b']);
assert.deepEqual(leaderboardInput.map((entry) => entry.partnerId), ['private', 'public-b', 'public-a']);

console.log('Financial acceptance tests: PASS');
