/**
 * SIREN UA Partner Platform 4.0
 *
 * Pure financial/domain primitives.  These functions deliberately have no
 * Express, database or provider side effects so that the same rules can be
 * used by HTTP handlers, workers and acceptance tests.
 *
 * Money is represented as integer minor units and all percentage operations
 * use bigint arithmetic.  The browser must never become the source of truth.
 */

export type Currency = 'USD' | 'UAH' | 'EUR' | 'PLN';
export type ReferralLevel = 'L1' | 'L2';
export type Rank = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type RankState = 'ACTIVE' | 'BELOW_THRESHOLD' | 'GRACE' | 'COOLDOWN' | 'SUSPENDED';
export type QualityStatus = 'QUALITY_GOOD' | 'QUALITY_REVIEW' | 'QUALITY_RESTRICTED' | 'QUALITY_BLOCKED';

export interface Money {
  amountMinor: bigint;
  currency: Currency;
}

function assertMoney(value: Money, code = 'INVALID_MONEY'): void {
  if (!value || typeof value.amountMinor !== 'bigint' || value.amountMinor < 0n) throw new Error(code);
  if (!['USD', 'UAH', 'EUR', 'PLN'].includes(value.currency)) throw new Error('INVALID_CURRENCY');
}

export interface RankRule {
  rank: Rank;
  minQualifiedActivePaidL1: number;
  rateBps: number;
}

export const DEFAULT_RANK_RULES: readonly RankRule[] = [
  { rank: 'STARTER', minQualifiedActivePaidL1: 1, rateBps: 500 },
  { rank: 'BRONZE', minQualifiedActivePaidL1: 10, rateBps: 1000 },
  { rank: 'SILVER', minQualifiedActivePaidL1: 30, rateBps: 1500 },
  { rank: 'GOLD', minQualifiedActivePaidL1: 75, rateBps: 2000 },
  { rank: 'PLATINUM', minQualifiedActivePaidL1: 200, rateBps: 2500 }
];

export interface Trial {
  userId: string;
  startedAt: string;
  endsAt: string;
  trialDays: number;
  status: 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED';
}

export type SubscriptionState = 'REGISTERED' | 'TRIAL_ACTIVE' | 'TRIAL_ENDING' | 'PAYMENT_PENDING' | 'PREMIUM_ACTIVE' | 'TRIAL_EXPIRED' | 'PAYMENT_FAILED' | 'PAST_DUE' | 'SUBSCRIPTION_GRACE' | 'CANCEL_AT_PERIOD_END' | 'CANCELED' | 'EXPIRED' | 'SUSPENDED' | 'REFUNDED';

export function canQualifySubscription(state: SubscriptionState): boolean {
  return state === 'PREMIUM_ACTIVE';
}

export function addCalendarDays(iso: string, days: number): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error('INVALID_DATE');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function startTrial(userId: string, startedAt: string, trialDays = 30): Trial {
  if (!userId || !Number.isInteger(trialDays) || trialDays < 0) throw new Error('INVALID_TRIAL_POLICY');
  return { userId, startedAt, endsAt: addCalendarDays(startedAt, trialDays), trialDays, status: 'TRIAL_ACTIVE' };
}

export function trialStatus(trial: Trial, at: string): Trial['status'] {
  const now = new Date(at).getTime();
  const ends = new Date(trial.endsAt).getTime();
  if (!Number.isFinite(now) || !Number.isFinite(ends)) throw new Error('INVALID_DATE');
  return now < ends ? 'TRIAL_ACTIVE' : 'TRIAL_EXPIRED';
}

export interface Attribution {
  id: string;
  userId: string;
  directPartnerId: string;
  secondLevelPartnerId?: string;
  status: 'ATTRIBUTED' | 'LOCKED' | 'REJECTED';
  sourceChannel: string;
  campaign?: string;
  attributedAt: string;
  qualifiedAt?: string;
}

export function canAttribute(userId: string, partnerId: string, existing: Attribution | undefined): boolean {
  if (!userId || !partnerId || userId === partnerId) return false;
  return !existing || existing.status !== 'LOCKED';
}

export function lockAttribution(attribution: Attribution, qualifiedAt: string): Attribution {
  if (attribution.status === 'REJECTED') throw new Error('REJECTED_ATTRIBUTION');
  return { ...attribution, status: 'LOCKED', qualifiedAt };
}

export function resolveReferralChain(attribution: Attribution): Array<{ partnerId: string; level: ReferralLevel }> {
  if (!attribution.userId || !attribution.directPartnerId || attribution.userId === attribution.directPartnerId) return [];
  const chain: Array<{ partnerId: string; level: ReferralLevel }> = [
    { partnerId: attribution.directPartnerId, level: 'L1' }
  ];
  if (attribution.secondLevelPartnerId && attribution.secondLevelPartnerId !== attribution.directPartnerId && attribution.secondLevelPartnerId !== attribution.userId) {
    chain.push({ partnerId: attribution.secondLevelPartnerId, level: 'L2' });
  }
  return chain;
}

function isSelfReferral(attribution: Attribution): boolean {
  return attribution.userId === attribution.directPartnerId || attribution.userId === attribution.secondLevelPartnerId;
}

export function resolveRank(qualifiedActivePaidL1: number, rules: readonly RankRule[] = DEFAULT_RANK_RULES): RankRule | null {
  if (!Number.isInteger(qualifiedActivePaidL1) || qualifiedActivePaidL1 < 0) throw new Error('INVALID_L1_COUNT');
  return [...rules]
    .sort((a, b) => b.minQualifiedActivePaidL1 - a.minQualifiedActivePaidL1)
    .find((rule) => qualifiedActivePaidL1 >= rule.minQualifiedActivePaidL1) ?? null;
}

