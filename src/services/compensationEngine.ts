import { REFERRAL_TIERS, ReferralRankId } from './referralEngine';

export type CompensationStatus = 'OK' | 'CAP_VALIDATION_FAILED';

export interface QcbInput {
  grossMinorUnits: number;
  refundsMinorUnits?: number;
  chargebacksMinorUnits?: number;
  nonCommissionableTaxesMinorUnits?: number;
  platformCostsMinorUnits?: number;
  processingCostsMinorUnits?: number;
  discountsMinorUnits?: number;
  promoCreditsMinorUnits?: number;
}

export interface QcbResult {
  grossMinorUnits: number;
  deductionsMinorUnits: number;
  qcbMinorUnits: number;
}

export interface CompensationInput {
  qcbMinorUnits: number;
  directRank: ReferralRankId;
  secondLevelRank?: ReferralRankId | null;
  promoAllocationBps?: number;
  capBps?: number;
}

export interface CompensationAllocation {
  level: 'L1' | 'L2' | 'PROMO';
  rateBps: number;
  rawMinorUnits: number;
  roundedMinorUnits: number;
}

export interface CompensationResult {
  status: CompensationStatus;
  qcbMinorUnits: number;
  capBps: number;
  capLimitMinorUnits: number;
  totalRateBps: number;
  totalAllocationMinorUnits: number;
  allocations: CompensationAllocation[];
}

const DEFAULT_CAP_BPS = 5000;

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
}

function roundHalfUp(numerator: number, denominator: number): number {
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

/**
 * Computes the qualified commission base from a verified payment snapshot.
 * All inputs and outputs are integer minor units; no binary floating point money.
 */
export function calculateQcb(input: QcbInput): QcbResult {
  const deductions = [
    input.refundsMinorUnits ?? 0,
    input.chargebacksMinorUnits ?? 0,
    input.nonCommissionableTaxesMinorUnits ?? 0,
    input.platformCostsMinorUnits ?? 0,
    input.processingCostsMinorUnits ?? 0,
    input.discountsMinorUnits ?? 0,
    input.promoCreditsMinorUnits ?? 0,
  ];

  assertNonNegativeInteger(input.grossMinorUnits, 'grossMinorUnits');
  deductions.forEach((value, index) => assertNonNegativeInteger(value, `deduction[${index}]`));

  const deductionsMinorUnits = deductions.reduce((total, value) => total + value, 0);
  return {
    grossMinorUnits: input.grossMinorUnits,
    deductionsMinorUnits,
    qcbMinorUnits: Math.max(0, input.grossMinorUnits - deductionsMinorUnits),
  };
}

/**
 * Calculates L1/L2 allocations against QCB and rejects a rule set that exceeds
 * the hard cap before any ledger entry could be created.
 */
export function calculateCompensation(input: CompensationInput): CompensationResult {
  const capBps = input.capBps ?? DEFAULT_CAP_BPS;
  const promoAllocationBps = input.promoAllocationBps ?? 0;
  assertNonNegativeInteger(input.qcbMinorUnits, 'qcbMinorUnits');
  assertNonNegativeInteger(capBps, 'capBps');
  assertNonNegativeInteger(promoAllocationBps, 'promoAllocationBps');

  const directRateBps = REFERRAL_TIERS[input.directRank].l1Percent * 100;
  const secondLevelRateBps = input.secondLevelRank
    ? REFERRAL_TIERS[input.secondLevelRank].l2Percent * 100
    : 0;
  const totalRateBps = directRateBps + secondLevelRateBps + promoAllocationBps;
  const capLimitMinorUnits = roundHalfUp(input.qcbMinorUnits * capBps, 10000);

  if (totalRateBps > capBps) {
    return {
      status: 'CAP_VALIDATION_FAILED',
      qcbMinorUnits: input.qcbMinorUnits,
      capBps,
      capLimitMinorUnits,
      totalRateBps,
      totalAllocationMinorUnits: 0,
      allocations: [],
    };
  }

  const rates: Array<{ level: CompensationAllocation['level']; rateBps: number }> = [
    { level: 'L1', rateBps: directRateBps },
    ...(secondLevelRateBps > 0 ? [{ level: 'L2' as const, rateBps: secondLevelRateBps }] : []),
    ...(promoAllocationBps > 0 ? [{ level: 'PROMO' as const, rateBps: promoAllocationBps }] : []),
  ];

  const allocations = rates.map(({ level, rateBps }) => ({
    level,
    rateBps,
    rawMinorUnits: (input.qcbMinorUnits * rateBps) / 10000,
    roundedMinorUnits: roundHalfUp(input.qcbMinorUnits * rateBps, 10000),
  }));
  const totalAllocationMinorUnits = allocations.reduce((total, allocation) => total + allocation.roundedMinorUnits, 0);

  if (totalAllocationMinorUnits > capLimitMinorUnits) {
    return {
      status: 'CAP_VALIDATION_FAILED',
      qcbMinorUnits: input.qcbMinorUnits,
      capBps,
      capLimitMinorUnits,
      totalRateBps,
      totalAllocationMinorUnits: 0,
      allocations: [],
    };
  }

  return {
    status: 'OK',
    qcbMinorUnits: input.qcbMinorUnits,
    capBps,
    capLimitMinorUnits,
    totalRateBps,
    totalAllocationMinorUnits,
    allocations,
  };
}
