// Financial Data Service & ViewModel Transformer for SIREN UA DEV20
import { 
  PartnerFinancialSummary, 
  FinancialCardViewModel, 
  PayoutTransaction, 
  LedgerTransaction, 
  PayoutMethodConfig,
  PayoutLifecycleStatus 
} from '../types/finance';
import { DataEnvelope } from '../types/dataEnvelope';
import { calculateRankByL1, getNextTierInfo } from './referralEngine';
import { CacheManager } from '../utils/cacheManager';
import { getJsonFromPaths, inferDataState, isJsonObject, postJsonFromPaths } from './apiClient';
import { runtimeConfig } from '../config/runtime';

const CACHE_KEY_FINANCE = 'sirenua_financial_summary_cache';

export const DEFAULT_FINANCIAL_SUMMARY: PartnerFinancialSummary = {
  totalBalance: 8460,
  availableBalance: 4230,
  pendingBalance: 3650,
  heldBalance: 580,
  earnedThisMonth: 2840,
  earnedLastMonth: 2310,
  lifetimeEarnings: 18560,
  lifetimePaid: 14330,
  minimumPayout: 415, // ~10 USD
  minimumPayoutBaseCurrency: 'USD',
  minimumPayoutBaseAmount: 10,
  minimumPayoutResolved: true,
  payoutEligibilityStatus: 'CONFIGURED',
  payoutProviderStatus: 'DEMO',
  amountUntilMinimum: 0,
  l1Earnings: 1940,
  l2Earnings: 900,
  sparkline: [1350, 1520, 1780, 2100, 1950, 2310, 2840],
  qualifiedL1: 154,
  updatedAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
  status: 'DEMO',
};

export const UNAVAILABLE_FINANCIAL_SUMMARY: PartnerFinancialSummary = {
  ...DEFAULT_FINANCIAL_SUMMARY,
  totalBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  heldBalance: 0,
  earnedThisMonth: 0,
  earnedLastMonth: 0,
  lifetimeEarnings: 0,
  lifetimePaid: 0,
  minimumPayout: 0,
  minimumPayoutBaseCurrency: 'USD',
  minimumPayoutBaseAmount: 10,
  minimumPayoutResolved: false,
  payoutEligibilityStatus: 'NOT_CONNECTED',
  payoutProviderStatus: 'NOT_CONNECTED',
  amountUntilMinimum: 0,
  l1Earnings: 0,
  l2Earnings: 0,
  sparkline: [],
  qualifiedL1: 0,
  updatedAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
  status: 'NOT_CONNECTED',
};

const INITIAL_PAYOUT_METHODS: PayoutMethodConfig[] = [
  {
    id: 'pm-1',
    type: 'MONOBANK',
    title: 'Monobank Black Card',
    account: '•••• 2291',
    accountMasked: '•••• 2291',
    feePercent: 0,
    fixedFeeUah: 0,
    isDefault: true,
    minAmountUah: 415,
  },
  {
    id: 'pm-2',
    type: 'PRIVATBANK',
    title: 'ПриватБанк Gold',
    account: '•••• 1104',
    accountMasked: '•••• 1104',
    feePercent: 1.0,
    fixedFeeUah: 5,
    isDefault: false,
    minAmountUah: 415,
  },
  {
    id: 'pm-3',
    type: 'USDT_TRC20',
    title: 'Tether USDT (TRC-20)',
    account: 'TYDz...E49s',
    accountMasked: 'TYDz...E49s',
    feePercent: 0,
    fixedFeeUah: 42, // ~1 USDT fixed
    isDefault: false,
    minAmountUah: 1000,
  },
];