export interface GracePolicy {
  maxCycles: number;
  rollingDays: number;
  cooldownDays: number;
}

export const DEFAULT_GRACE_POLICY: GracePolicy = { maxCycles: 2, rollingDays: 180, cooldownDays: 90 };

export interface RankEvaluation {
  state: RankState;
  rank: Rank | null;
  rateBps: number;
  reason: string;
}

export function evaluateRank(
  qualifiedActivePaidL1: number,
  current: { rank: Rank; state: RankState; graceCyclesInWindow: number },
  policy: GracePolicy = DEFAULT_GRACE_POLICY,
  rules: readonly RankRule[] = DEFAULT_RANK_RULES
): RankEvaluation {
  const resolved = resolveRank(qualifiedActivePaidL1, rules);
  const currentRule = rules.find((rule) => rule.rank === current.rank);
  if (resolved && resolved.minQualifiedActivePaidL1 >= (currentRule?.minQualifiedActivePaidL1 ?? 0)) {
    return { state: 'ACTIVE', rank: resolved.rank, rateBps: resolved.rateBps, reason: 'THRESHOLD_MET' };
  }
  if (current.state === 'GRACE' && current.graceCyclesInWindow <= policy.maxCycles) {
    return { state: 'GRACE', rank: current.rank, rateBps: currentRule?.rateBps ?? 0, reason: 'GRACE_RATE_FROZEN' };
  }
  return { state: 'BELOW_THRESHOLD', rank: resolved?.rank ?? null, rateBps: resolved?.rateBps ?? 0, reason: 'THRESHOLD_NOT_MET' };
}

export interface QualifiedPaymentInput {
  gross: Money;
  refunds?: Money;
  chargebacks?: Money;
  nonCommissionableTaxes?: Money;
  storeCosts?: Money;
  processingCosts?: Money;
  nonCommissionableDiscounts?: Money;
  promoCredits?: Money;
}

export interface QcbPolicy {
  version: string;
  includeStoreCosts: boolean;
  includeProcessingCosts: boolean;
  includeTaxes: boolean;
}

function subtractIfIncluded(value: bigint, deduction: Money | undefined, include: boolean, currency: Currency): bigint {
  if (!include || !deduction) return value;
  if (deduction.currency !== currency) throw new Error('CURRENCY_MISMATCH');
  return value - deduction.amountMinor;
}

export function calculateQcb(payment: QualifiedPaymentInput, policy: QcbPolicy): Money {
  assertMoney(payment.gross);
  for (const deduction of [payment.refunds, payment.chargebacks, payment.nonCommissionableTaxes, payment.storeCosts, payment.processingCosts, payment.nonCommissionableDiscounts, payment.promoCredits]) {
    if (deduction) assertMoney(deduction);
  }
  const currency = payment.gross.currency;
  let qcb = payment.gross.amountMinor;
  qcb = subtractIfIncluded(qcb, payment.refunds, true, currency);
  qcb = subtractIfIncluded(qcb, payment.chargebacks, true, currency);
  qcb = subtractIfIncluded(qcb, payment.nonCommissionableTaxes, policy.includeTaxes, currency);
  qcb = subtractIfIncluded(qcb, payment.storeCosts, policy.includeStoreCosts, currency);
  qcb = subtractIfIncluded(qcb, payment.processingCosts, policy.includeProcessingCosts, currency);
  qcb = subtractIfIncluded(qcb, payment.nonCommissionableDiscounts, true, currency);
  qcb = subtractIfIncluded(qcb, payment.promoCredits, true, currency);
  return { currency, amountMinor: qcb > 0n ? qcb : 0n };
}

export function percentHalfUp(amountMinor: bigint, rateBps: number): bigint {
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) throw new Error('INVALID_RATE_BPS');
  if (amountMinor < 0n) throw new Error('NEGATIVE_MONEY_NOT_ALLOWED');
  return (amountMinor * BigInt(rateBps) + 5000n) / 10000n;
}

export interface CommissionAllocation {
  partnerId: string;
  referralLevel: ReferralLevel;
  rateBps: number;
}

export interface CommissionResult extends CommissionAllocation {
  rawCommissionMinor: bigint;
  roundedCommissionMinor: bigint;
  capNormalized: boolean;
}

export interface CapResult {
  passed: boolean;
  totalAllocationBps: number;
  maxCapBps: number;
  reason: string;
}

export function validateAllocationCap(allocations: readonly CommissionAllocation[], maxCapBps = 5000): CapResult {
  const totalAllocationBps = allocations.reduce((sum, item) => sum + item.rateBps, 0);
  const validRates = Number.isInteger(maxCapBps) && maxCapBps >= 0 && maxCapBps <= 10000 && allocations.every((item) => Number.isInteger(item.rateBps) && item.rateBps >= 0 && item.rateBps <= 10000);
  const passed = validRates && totalAllocationBps <= maxCapBps;
  return {
    passed,
    totalAllocationBps,
    maxCapBps,
    reason: !validRates ? 'CAP_VALIDATION_INVALID_RATES' : passed ? 'CAP_VALIDATION_PASS' : 'CAP_VALIDATION_FAILED'
  };
}

/**
 * Calculates in input order. If cent rounding would exceed the cap, the
 * remaining cap is allocated in that same deterministic order. This makes a
 * tiny-QCB edge case explainable and prevents an over-cap ledger write.
 */
