// Financial Types & ViewModels for SIREN UA DEV20
import { DataState } from './dataEnvelope';

export type Money = number;

export type FinancialDataStatus = DataState;

export type PayoutLifecycleStatus = 
  | 'REQUESTED' 
  | 'VALIDATING' 
  | 'KYC_CHECK' 
  | 'RISK_CHECK' 
  | 'LOCKED_FOR_PAYOUT' 
  | 'PROCESSING' 
  | 'PAID' 
  | 'REJECTED' 
  | 'FAILED';

export interface PayoutTransaction {
  id: string;
  amount: Money;
  fee: Money;
  netAmount: Money;
  currency: 'UAH' | 'USDT';
  method: 'MONOBANK' | 'PRIVATBANK' | 'IBAN' | 'USDT_TRC20';
  targetAccount: string;
  targetAccountMasked: string;
  requestedAt: string;
  completedAt?: string;
  status: PayoutLifecycleStatus;
  statusStepIndex: number;
  auditTrail: {
    step: string;
    timestamp: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';
  }[];
}

export interface LedgerTransaction {
  id: string;
  type: 'COMMISSION_L1' | 'COMMISSION_L2' | 'PAYOUT_WITHDRAWAL' | 'BONUS_LEADER' | 'ADJUSTMENT';
  description: string;
  amount: Money;
  direction: 'CREDIT' | 'DEBIT';
  timestamp: string;
  partnerName?: string;
  partnerLevel?: 'L1' | 'L2';
  referenceId?: string;
  balanceAfter: Money;
}

export interface PayoutMethodConfig {
  id: string;
  type: 'MONOBANK' | 'PRIVATBANK' | 'IBAN' | 'USDT_TRC20';
  title: string;
  account: string;
  accountMasked: string;
  feePercent: number;
  fixedFeeUah: number;
  isDefault: boolean;
  minAmountUah: number;
}

export interface PartnerFinancialSummary {
  totalBalance: Money;
  availableBalance: Money;
  pendingBalance: Money;
  heldBalance: Money;
  earnedThisMonth: Money;
  earnedLastMonth: Money;
  lifetimeEarnings: Money;
  lifetimePaid: Money;
  minimumPayout: Money;
  minimumPayoutBaseCurrency?: string;
  minimumPayoutBaseAmount?: Money;
  minimumPayoutResolved?: boolean;
  payoutEligibilityStatus?: string;
  payoutProviderStatus?: string;
  amountUntilMinimum?: Money;
  l1Earnings?: Money;
  l2Earnings?: Money;
  sparkline?: number[];
  qualifiedL1?: number;
  updatedAt: string;
  status: FinancialDataStatus;
}

export interface FinancialCardViewModel {
  balance: {
    total: Money;
    available: Money;
    pending: Money;
    held: Money;
  };
  earnings: {
    thisMonth: Money;
    lastMonth: Money;
    lifetime: Money;
    l1?: Money;
    l2?: Money;
    sparklineData: number[];
    percentageChange: number;
  };
  payout: {
    available: Money;
    lifetimePaid: Money;
    minimum: Money;
    remainingUntilMinimum?: Money;
    eligible: boolean;
  };
  rank: {
    name: string;
    id: 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    l1Rate: number;
    l2Rate: number;
    qualifiedL1: number;
    nextThreshold?: number;
    nextRankName?: string;
    remainingToNext?: number;
    isL2Unlocked: boolean;
  };
  updatedAt: string;
  dataState: FinancialDataStatus;
}