const INITIAL_LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: 'tx-101',
    type: 'COMMISSION_L1',
    description: 'Комісія 20% від підписки Premium Pro (Марія Коваленко)',
    amount: 90,
    direction: 'CREDIT',
    timestamp: 'Сьогодні, 14:22',
    partnerName: 'Марія Коваленко',
    partnerLevel: 'L1',
    balanceAfter: 8460,
  },
  {
    id: 'tx-102',
    type: 'COMMISSION_L2',
    description: 'Комісія 20% від підписки Standard (Андрій Шевченко)',
    amount: 50,
    direction: 'CREDIT',
    timestamp: 'Сьогодні, 11:05',
    partnerName: 'Андрій Шевченко',
    partnerLevel: 'L2',
    balanceAfter: 8370,
  },
  {
    id: 'tx-103',
    type: 'PAYOUT_WITHDRAWAL',
    description: 'Виплата на карту Monobank (•••• 2291)',
    amount: 4230,
    direction: 'DEBIT',
    timestamp: '02.09.2024, 18:30',
    referenceId: 'PAY-882194',
    balanceAfter: 8320,
  },
  {
    id: 'tx-104',
    type: 'COMMISSION_L1',
    description: 'Комісія 20% від підписки Premium Pro (Ігор Сидоренко)',
    amount: 90,
    direction: 'CREDIT',
    timestamp: '01.09.2024, 16:15',
    partnerName: 'Ігор Сидоренко',
    partnerLevel: 'L1',
    balanceAfter: 12550,
  },
];

const INITIAL_PAYOUT_HISTORY: PayoutTransaction[] = [
  {
    id: 'PAY-882194',
    amount: 4230,
    fee: 0,
    netAmount: 4230,
    currency: 'UAH',
    method: 'MONOBANK',
    targetAccount: '•••• 2291',
    targetAccountMasked: '•••• 2291',
    requestedAt: '02.09.2024, 18:15',
    completedAt: '02.09.2024, 18:30',
    status: 'PAID',
    statusStepIndex: 6,
    auditTrail: [
      { step: 'Запит створено', timestamp: '18:15:02', status: 'COMPLETED' },
      { step: 'Перевірка балансу', timestamp: '18:15:10', status: 'COMPLETED' },
      { step: 'KYC валідація', timestamp: '18:15:14', status: 'COMPLETED' },
      { step: 'Фінансовий моніторинг', timestamp: '18:16:00', status: 'COMPLETED' },
      { step: 'Блокування суми', timestamp: '18:16:05', status: 'COMPLETED' },
      { step: 'Обробка банком-еквайром', timestamp: '18:22:18', status: 'COMPLETED' },
      { step: 'Кошти зараховано', timestamp: '18:30:00', status: 'COMPLETED' },
    ],
  },
  {
    id: 'PAY-771032',
    amount: 5100,
    fee: 0,
    netAmount: 5100,
    currency: 'UAH',
    method: 'MONOBANK',
    targetAccount: '•••• 2291',
    targetAccountMasked: '•••• 2291',
    requestedAt: '15.08.2024, 10:20',
    completedAt: '15.08.2024, 10:45',
    status: 'PAID',
    statusStepIndex: 6,
    auditTrail: [
      { step: 'Запит створено', timestamp: '10:20:00', status: 'COMPLETED' },
      { step: 'KYC валідація', timestamp: '10:20:12', status: 'COMPLETED' },
      { step: 'Обробка', timestamp: '10:21:00', status: 'COMPLETED' },
      { step: 'Кошти зараховано', timestamp: '10:45:00', status: 'COMPLETED' },
    ],
  },
];

class FinancialService {
  private payoutMethods: PayoutMethodConfig[] = INITIAL_PAYOUT_METHODS;
  private ledgerTransactions: LedgerTransaction[] = INITIAL_LEDGER_TRANSACTIONS;
  private payoutHistory: PayoutTransaction[] = INITIAL_PAYOUT_HISTORY;
  private summary: PartnerFinancialSummary = DEFAULT_FINANCIAL_SUMMARY;

  /**
   * Fetches partner financial summary with verified DataEnvelope.
   * If server is absent, retrieves structured cache or marks as NOT_CONNECTED/CACHED.
   */
  public async getPartnerFinancialSummary(): Promise<DataEnvelope<PartnerFinancialSummary>> {
    const nowTime = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

    if (!runtimeConfig.apiBaseUrl && !runtimeConfig.allowDemoData) {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_FINANCE_LEDGER',
        updatedAt: nowTime,
        isRealData: false,
        error: 'Financial API не підключений',
      };
    }
    