export function calculateCommissions(qcb: Money, allocations: readonly CommissionAllocation[], maxCapBps = 5000): {
  cap: CapResult;
  commissions: CommissionResult[];
  cappedAmountMinor: bigint;
} {
  assertMoney(qcb);
  const cap = validateAllocationCap(allocations, maxCapBps);
  if (!cap.passed) return { cap, commissions: [], cappedAmountMinor: 0n };
  const roundedCap = percentHalfUp(qcb.amountMinor, maxCapBps);
  let remaining = roundedCap;
  const commissions = allocations.map((allocation) => {
    const rawCommissionMinor = percentHalfUp(qcb.amountMinor, allocation.rateBps);
    const roundedCommissionMinor = rawCommissionMinor <= remaining ? rawCommissionMinor : remaining;
    remaining -= roundedCommissionMinor;
    return { ...allocation, rawCommissionMinor, roundedCommissionMinor, capNormalized: roundedCommissionMinor !== rawCommissionMinor };
  });
  return { cap, commissions, cappedAmountMinor: roundedCap - remaining };
}

export type CommissionState = 'CREATED' | 'PENDING' | 'HELD' | 'VESTED' | 'AVAILABLE' | 'PAID' | 'REJECTED' | 'HELD_FOR_REVIEW' | 'REVERSED' | 'ADJUSTED';

export interface CommissionSnapshot {
  id: string;
  paymentId: string;
  partnerId: string;
  referralLevel: ReferralLevel;
  qcb: Money;
  qcbPolicyVersion: string;
  achievedRank: Rank;
  effectiveRank: Rank;
  rateBps: number;
  rawCommission: Money;
  roundedCommission: Money;
  roundingPolicy: 'HALF_UP';
  capResult: CapResult;
  ruleVersion: string;
  state: CommissionState;
  createdAt: string;
}

export interface QualifiedPayment {
  id: string;
  userId: string;
  payment: QualifiedPaymentInput;
  qcbPolicy: QcbPolicy;
  attribution: Attribution;
  directPartnerRank: RankRule;
  secondLevelPartnerRank?: RankRule;
  ruleVersion: string;
  createdAt: string;
  isTestPayment?: boolean;
  fraudStatus?: 'OK' | 'REVIEW' | 'BLOCKED';
}

export function qualifyPayment(input: QualifiedPayment): { qualified: boolean; reason: string; qcb: Money } {
  if (input.userId !== input.attribution.userId) return { qualified: false, reason: 'ATTRIBUTION_USER_MISMATCH', qcb: { amountMinor: 0n, currency: input.payment.gross.currency } };
  if (input.isTestPayment) return { qualified: false, reason: 'TEST_PAYMENT', qcb: { amountMinor: 0n, currency: input.payment.gross.currency } };
  if (input.fraudStatus && input.fraudStatus !== 'OK') return { qualified: false, reason: 'FRAUD_REVIEW', qcb: { amountMinor: 0n, currency: input.payment.gross.currency } };
  if (input.attribution.status === 'REJECTED') return { qualified: false, reason: 'REJECTED_ATTRIBUTION', qcb: { amountMinor: 0n, currency: input.payment.gross.currency } };
  if (isSelfReferral(input.attribution) || !resolveReferralChain(input.attribution).length) return { qualified: false, reason: 'SELF_REFERRAL', qcb: { amountMinor: 0n, currency: input.payment.gross.currency } };
  const qcb = calculateQcb(input.payment, input.qcbPolicy);
  return qcb.amountMinor > 0n ? { qualified: true, reason: 'QUALIFIED', qcb } : { qualified: false, reason: 'ZERO_QCB', qcb };
}

export function createCommissionSnapshots(input: QualifiedPayment, hold: boolean): CommissionSnapshot[] {
  const qualification = qualifyPayment(input);
  if (!qualification.qualified) return [];
  const allocations: CommissionAllocation[] = [
    { partnerId: input.attribution.directPartnerId, referralLevel: 'L1', rateBps: input.directPartnerRank.rateBps }
  ];
  if (input.secondLevelPartnerRank && input.attribution.secondLevelPartnerId && input.attribution.secondLevelPartnerId !== input.attribution.directPartnerId) {
    allocations.push({ partnerId: input.attribution.secondLevelPartnerId, referralLevel: 'L2', rateBps: input.secondLevelPartnerRank.rateBps });
  }
  const calculation = calculateCommissions(qualification.qcb, allocations);
  if (!calculation.cap.passed) return [];
  return calculation.commissions.filter((commission) => commission.roundedCommissionMinor > 0n).map((commission, index) => ({
    id: `${input.id}-commission-${index + 1}`,
    paymentId: input.id,
    partnerId: commission.partnerId,
    referralLevel: commission.referralLevel,
    qcb: qualification.qcb,
    qcbPolicyVersion: input.qcbPolicy.version,
    achievedRank: commission.referralLevel === 'L1' ? input.directPartnerRank.rank : (input.secondLevelPartnerRank?.rank ?? input.directPartnerRank.rank),
    effectiveRank: commission.referralLevel === 'L1' ? input.directPartnerRank.rank : (input.secondLevelPartnerRank?.rank ?? input.directPartnerRank.rank),
    rateBps: commission.rateBps,
    rawCommission: { amountMinor: commission.rawCommissionMinor, currency: qualification.qcb.currency },
    roundedCommission: { amountMinor: commission.roundedCommissionMinor, currency: qualification.qcb.currency },
    roundingPolicy: 'HALF_UP',
    capResult: calculation.cap,
    ruleVersion: input.ruleVersion,
    state: hold ? 'HELD' : 'AVAILABLE',
    createdAt: input.createdAt
  }));
}

export type WalletBucket = 'PENDING' | 'HELD' | 'AVAILABLE' | 'LOCKED_FOR_PAYOUT' | 'PAID' | 'REVERSED' | 'DEBT';
export type LedgerAccount = 'PLATFORM_REVENUE' | 'PARTNER_PENDING' | 'PARTNER_HELD' | 'PARTNER_AVAILABLE' | 'PARTNER_LOCKED' | 'PARTNER_PAID' | 'PARTNER_REVERSED' | 'PARTNER_DEBT' | 'PAYOUT_PROVIDER';

export interface LedgerLine {
  account: LedgerAccount;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: bigint;
  currency: Currency;
  partnerId?: string;
}

export interface LedgerTransaction {
  id: string;
  source: string;
  idempotencyKey: string;
  ruleVersion?: string;
  createdAt: string;
  lines: LedgerLine[];
}

export interface BucketMove {
  id: string;
  partnerId: string;
  from: WalletBucket;
  to: WalletBucket;
  amountMinor: bigint;
  currency: Currency;
  source: string;
  idempotencyKey: string;
  createdAt: string;
}

const bucketAccount: Record<WalletBucket, LedgerAccount> = {
  PENDING: 'PARTNER_PENDING',
  HELD: 'PARTNER_HELD',
  AVAILABLE: 'PARTNER_AVAILABLE',
  LOCKED_FOR_PAYOUT: 'PARTNER_LOCKED',
  PAID: 'PARTNER_PAID',
  REVERSED: 'PARTNER_REVERSED',
  DEBT: 'PARTNER_DEBT'
};

const bucketProjection: Record<WalletBucket, keyof WalletProjection> = {
  PENDING: 'pending',
  HELD: 'held',
  AVAILABLE: 'available',
  LOCKED_FOR_PAYOUT: 'lockedForPayout',
  PAID: 'paid',
  REVERSED: 'reversed',
  DEBT: 'debt'
};

export interface WalletProjection {
  pending: bigint;
  held: bigint;
  available: bigint;
  lockedForPayout: bigint;
  paid: bigint;
  reversed: bigint;
  debt: bigint;
}

function sameLedgerTransaction(left: LedgerTransaction, right: LedgerTransaction): boolean {
  return left.id === right.id
    && left.source === right.source
    && left.idempotencyKey === right.idempotencyKey
    && left.ruleVersion === right.ruleVersion
    && left.createdAt === right.createdAt
    && left.lines.length === right.lines.length
    && left.lines.every((line, index) => {
      const candidate = right.lines[index];
      return line.account === candidate.account
        && line.direction === candidate.direction
        && line.amountMinor === candidate.amountMinor
        && line.currency === candidate.currency
        && line.partnerId === candidate.partnerId;
    });
}

function validateLedgerTransaction(transaction: LedgerTransaction): void {
  if (!transaction.id || !transaction.source || !transaction.idempotencyKey || !transaction.createdAt) throw new Error('INVALID_LEDGER_TRANSACTION');
  if (!transaction.lines.length || transaction.lines.some((line) => line.amountMinor <= 0n)) throw new Error('INVALID_LEDGER_LINES');
  if (new Set(transaction.lines.map((line) => line.currency)).size !== 1) throw new Error('MULTI_CURRENCY_TRANSACTION');
  const debit = transaction.lines.filter((line) => line.direction === 'DEBIT').reduce((sum, line) => sum + line.amountMinor, 0n);
  const credit = transaction.lines.filter((line) => line.direction === 'CREDIT').reduce((sum, line) => sum + line.amountMinor, 0n);
  if (debit !== credit) throw new Error('LEDGER_NOT_BALANCED');
}

export class ImmutableLedger {
  private readonly transactions: LedgerTransaction[] = [];
  private readonly idempotency = new Map<string, LedgerTransaction>();
  private readonly transactionIds = new Map<string, LedgerTransaction>();

  get all(): readonly LedgerTransaction[] { return this.transactions; }

  append(transaction: LedgerTransaction): LedgerTransaction {
    return this.appendBatch([transaction])[0];
  }

  /**
   * Validate the complete batch before mutating any ledger collection. This
   * is the transaction boundary used by payment, reversal and payout flows.
   * A failed line or idempotency conflict therefore cannot leave half a
   * commission set or half a wallet move persisted.
   */
  appendBatch(transactions: readonly LedgerTransaction[]): LedgerTransaction[] {
    if (!transactions.length) throw new Error('EMPTY_LEDGER_BATCH');
    const pendingByKey = new Map<string, LedgerTransaction>();
    const pendingById = new Map<string, LedgerTransaction>();
    const toAppend: LedgerTransaction[] = [];
    const result: LedgerTransaction[] = [];

    for (const transaction of transactions) {
      const existing = this.idempotency.get(transaction.idempotencyKey) ?? pendingByKey.get(transaction.idempotencyKey);
      if (existing) {
        if (!sameLedgerTransaction(existing, transaction)) throw new Error('IDEMPOTENCY_CONFLICT');
        result.push(existing);
        continue;
      }

      const existingId = this.transactionIds.get(transaction.id) ?? pendingById.get(transaction.id);
      if (existingId && !sameLedgerTransaction(existingId, transaction)) throw new Error('TRANSACTION_ID_CONFLICT');
      validateLedgerTransaction(transaction);
      pendingByKey.set(transaction.idempotencyKey, transaction);
      pendingById.set(transaction.id, transaction);
      toAppend.push(transaction);
      result.push(transaction);
    }

    for (const transaction of toAppend) {
      this.transactions.push(transaction);
      this.idempotency.set(transaction.idempotencyKey, transaction);
      this.transactionIds.set(transaction.id, transaction);
    }
    return result;
  }