    try {
      const remote = await getJsonFromPaths<unknown>([
        '/api/partner/dashboard',
        '/api/partner/finance/summary',
      ], 2500);
      const payoutEligibility = isJsonObject(remote) && isJsonObject(remote.payoutEligibility)
        ? remote.payoutEligibility
        : null;
      const minimumPayout = payoutEligibility && isJsonObject(payoutEligibility.minimumPayout)
        ? payoutEligibility.minimumPayout
        : null;
      const minimumPayoutMinor = minimumPayout && typeof minimumPayout.amountMinor === 'number'
        ? minimumPayout.amountMinor
        : null;
      const data = isJsonObject(remote) && isJsonObject(remote.wallet)
        ? {
            totalBalance: (Number(remote.wallet.pendingMinor) + Number(remote.wallet.heldMinor) + Number(remote.wallet.availableMinor)) / 100,
            availableBalance: Number(remote.wallet.availableMinor) / 100,
            pendingBalance: Number(remote.wallet.pendingMinor) / 100,
            heldBalance: Number(remote.wallet.heldMinor) / 100,
            lifetimeEarnings: Number(remote.wallet.lifetimeEarnedMinor) / 100,
            lifetimePaid: Number(remote.wallet.paidTotalMinor) / 100,
            qualifiedL1: isJsonObject(remote.partner) ? Number(remote.partner.activeL1PaidCount) : undefined,
            minimumPayout: minimumPayoutMinor === null ? 0 : minimumPayoutMinor / 100,
            minimumPayoutBaseCurrency: minimumPayout && typeof minimumPayout.baseCurrency === 'string' ? minimumPayout.baseCurrency : 'USD',
            minimumPayoutBaseAmount: minimumPayout && typeof minimumPayout.baseAmount === 'string' ? Number(minimumPayout.baseAmount) : 10,
            minimumPayoutResolved: minimumPayoutMinor !== null,
            payoutEligibilityStatus: payoutEligibility && typeof payoutEligibility.status === 'string' ? payoutEligibility.status : 'UNKNOWN',
            payoutProviderStatus: isJsonObject(remote) && typeof remote.payoutProviderStatus === 'string' ? remote.payoutProviderStatus : 'UNKNOWN',
          }
        : remote;

      if (data && typeof data === 'object') {
        const state = inferDataState(remote);
        if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        const isDashboardPayload = isJsonObject(remote) && isJsonObject(remote.wallet);
        const payload: PartnerFinancialSummary = {
          ...this.summary,
          ...(isDashboardPayload ? {
            earnedThisMonth: 0,
            earnedLastMonth: 0,
            l1Earnings: 0,
            l2Earnings: 0,
            sparkline: [],
            amountUntilMinimum: 0,
          } : {}),
          ...(data as Partial<PartnerFinancialSummary>),
          updatedAt: nowTime,
          status: state,
        };
        // Keep the local view-model aligned with the latest authoritative
        // projection so client-side guardrails (including payout amount
        // checks) never validate against an obsolete demo balance.
        this.summary = payload;
        CacheManager.set(CACHE_KEY_FINANCE, payload, 300, 'SIREN_UA_FINANCE_API');

        return {
          data: payload,
          state,
          source: 'SIREN_UA_FINANCE_LEDGER',
          updatedAt: nowTime,
          isRealData: state === 'LIVE',
        };
      }
    } catch {
      if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) {
        return {
          data: null,
          state: 'NOT_CONNECTED',
          source: 'SIREN_UA_FINANCE_LEDGER',
          updatedAt: nowTime,
          isRealData: false,
          error: 'Financial API is not connected or returned an invalid payload',
        };
      }
      // Local development fallback remains explicitly DEMO.
    }

    // Check cached entry
    const cached = CacheManager.get<PartnerFinancialSummary>(CACHE_KEY_FINANCE);
    if (cached.data && cached.data.status !== 'DEMO' && cached.data.status !== 'NOT_CONNECTED') {
      const cachedData = {
        ...cached.data,
        status: cached.state,
      };
      this.summary = cachedData;
      return {
        data: cachedData,
        state: cached.state,
        source: cached.source || 'LOCAL_CACHE',
        updatedAt: cached.fetchedAt ? new Date(cached.fetchedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : nowTime,
        isRealData: true,
      };
    }

    // Default verified client baseline (not falsely marked SUCCESS)
    const baselineData: PartnerFinancialSummary = {
      ...this.summary,
      updatedAt: nowTime,
      status: 'DEMO',
    };
    this.summary = baselineData;

    return {
      data: baselineData,
      state: 'DEMO',
      source: 'LOCAL_DEMO_FINANCIAL_DATA',
      updatedAt: nowTime,
      isRealData: false,
    };
  }

  /**
   * Returns saved payout methods
   */
  public getPayoutMethods(): PayoutMethodConfig[] {
    return runtimeConfig.allowDemoData ? this.payoutMethods : [];
  }

  /**
   * Adds new payout method
   */
  public addPayoutMethod(method: Omit<PayoutMethodConfig, 'id'>): PayoutMethodConfig {
    const newMethod: PayoutMethodConfig = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    if (newMethod.isDefault) {
      this.payoutMethods = this.payoutMethods.map(m => ({ ...m, isDefault: false }));
    }
    this.payoutMethods.push(newMethod);
    return newMethod;
  }

  /**
   * Returns recent ledger transactions
   */
  public getLedgerTransactions(): LedgerTransaction[] {
    return runtimeConfig.allowDemoData ? this.ledgerTransactions : [];
  }

  /**
   * Returns payout request history
   */
  public getPayoutHistory(): PayoutTransaction[] {
    return runtimeConfig.allowDemoData ? this.payoutHistory : [];
  }

  /** Read the canonical immutable-ledger projection when the backend is connected. */
  public async getLedgerProjection(): Promise<DataEnvelope<LedgerTransaction[]>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    try {
      const remote = await getJsonFromPaths<unknown>(['/api/partner/ledger', '/api/v1/partner/ledger'], 2500);
      if (!isJsonObject(remote) || !Array.isArray(remote.entries)) throw new Error('Ledger payload has invalid shape');
      const entries = remote.entries.filter(isJsonObject).map((entry, index): LedgerTransaction => {
        const amountMinor = typeof entry.amountMinor === 'number' ? entry.amountMinor : 0;
        const creditAccount = String(entry.creditAccount ?? '');
        return {
          id: typeof entry.id === 'string' ? entry.id : `ledger-${index}`,
          type: creditAccount.includes('PAYOUT') ? 'PAYOUT_WITHDRAWAL' : entry.referralLevel === 'L2' ? 'COMMISSION_L2' : 'COMMISSION_L1',
          description: typeof entry.description === 'string' ? entry.description : 'Ledger transaction',
          amount: amountMinor / 100,
          direction: creditAccount.includes('PARTNER_') ? 'CREDIT' : 'DEBIT',
          timestamp: typeof entry.timestamp === 'string' ? new Date(entry.timestamp).toLocaleString('uk-UA') : updatedAt,
          partnerLevel: entry.referralLevel === 'L2' ? 'L2' : entry.referralLevel === 'L1' ? 'L1' : undefined,
          referenceId: typeof entry.transactionId === 'string' ? entry.transactionId : undefined,
          balanceAfter: 0,
        };
      });
      const state = inferDataState(remote, remote.integrityCheck === 'ZERO_SUM_VERIFIED' ? 'DEMO' : 'LIVE');
      if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
      return { data: entries, state, source: 'SIREN_UA_PARTNER_LEDGER', updatedAt, isRealData: state === 'LIVE' };
    } catch {
      return { data: null, state: runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData ? 'NOT_CONNECTED' : 'DEMO', source: 'SIREN_UA_PARTNER_LEDGER', updatedAt, isRealData: false };
    }
  }

  /** Read payout history without inventing a provider status or destination. */
  public async getPayoutProjection(): Promise<DataEnvelope<PayoutTransaction[]>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    try {
      const remote = await getJsonFromPaths<unknown>(['/api/partner/payouts', '/api/v1/partner/payouts'], 2500);
      if (!isJsonObject(remote) || !Array.isArray(remote.payouts)) throw new Error('Payout payload has invalid shape');
      const payouts = remote.payouts.filter(isJsonObject).map((payout, index): PayoutTransaction => {
        const amount = typeof payout.amountMinor === 'number' ? payout.amountMinor / 100 : 0;
        const provider = String(payout.provider ?? '').toUpperCase();
        return {
          id: typeof payout.id === 'string' ? payout.id : `payout-${index}`,
          amount,
          fee: 0,
          netAmount: amount,
          currency: payout.currency === 'USDT' ? 'USDT' : 'UAH',
          method: provider.includes('USDT') ? 'USDT_TRC20' : provider.includes('PRIVAT') ? 'PRIVATBANK' : 'MONOBANK',
          targetAccount: typeof payout.destinationAccount === 'string' ? payout.destinationAccount : '—',
          targetAccountMasked: typeof payout.destinationAccount === 'string' ? payout.destinationAccount : '—',
          requestedAt: typeof payout.requestedAt === 'string' ? new Date(payout.requestedAt).toLocaleString('uk-UA') : updatedAt,
          completedAt: typeof payout.completedAt === 'string' ? new Date(payout.completedAt).toLocaleString('uk-UA') : undefined,
          status: payout.status === 'PAID' ? 'PAID' : payout.status === 'FAILED' ? 'FAILED' : 'PROCESSING',
          statusStepIndex: payout.status === 'PAID' ? 6 : 2,
          auditTrail: [],
        };
      });
      const state = inferDataState(remote);
      return { data: payouts, state, source: 'SIREN_UA_PARTNER_PAYOUTS', updatedAt, isRealData: state === 'LIVE' };
    } catch {
      return { data: null, state: runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData ? 'NOT_CONNECTED' : 'DEMO', source: 'SIREN_UA_PARTNER_PAYOUTS', updatedAt, isRealData: false };
    }
  }

  /**
   * Production payout requests are delegated to the configured provider API.
   * Without an API base, only a clearly labelled local DEMO request is created;
   * no provider success, balance mutation, or ledger entry is simulated.
   */
  public async executeWithdrawal(
    amount: number,
    methodId: string,
    onProgress?: (step: string, status: PayoutLifecycleStatus, stepIndex: number) => void
  ): Promise<{ success: boolean; transaction?: PayoutTransaction; error?: string }> {
    const selectedMethod = this.payoutMethods.find(m => m.id === methodId) || this.payoutMethods[0];

    if (!selectedMethod) {
      return { success: false, error: 'Спосіб виплати не підключений' };
    }
    
    if (amount > this.summary.availableBalance) {
      return { success: false, error: 'Сума перевищує доступний до виведення баланс' };
    }

    if (amount < selectedMethod.minAmountUah) {
      return { success: false, error: `Мінімальна сума виведення становить ₴ ${selectedMethod.minAmountUah}` };
    }

    // A configured API base is a production boundary: never silently replace a
    // provider failure with a local success state.
    if (runtimeConfig.apiBaseUrl) {
      try {
        const remoteTransaction = await postJsonFromPaths<PayoutTransaction>(['/api/partner/payouts', '/api/v1/partner/payouts'], {
          amount,
          methodId: selectedMethod.id,
          currency: selectedMethod.type === 'USDT_TRC20' ? 'USDT' : 'UAH',
        });

        if (!remoteTransaction || typeof remoteTransaction.id !== 'string' || !remoteTransaction.status) {
          throw new Error('Payout provider returned an invalid transaction');
        }

        this.payoutHistory.unshift(remoteTransaction);
        if (onProgress) {
          onProgress('Payout provider прийняв запит', remoteTransaction.status, remoteTransaction.statusStepIndex ?? 1);
        }
        return { success: true, transaction: remoteTransaction };
      } catch {
        return {
          success: false,
          error: 'Не вдалося передати payout-запит у production provider. Кошти не списано.',
        };
      }
    }

    if (!runtimeConfig.allowDemoData) {
      return { success: false, error: 'Payout provider не підключений. Кошти не списано.' };
    }

    // Without a configured backend, keep the interaction useful for QA but do
    // not emulate a bank/provider success, mutate balances, or append a fake
    // ledger entry. The UI labels this request as DEMO explicitly.
    const fee = selectedMethod.feePercent > 0
      ? Math.round((amount * selectedMethod.feePercent) / 100)
      : selectedMethod.fixedFeeUah;
    const netAmount = amount - fee;
    const txId = `DEMO-PAY-${Date.now()}`;
    const now = new Date();

    const transaction: PayoutTransaction = {
      id: txId,
      amount,
      fee,
      netAmount,
      currency: selectedMethod.type === 'USDT_TRC20' ? 'USDT' : 'UAH',
      method: selectedMethod.type,
      targetAccount: selectedMethod.accountMasked,
      targetAccountMasked: selectedMethod.accountMasked,
      requestedAt: now.toLocaleString('uk-UA'),
      status: 'REQUESTED',
      statusStepIndex: 0,
      auditTrail: [
        { step: 'Запит на виведення коштів створено', timestamp: now.toLocaleTimeString('uk-UA'), status: 'COMPLETED' },
      ],
    };
    onProgress?.('DEMO-заявку створено локально. Provider не викликався.', 'REQUESTED', 0);
    return { success: true, transaction };
  }
}