  private buildCommissionTransaction(args: { id: string; partnerId: string; amountMinor: bigint; currency: Currency; hold: boolean; source: string; idempotencyKey: string; createdAt: string; ruleVersion: string }): LedgerTransaction {
    const bucket: WalletBucket = args.hold ? 'HELD' : 'AVAILABLE';
    return {
      id: args.id,
      source: args.source,
      idempotencyKey: args.idempotencyKey,
      ruleVersion: args.ruleVersion,
      createdAt: args.createdAt,
      lines: [
        { account: 'PLATFORM_REVENUE', direction: 'DEBIT', amountMinor: args.amountMinor, currency: args.currency },
        { account: bucketAccount[bucket], direction: 'CREDIT', amountMinor: args.amountMinor, currency: args.currency, partnerId: args.partnerId }
      ]
    };
  }

  commissionTransaction(args: { id: string; partnerId: string; amountMinor: bigint; currency: Currency; hold: boolean; source: string; idempotencyKey: string; createdAt: string; ruleVersion: string }): LedgerTransaction {
    return this.buildCommissionTransaction(args);
  }

  commission(args: { id: string; partnerId: string; amountMinor: bigint; currency: Currency; hold: boolean; source: string; idempotencyKey: string; createdAt: string; ruleVersion: string }): LedgerTransaction {
    return this.append(this.buildCommissionTransaction(args));
  }

  private buildBucketMoveTransaction(args: BucketMove): LedgerTransaction {
    return {
      id: args.id,
      source: args.source,
      idempotencyKey: args.idempotencyKey,
      createdAt: args.createdAt,
      lines: [
        { account: bucketAccount[args.from], direction: 'DEBIT', amountMinor: args.amountMinor, currency: args.currency, partnerId: args.partnerId },
        { account: bucketAccount[args.to], direction: 'CREDIT', amountMinor: args.amountMinor, currency: args.currency, partnerId: args.partnerId }
      ]
    };
  }

  moveBuckets(args: readonly BucketMove[]): LedgerTransaction[] {
    if (!args.length) throw new Error('EMPTY_LEDGER_BATCH');
    const working = new Map<string, bigint>();
    const appliedKeys = new Set<string>();
    const transactions = args.map((move) => {
      if (move.amountMinor <= 0n) throw new Error('INVALID_LEDGER_LINES');
      const transaction = this.buildBucketMoveTransaction(move);
      if (this.idempotency.has(move.idempotencyKey) || appliedKeys.has(move.idempotencyKey)) return transaction;
      appliedKeys.add(move.idempotencyKey);
      const fromKey = `${move.partnerId}:${move.currency}:${move.from}`;
      const toKey = `${move.partnerId}:${move.currency}:${move.to}`;
      const fromBalance = working.get(fromKey) ?? this.project(move.partnerId, move.currency)[bucketProjection[move.from]];
      if (fromBalance < move.amountMinor) throw new Error('INSUFFICIENT_LEDGER_BUCKET');
      working.set(fromKey, fromBalance - move.amountMinor);
      working.set(toKey, (working.get(toKey) ?? this.project(move.partnerId, move.currency)[bucketProjection[move.to]]) + move.amountMinor);
      return transaction;
    });
    return this.appendBatch(transactions);
  }

  moveBucket(args: BucketMove): LedgerTransaction {
    return this.moveBuckets([args])[0];
  }

  project(partnerId: string, currency: Currency): WalletProjection {
    const totals: WalletProjection = { pending: 0n, held: 0n, available: 0n, lockedForPayout: 0n, paid: 0n, reversed: 0n, debt: 0n };
    const accountToBucket = new Map<LedgerAccount, keyof WalletProjection>([
      ['PARTNER_PENDING', 'pending'], ['PARTNER_HELD', 'held'], ['PARTNER_AVAILABLE', 'available'], ['PARTNER_LOCKED', 'lockedForPayout'],
      ['PARTNER_PAID', 'paid'], ['PARTNER_REVERSED', 'reversed'], ['PARTNER_DEBT', 'debt']
    ]);
    for (const transaction of this.transactions) {
      for (const line of transaction.lines) {
        if (line.partnerId !== partnerId || line.currency !== currency) continue;
        const bucket = accountToBucket.get(line.account);
        if (!bucket) continue;
        totals[bucket] += line.direction === 'CREDIT' ? line.amountMinor : -line.amountMinor;
      }
    }
    return totals;
  }
}

export interface PartnerAccount {
  id: string;
  qualifiedActivePaidL1: number;
  rank: Rank;
  rankState: RankState;
}

export interface PaymentProcessingResult {
  paymentId: string;
  status: 'QUALIFIED' | 'NOT_QUALIFIED' | 'CAP_VALIDATION_FAILED' | 'DUPLICATE';
  reason: string;
  qcb: Money;
  commissions: CommissionSnapshot[];
}

/**
 * Small orchestration boundary for workers/API handlers. Persistence is
 * intentionally injected later; the class still demonstrates the automatic
 * happy path without allowing a handler to edit a balance directly.
 */
export class InMemoryPartnerPlatform {
  readonly ledger: ImmutableLedger;
  private readonly partners = new Map<string, PartnerAccount>();
  private readonly payments = new Map<string, PaymentProcessingResult>();
  private readonly commissions = new Map<string, CommissionSnapshot>();

  constructor(
    ledger = new ImmutableLedger(),
    private readonly qcbPolicy: QcbPolicy = { version: 'web-v1', includeStoreCosts: true, includeProcessingCosts: true, includeTaxes: true },
    private readonly hold = true
  ) {
    this.ledger = ledger;
  }

  addPartner(account: PartnerAccount): void {
    if (this.partners.has(account.id)) throw new Error('PARTNER_ALREADY_EXISTS');
    this.partners.set(account.id, { ...account });
  }

  getPartner(id: string): PartnerAccount | undefined { return this.partners.get(id); }

  getCommission(id: string): CommissionSnapshot | undefined { return this.commissions.get(id); }

  releaseHold(commissionId: string, releasedAt: string): CommissionSnapshot {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.state !== 'HELD') throw new Error('COMMISSION_NOT_HELD');
    this.ledger.moveBucket({ id: `${commissionId}-vest`, partnerId: commission.partnerId, from: 'HELD', to: 'AVAILABLE', amountMinor: commission.roundedCommission.amountMinor, currency: commission.roundedCommission.currency, source: 'HOLD_EXPIRED', idempotencyKey: `hold-release:${commissionId}`, createdAt: releasedAt });
    commission.state = 'AVAILABLE';
    return commission;
  }

  reversePayment(paymentId: string, kind: 'REFUND' | 'CHARGEBACK', reversedAt: string): CommissionSnapshot[] {
    const result = this.payments.get(paymentId);
    if (!result) throw new Error('PAYMENT_NOT_FOUND');
    const moves: BucketMove[] = [];
    const reversible: Array<{ commission: CommissionSnapshot; from: WalletBucket }> = [];
    for (const commission of result.commissions) {
      const from: WalletBucket | null = commission.state === 'HELD' ? 'HELD' : commission.state === 'AVAILABLE' ? 'AVAILABLE' : commission.state === 'PAID' ? 'PAID' : null;
      if (!from) continue;
      const to: WalletBucket = from === 'PAID' ? 'DEBT' : 'REVERSED';
      moves.push({ id: `${commission.id}-${kind.toLowerCase()}`, partnerId: commission.partnerId, from, to, amountMinor: commission.roundedCommission.amountMinor, currency: commission.roundedCommission.currency, source: kind, idempotencyKey: `${kind}:${commission.id}`, createdAt: reversedAt });
      reversible.push({ commission, from });
    }
    if (!moves.length) return [];
    this.ledger.moveBuckets(moves);
    return reversible.map(({ commission, from }) => {
      commission.state = from === 'PAID' ? 'ADJUSTED' : 'REVERSED';
      return commission;
    });
  }

  processPaidPayment(input: {
    id: string;
    userId: string;
    payment: QualifiedPaymentInput;
    attribution: Attribution;
    createdAt: string;
    ruleVersion: string;
    isTestPayment?: boolean;
    fraudStatus?: 'OK' | 'REVIEW' | 'BLOCKED';
  }): PaymentProcessingResult {
    const previous = this.payments.get(input.id);
    if (previous) return { ...previous, status: 'DUPLICATE' };
    if (input.userId !== input.attribution.userId) return this.storeResult({ paymentId: input.id, status: 'NOT_QUALIFIED', reason: 'ATTRIBUTION_USER_MISMATCH', qcb: { amountMinor: 0n, currency: input.payment.gross.currency }, commissions: [] });
    if (input.attribution.status === 'REJECTED') return this.storeResult({ paymentId: input.id, status: 'NOT_QUALIFIED', reason: 'REJECTED_ATTRIBUTION', qcb: { amountMinor: 0n, currency: input.payment.gross.currency }, commissions: [] });
    if (isSelfReferral(input.attribution)) return this.storeResult({ paymentId: input.id, status: 'NOT_QUALIFIED', reason: 'SELF_REFERRAL', qcb: { amountMinor: 0n, currency: input.payment.gross.currency }, commissions: [] });
    const qcb = calculateQcb(input.payment, this.qcbPolicy);
    if (input.isTestPayment || (input.fraudStatus && input.fraudStatus !== 'OK') || qcb.amountMinor === 0n) {
      return this.storeResult({ paymentId: input.id, status: 'NOT_QUALIFIED', reason: input.isTestPayment ? 'TEST_PAYMENT' : input.fraudStatus && input.fraudStatus !== 'OK' ? 'FRAUD_REVIEW' : 'ZERO_QCB', qcb, commissions: [] });
    }

    const direct = this.partners.get(input.attribution.directPartnerId);
    if (!direct) throw new Error('DIRECT_PARTNER_NOT_FOUND');
    const second = input.attribution.secondLevelPartnerId ? this.partners.get(input.attribution.secondLevelPartnerId) : undefined;
    direct.qualifiedActivePaidL1 += 1;
    const directRule = resolveRank(direct.qualifiedActivePaidL1) ?? DEFAULT_RANK_RULES[0];
    direct.rank = directRule.rank;
    direct.rankState = 'ACTIVE';
    const secondRule = second ? (resolveRank(second.qualifiedActivePaidL1) ?? DEFAULT_RANK_RULES[0]) : undefined;
    const snapshots = createCommissionSnapshots({
      id: input.id,
      userId: input.userId,
      attribution: { ...input.attribution, status: 'LOCKED', qualifiedAt: input.createdAt },
      payment: input.payment,
      qcbPolicy: this.qcbPolicy,
      directPartnerRank: directRule,
      secondLevelPartnerRank: secondRule,
      ruleVersion: input.ruleVersion,
      createdAt: input.createdAt,
      isTestPayment: input.isTestPayment,
      fraudStatus: input.fraudStatus
    }, this.hold);
    if (!snapshots.length) {
      direct.qualifiedActivePaidL1 -= 1;
      return this.storeResult({ paymentId: input.id, status: 'CAP_VALIDATION_FAILED', reason: 'CAP_VALIDATION_FAILED', qcb, commissions: [] });
    }
    const ledgerTransactions = snapshots.map((snapshot) => this.ledger.commissionTransaction({
        id: snapshot.id,
        partnerId: snapshot.partnerId,
        amountMinor: snapshot.roundedCommission.amountMinor,
        currency: snapshot.roundedCommission.currency,
        hold: snapshot.state === 'HELD',
        source: snapshot.paymentId,
        idempotencyKey: `commission:${snapshot.id}`,
        createdAt: snapshot.createdAt,
        ruleVersion: snapshot.ruleVersion
      }));
    try {
      this.ledger.appendBatch(ledgerTransactions);
    } catch (error) {
      direct.qualifiedActivePaidL1 -= 1;
      throw error;
    }
    for (const snapshot of snapshots) {
      this.commissions.set(snapshot.id, snapshot);
    }
    return this.storeResult({ paymentId: input.id, status: 'QUALIFIED', reason: 'PAYMENT_QUALIFIED', qcb, commissions: snapshots });
  }

  private storeResult(result: PaymentProcessingResult): PaymentProcessingResult {
    this.payments.set(result.paymentId, result);
    return result;
  }
}