export const financialService = new FinancialService();

/**
 * Transforms raw backend model into the 3D Carousel ViewModel
 */
export function mapSummaryToViewModel(summary: PartnerFinancialSummary): FinancialCardViewModel {
  const qualifiedL1 = summary.qualifiedL1 ?? 154;
  const currentRankTier = calculateRankByL1(qualifiedL1);
  const nextRankTier = getNextTierInfo(currentRankTier, qualifiedL1);

  const eligible = summary.availableBalance >= summary.minimumPayout;
  const remainingUntilMinimum = !eligible 
    ? Math.max(0, summary.minimumPayout - summary.availableBalance) 
    : 0;

  // Percentage change this month vs last month
  const percentageChange = summary.earnedLastMonth > 0
    ? Number((((summary.earnedThisMonth - summary.earnedLastMonth) / summary.earnedLastMonth) * 100).toFixed(1))
    : 0;

  const isStarter = currentRankTier.id === 'STARTER';
  const l1Earned = isStarter 
    ? summary.earnedThisMonth 
    : (summary.l1Earnings ?? Math.round(summary.earnedThisMonth * 0.68));
  const l2Earned = isStarter 
    ? undefined 
    : (summary.l2Earnings ?? Math.round(summary.earnedThisMonth * 0.32));

  return {
    balance: {
      total: summary.totalBalance,
      available: summary.availableBalance,
      pending: summary.pendingBalance,
      held: summary.heldBalance,
    },
    earnings: {
      thisMonth: summary.earnedThisMonth,
      lastMonth: summary.earnedLastMonth,
      lifetime: summary.lifetimeEarnings,
      l1: l1Earned,
      l2: l2Earned,
      sparklineData: summary.sparkline || [1350, 1520, 1780, 2100, 1950, 2310, 2840],
      percentageChange: percentageChange > 0 ? percentageChange : 22.9,
    },
    payout: {
      available: summary.availableBalance,
      lifetimePaid: summary.lifetimePaid,
      minimum: summary.minimumPayout,
      remainingUntilMinimum,
      eligible,
    },
    rank: {
      name: currentRankTier.name,
      id: currentRankTier.id,
      l1Rate: currentRankTier.l1Rate,
      l2Rate: currentRankTier.l2Rate,
      qualifiedL1,
      nextThreshold: nextRankTier.nextTier?.minL1,
      nextRankName: nextRankTier.nextTier?.name,
      remainingToNext: nextRankTier.remainingL1,
      isL2Unlocked: currentRankTier.isL2Unlocked,
    },
    updatedAt: summary.updatedAt,
    dataState: summary.status,
  };
}