export class IdempotencyStore {
  private readonly values = new Map<string, unknown>();

  get<T>(key: string): T | undefined { return this.values.get(key) as T | undefined; }

  set<T>(key: string, value: T): T {
    const existing = this.get<T>(key);
    if (existing !== undefined) return existing;
    this.values.set(key, value);
    return value;
  }
}

export class WebhookInbox {
  private readonly eventIds = new Set<string>();

  accept(provider: string, eventId: string): boolean {
    const key = `${provider}:${eventId}`;
    if (this.eventIds.has(key)) return false;
    this.eventIds.add(key);
    return true;
  }
}

export interface FxSnapshot {
  baseCurrency: Currency;
  payoutCurrency: Currency;
  rateNumerator: bigint;
  rateDenominator: bigint;
  provider: string;
  quotedAt: string;
  expiresAt: string;
  version: string;
}

function assertUsableFxSnapshot(fx: FxSnapshot, at = new Date().toISOString()): void {
  const now = new Date(at).getTime();
  const quotedAt = new Date(fx.quotedAt).getTime();
  const expiresAt = new Date(fx.expiresAt).getTime();
  if (!Number.isFinite(now) || !Number.isFinite(quotedAt) || !Number.isFinite(expiresAt) || expiresAt <= quotedAt) throw new Error('INVALID_FX_SNAPSHOT');
  if (now >= expiresAt) throw new Error('FX_SNAPSHOT_EXPIRED');
}

export function convertWithFx(amount: Money, payoutCurrency: Currency, fx: FxSnapshot, at?: string): Money {
  assertMoney(amount);
  if (amount.currency !== fx.baseCurrency || payoutCurrency !== fx.payoutCurrency || fx.rateNumerator <= 0n || fx.rateDenominator <= 0n) throw new Error('INVALID_FX_SNAPSHOT');
  assertUsableFxSnapshot(fx, at);
  return { currency: payoutCurrency, amountMinor: (amount.amountMinor * fx.rateNumerator + fx.rateDenominator / 2n) / fx.rateDenominator };
}

export interface PayoutPolicy {
  minimumBase: Money;
  requestedGrossMinimum: boolean;
}

export interface PayoutEligibilityInput {
  requested: Money;
  available: Money;
  fx: FxSnapshot;
  policy: PayoutPolicy;
  kyc: 'VERIFIED' | 'PENDING' | 'FAILED';
  compliance: 'OK' | 'REVIEW' | 'BLOCKED';
  fraud: 'OK' | 'REVIEW' | 'BLOCKED';
  payoutMethod: 'VERIFIED' | 'MISSING' | 'FAILED';
  asOf?: string;
}

export interface PayoutCheck {
  allowed: boolean;
  code: string;
  minimumPayout: Money | null;
}

export function checkPayoutEligibility(input: PayoutEligibilityInput): PayoutCheck {
  assertMoney(input.requested);
  assertMoney(input.available);
  assertMoney(input.policy.minimumBase);
  let minimumPayout: Money;
  try {
    minimumPayout = convertWithFx(input.policy.minimumBase, input.requested.currency, input.fx, input.asOf);
  } catch (error) {
    if (error instanceof Error && error.message === 'FX_SNAPSHOT_EXPIRED') return { allowed: false, code: 'FX_SNAPSHOT_EXPIRED', minimumPayout: null };
    throw error;
  }
  if (input.requested.currency !== input.available.currency || input.requested.amountMinor > input.available.amountMinor) return { allowed: false, code: 'INSUFFICIENT_AVAILABLE_BALANCE', minimumPayout };
  if (input.requested.amountMinor < minimumPayout.amountMinor) return { allowed: false, code: 'BELOW_MINIMUM_PAYOUT', minimumPayout };
  if (input.kyc !== 'VERIFIED') return { allowed: false, code: 'KYC_REQUIRED', minimumPayout };
  if (input.compliance !== 'OK') return { allowed: false, code: 'COMPLIANCE_REVIEW', minimumPayout };
  if (input.fraud !== 'OK') return { allowed: false, code: 'FRAUD_REVIEW', minimumPayout };
  if (input.payoutMethod !== 'VERIFIED') return { allowed: false, code: 'PAYOUT_METHOD_REQUIRED', minimumPayout };
  return { allowed: true, code: 'PAYOUT_ALLOWED', minimumPayout };
}

export interface PayoutProvider {
  readonly connected: boolean;
  createRecipient(input: { partnerId: string; destination: string }): Promise<{ providerRecipientId: string; status: 'PENDING' | 'VERIFIED' }>;
  verifyRecipient(input: { providerRecipientId: string }): Promise<{ status: 'VERIFIED' | 'FAILED' }>;
  calculateFee(requested: Money): Promise<Money>;
  createPayout(input: { idempotencyKey: string; requested: Money; destination: string }): Promise<{ providerPayoutId: string; status: 'PROCESSING' | 'PAID' }>;
  getPayout(providerPayoutId: string): Promise<{ status: 'PROCESSING' | 'PAID' | 'FAILED' }>;
  cancelPayout(providerPayoutId: string): Promise<{ status: 'CANCELED' | 'FAILED' }>;
  handleWebhook(input: { eventId: string; payload: unknown; signature: string }): Promise<{ accepted: boolean; eventType?: string }>;
  reconcile(since: string): Promise<{ checked: number; mismatches: number }>;
}

export class NotConnectedPayoutProvider implements PayoutProvider {
  readonly connected = false;
  async createRecipient(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async verifyRecipient(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async calculateFee(_requested: Money): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async createPayout(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async getPayout(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async cancelPayout(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async handleWebhook(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
  async reconcile(): Promise<never> { throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED'); }
}

export interface AutoPayoutPolicy {
  enabled: boolean;
  threshold: Money;
  cadence: 'MONTHLY' | 'THRESHOLD';
}

export function shouldRunAutoPayout(policy: AutoPayoutPolicy, available: Money, checks: Pick<PayoutEligibilityInput, 'kyc' | 'compliance' | 'fraud' | 'payoutMethod'>): boolean {
  return policy.enabled && available.currency === policy.threshold.currency && available.amountMinor >= policy.threshold.amountMinor &&
    checks.kyc === 'VERIFIED' && checks.compliance === 'OK' && checks.fraud === 'OK' && checks.payoutMethod === 'VERIFIED';
}

export interface NotificationJob {
  id: string;
  type: string;
  recipientId: string;
  scheduledFor: string;
  idempotencyKey: string;
  status: 'SCHEDULED' | 'SENT' | 'SKIPPED' | 'FAILED';
}

export function trialReminderSchedule(trial: Trial, notificationDays: readonly number[] = [7, 3, 1]): NotificationJob[] {
  return notificationDays.map((days) => ({
    id: `${trial.userId}-trial-${days}`,
    type: `TRIAL_T_MINUS_${days}`,
    recipientId: trial.userId,
    scheduledFor: addCalendarDays(trial.endsAt, -days),
    idempotencyKey: `${trial.userId}:trial:${days}:${trial.endsAt}`,
    status: 'SCHEDULED'
  }));
}

export type LeaderboardMetric = 'WEEKLY' | 'MONTHLY' | 'GROWTH' | 'QUALIFIED_L1' | 'REVENUE' | 'ALL_TIME' | 'REGIONAL';

export interface LeaderboardEntry {
  partnerId: string;
  score: bigint;
  publicProfileOptIn: boolean;
  region?: string;
}

export function topLeaderboard(entries: readonly LeaderboardEntry[], metric: LeaderboardMetric, limit = 100, region?: string): LeaderboardEntry[] {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('INVALID_LEADERBOARD_LIMIT');
  return entries
    .filter((entry) => entry.publicProfileOptIn && (metric !== 'REGIONAL' || entry.region === region))
    .slice()
    .sort((a, b) => b.score > a.score ? 1 : b.score < a.score ? -1 : a.partnerId.localeCompare(b.partnerId))
    .slice(0, limit);
}

export type RuleLifecycle = 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'SCHEDULED' | 'ACTIVE';

export interface VersionedRule<T> {
  version: string;
  state: RuleLifecycle;
  value: T;
  createdBy: string;
  approvedBy?: string;
  effectiveFrom?: string;
  reason: string;
}

export function canActivateRule<T>(rule: VersionedRule<T>): boolean {
  return rule.state === 'SCHEDULED' && Boolean(rule.approvedBy) && Boolean(rule.effectiveFrom);
}

export interface FraudAssessment {
  score: number;
  status: 'OK' | 'REVIEW' | 'BLOCKED';
  signals: string[];
}

export function assessFraud(signals: Array<{ name: string; weight: number; present: boolean }>): FraudAssessment {
  if (signals.some((signal) => !signal.name || !Number.isFinite(signal.weight) || signal.weight < 0)) throw new Error('INVALID_FRAUD_SIGNAL');
  const score = Math.min(100, Math.max(0, signals.filter((signal) => signal.present).reduce((sum, signal) => sum + signal.weight, 0)));
  return { score, status: score >= 80 ? 'BLOCKED' : score >= 50 ? 'REVIEW' : 'OK', signals: signals.filter((signal) => signal.present).map((signal) => signal.name) };
}

export type AchievementThreshold = 1 | 5 | 10 | 20 | 30 | 50 | 75 | 100 | 150 | 200 | 500 | 750 | 1000 | 2500;

export function newlyUnlockedAchievements(previous: number, current: number): AchievementThreshold[] {
  const thresholds: AchievementThreshold[] = [1, 5, 10, 20, 30, 50, 75, 100, 150, 200, 500, 750, 1000, 2500];
  return thresholds.filter((threshold) => previous < threshold && current >= threshold);
}

export type AmbassadorTier = 'NONE' | 'CANDIDATE' | 'PRO' | 'ELITE' | 'LEGEND';

export function ambassadorTierForQualifiedL1(count: number, approved: boolean): AmbassadorTier {
  if (count >= 2500 && approved) return 'LEGEND';
  if (count >= 1000 && approved) return 'ELITE';
  if (count >= 750 && approved) return 'PRO';
  if (count >= 500 && approved) return 'CANDIDATE';
  if (count >= 500) return 'CANDIDATE';
  return 'NONE';
}

export function assertProductionFinancialSafety(config: { nodeEnv?: string; providerConnected: boolean; dataMode?: string }): void {
  if (config.nodeEnv === 'production' && !config.providerConnected) throw new Error('PAYOUT_PROVIDER_NOT_CONNECTED');
  if (config.dataMode === 'DEMO_DATA' && config.nodeEnv === 'production') throw new Error('DEMO_FINANCIAL_DATA_FORBIDDEN_IN_PRODUCTION');
}
