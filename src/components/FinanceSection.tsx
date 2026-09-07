import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  ChevronRight, 
  Plus, 
  HelpCircle, 
  Sparkles, 
  DollarSign, 
  FileText, 
  ArrowRight,
  Gift,
  ExternalLink,
  Lock,
  Zap,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';
import { 
  financialService, 
  mapSummaryToViewModel,
  DEFAULT_FINANCIAL_SUMMARY,
  UNAVAILABLE_FINANCIAL_SUMMARY,
} from '../services/financialService';
import { 
  PartnerFinancialSummary, 
  LedgerTransaction, 
  PayoutMethodConfig, 
  PayoutTransaction,
  PayoutLifecycleStatus 
} from '../types/finance';
import { calculateRankByL1, getNextTierInfo } from '../services/referralEngine';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { ContextDrawer } from './ContextDrawer';
import { InfoTooltip } from './InfoTooltip';
import { DataState } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';

interface FinanceSectionProps {
  onOpenNetwork?: () => void;
  theme?: 'light' | 'dark';
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  onOpenNetwork,
  theme = 'light',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('8months');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newMethodError, setNewMethodError] = useState<string | null>(null);
  const [newMethodSuccess, setNewMethodSuccess] = useState(false);
  const [summary, setSummary] = useState<PartnerFinancialSummary>(runtimeConfig.allowDemoData ? DEFAULT_FINANCIAL_SUMMARY : UNAVAILABLE_FINANCIAL_SUMMARY);
  const [dataState, setDataState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [ledger, setLedger] = useState<LedgerTransaction[]>(() => financialService.getLedgerTransactions());
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethodConfig[]>(() => financialService.getPayoutMethods());
  const [selectedMethodId, setSelectedMethodId] = useState<string>(() => financialService.getPayoutMethods()[0]?.id || 'pm-1');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  
  // Withdrawal Lifecycle state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepName, setCurrentStepName] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedTransaction, setCompletedTransaction] = useState<PayoutTransaction | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    Promise.all([
      financialService.getPartnerFinancialSummary(),
      financialService.getLedgerProjection(),
    ]).then(([res, ledgerResponse]) => {
      setDataState(res.state);
      if (res.data) {
        setSummary(res.data);
        setWithdrawAmount(String(res.data.availableBalance));
      } else if (res.state === 'NOT_CONNECTED') {
        setSummary(UNAVAILABLE_FINANCIAL_SUMMARY);
        setWithdrawAmount('0');
        setLedger([]);
        setPayoutMethods([]);
        setSelectedMethodId('');
      }
      if (ledgerResponse.data) setLedger(ledgerResponse.data);
      if (res.source && res.source !== 'LOCAL_DEMO_FINANCIAL_DATA') {
        // Dev15 currently exposes no verified payout-method registry. Never
        // display local masked cards beside a backend wallet projection.
        setPayoutMethods([]);
        setSelectedMethodId('');
      } else {
        setPayoutMethods(financialService.getPayoutMethods());
      }
    });
  }, []);

  const selectedMethod = payoutMethods.find(m => m.id === selectedMethodId) || payoutMethods[0];
  const minimumPayoutResolved = summary.minimumPayoutResolved !== false;
  const minimumPayoutLabel = minimumPayoutResolved
    ? `₴ ${summary.minimumPayout.toLocaleString('uk-UA')}`
    : `еквівалент ${summary.minimumPayoutBaseCurrency || 'USD'} ${summary.minimumPayoutBaseAmount ?? 10} · курс не підключено`;
  const levelOneIncome = summary.l1Earnings ?? 0;
  const levelTwoIncome = summary.l2Earnings ?? 0;
  const bonusIncome = Math.max(0, summary.totalBalance - levelOneIncome - levelTwoIncome);
  const calculatedFee = selectedMethod?.feePercent > 0 
    ? Math.round((Number(withdrawAmount || 0) * selectedMethod.feePercent) / 100)
    : (selectedMethod?.fixedFeeUah || 0);
  const netWithdraw = Math.max(0, Number(withdrawAmount || 0) - calculatedFee);
  const hasDetailedTrend = Array.isArray(summary.sparkline) && summary.sparkline.length > 0;
  const earningsSeries = hasDetailedTrend ? summary.sparkline! : [];
  const earningsMax = Math.max(...earningsSeries, 1);
  const monthLabels = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер'];
  const currentRankTier = calculateRankByL1(summary.qualifiedL1 ?? 0);
  const nextRankProgress = getNextTierInfo(currentRankTier, summary.qualifiedL1 ?? 0);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!minimumPayoutResolved) {
      setWithdrawError(`Payout недоступний: ${minimumPayoutLabel}. Потрібен verified FX source.`);
      return;
    }
    if (!selectedMethod) {
      setWithdrawError('Спосіб виплати не підключений. Додайте verified payout method після підключення provider API.');
      return;
    }

    setIsProcessing(true);
    setWithdrawError(null);
    playWebAudioSound('click');

    const result = await financialService.executeWithdrawal(amount, selectedMethodId, (stepName, status, stepIdx) => {
      setCurrentStepName(stepName);
      setCurrentStepIndex(stepIdx);
    });

    setIsProcessing(false);

    if (result.success && result.transaction) {
      setCompletedTransaction(result.transaction);
      // The local DEMO path never mutates balance or ledger. Production
      // providers must return authoritative post-payout data via API refresh.
      if (dataState === 'LIVE') {
        const refreshed = await financialService.getPartnerFinancialSummary();
        if (refreshed.data) setSummary(refreshed.data);
        setLedger(financialService.getLedgerTransactions());
      }
      setWithdrawSuccess(true);
      playWebAudioSound('ping');
    } else {
      setWithdrawError(result.error || 'Не вдалося виконати виведення коштів');
      playWebAudioSound('alert');
    }
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setCompletedTransaction(null);
    setCurrentStepName('');
    setCurrentStepIndex(0);
    setWithdrawError(null);
  };

  const closeAddCardModal = () => {
    setShowAddCardModal(false);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvv('');
    setNewMethodError(null);

    if (dataState === 'DEMO' && payoutMethods.length === 0) {
      setNewMethodError('Payout provider та реєстр платіжних методів ще не підключені. Реальні реквізити не зберігаються в demo.');
      return;
    }
    setNewMethodSuccess(false);
  };

  const handleAddPayoutMethod = (event: React.FormEvent) => {
    event.preventDefault();
    setNewMethodError(null);

    if (!runtimeConfig.allowDemoData) {
      setNewMethodError('Payout provider не підключений. Реальні реквізити недоступні.');
      return;
    }

    if (dataState === 'LIVE') {
      setNewMethodError('Додавання платіжного методу виконується через payout provider. API ще не повернув доступний flow.');
      return;
    }

    const digits = newCardNumber.replace(/\D/g, '');
    if (digits.length !== 16) {
      setNewMethodError('Введіть 16 цифр номера картки. Дані залишаться лише в локальному DEMO-сценарії.');
      return;
    }

    if (!/^\d{2}\s*\/\s*\d{2}$/.test(newCardExpiry.trim())) {
      setNewMethodError('Вкажіть термін дії у форматі MM / YY.');
      return;
    }

    if (!/^\d{3,4}$/.test(newCardCvv.trim())) {
      setNewMethodError('CVV має містити 3 або 4 цифри.');
      return;
    }

    const lastFour = digits.slice(-4);
    const addedMethod = financialService.addPayoutMethod({
      type: 'MONOBANK',
      title: 'Нова картка (DEMO)',
      account: `•••• ${lastFour}`,
      accountMasked: `•••• ${lastFour}`,
      feePercent: 0,
      fixedFeeUah: 0,
      isDefault: false,
      minAmountUah: summary.minimumPayout,
    });

    setPayoutMethods(financialService.getPayoutMethods());
    setSelectedMethodId(addedMethod.id);
    setNewMethodSuccess(true);
    playWebAudioSound('ping');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Top Hero Finance Banner with 3D Holographic Wallet & Gold Hryvnia Coins (1:1 with Screenshot 4) */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/80 border-slate-100 text-slate-900 shadow-xs'
      }`}>
        
        {/* Left Headline & Content */}
        <div className="space-y-3.5 max-w-xl z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            isDark ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-blue-100/70 border border-blue-200/60 text-blue-700'
          }`}>
            <span>🇺🇦</span>
            <span>Прозорі виплати. Реальні можливості.</span>
          </div>

          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Твій дохід <br className="hidden sm:inline" />
            <span className="text-blue-600">робить Україну безпечнішою.</span>
          </h1>

          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {dataState === 'LIVE'
              ? 'Заробляй, розвивай мережу та підтримуй важливу справу. Прозора статистика, автоматичні виплати, повний контроль.'
              : dataState === 'NOT_CONNECTED'
                ? 'Актуальні фінансові дані тимчасово недоступні. Баланс, ledger і payout flow не показуються як live.'
                : 'Демонстраційний фінансовий кабінет: структура доходу, ledger і payout flow готові до підключення production billing API.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button 
              onClick={() => setShowFaqDrawer(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Як працюють фінанси?</span>
            </button>

            <div className={`hidden sm:flex px-3 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
            }`}>
              <span>🖤</span>
              <span>Твій внесок у безпеку</span>
            </div>
          </div>
        </div>

        {/* Right: 3D Holographic Leather Wallet + Gold Coin Stack + Ukraine Shield Graphic (1:1 with Screenshot 4) */}
        <div className="relative w-72 h-52 flex items-center justify-center flex-shrink-0 select-none">
          
          <div className="absolute -top-4 -right-4 hidden lg:block z-20">
            <DataFreshnessIndicator state={dataState} theme={theme} />
          </div>

          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* 3D Wallet SVG Illustration with Hryvnia Coin */}
          <svg viewBox="0 0 240 180" className="w-full h-full transform drop-shadow-2xl">
            <defs>
              <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>

            {/* Background 3D Gold Coins */}
            <g transform="translate(120, 20)">
              <ellipse cx="25" cy="35" rx="30" ry="24" fill="url(#goldGrad)" />
              <ellipse cx="25" cy="32" rx="27" ry="21" fill="#FACC15" />
              <text x="25" y="38" fontSize="20" fontWeight="900" textAnchor="middle" fill="#854D0E">₴</text>
            </g>

            {/* 3D Leather Wallet Front */}
            <g transform="translate(30, 45)">
              {/* Back flap */}
              <rect x="10" y="5" width="160" height="110" rx="18" fill="#1E40AF" />
              {/* Front flap */}
              <rect x="15" y="20" width="155" height="95" rx="16" fill="url(#walletGrad)" stroke="#60A5FA" strokeWidth="1.5" />
              {/* Card slot lines */}
              <path d="M 25 45 Q 90 60 160 45" stroke="#93C5FD" strokeWidth="1.5" fill="none" opacity="0.6" />
              <path d="M 25 65 Q 90 80 160 65" stroke="#93C5FD" strokeWidth="1.5" fill="none" opacity="0.6" />
              
              {/* Emblem Trident on Wallet */}
              <circle cx="95" cy="55" r="14" fill="#1E3A8A" opacity="0.6" />
              <path d="M91 58 L91 48 M99 58 L99 48 M95 46 L95 62 M88 51 L95 62 L102 51" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Siren UA Text on Wallet */}
              <text x="95" y="85" fontSize="10" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.1em">SIREN UA</text>
            </g>

            {/* Ukraine Security Shield on Left */}
            <g transform="translate(10, 80)">
              <path d="M 25 5 Q 5 15 5 40 Q 5 65 25 80 Q 45 65 45 40 Q 45 15 25 5 Z" fill="url(#shieldGrad)" stroke="#DBEAFE" strokeWidth="1.5" />
              {/* Ukraine Map Silhouette */}
              <path d="M15 35 Q25 30 35 34 Q32 45 25 48 Q18 45 15 35 Z" fill="#FEF08A" opacity="0.9" />
            </g>
          </svg>

          {/* Slogan pill under graphic */}
          <div className="absolute bottom-1 right-2 text-right pointer-events-none">
            <span className={`text-xs font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              Разом сильніші 💙💛
            </span>
          </div>

        </div>

      </div>

      {/* 2. Top 4 Metric Cards (1:1 with Screenshot 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Зароблено всього */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-emerald-950/80 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +{summary.totalBalance > 0 ? '12%' : '0%'}
            </span>
          </div>
          <div className={`text-xs font-medium mt-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Зароблено всього</div>
          <div className="text-2xl sm:text-3xl font-black mt-0.5">₴ {summary.totalBalance.toLocaleString()}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>З моменту реєстрації</div>
        </div>

        {/* Card 2: Баланс */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-xs font-medium mt-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Баланс</div>
          <div className="text-2xl sm:text-3xl font-black mt-0.5 text-blue-600">₴ {summary.availableBalance.toLocaleString()}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Доступно до виводу</div>
        </div>

        {/* Card 3: Виведено */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-purple-950/80 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-xs font-medium mt-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Виведено</div>
          <div className="text-2xl sm:text-3xl font-black mt-0.5">₴ {summary.lifetimePaid.toLocaleString()}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{dataState === 'LIVE' ? 'Успішних виплат' : 'Демо-прикладів виплат'}: {ledger.filter(l => l.type === 'PAYOUT_WITHDRAWAL').length}</div>
        </div>

        {/* Card 4: Очікується */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-amber-950/80 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-xs font-medium mt-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Очікується</div>
          <div className="text-2xl sm:text-3xl font-black mt-0.5">₴ {summary.pendingBalance.toLocaleString()}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>У процесі обробки</div>
        </div>

      </div>

      {/* 3. Middle Grid: Income Bar Chart | Structure Donut Chart | Dynamic Line Chart | Withdrawal & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left (8 cols): 3 Analytical Charts */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Chart 1: Дохід за період (Vertical Bar Chart for 8 months: Січ, Лют, Бер, Кві, Тра, Чер, Лип, Сер) */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Дохід за період</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black">{summary.earnedThisMonth > 0 ? `₴ ${summary.earnedThisMonth.toLocaleString('uk-UA')}` : '—'}</span>
                  {summary.earnedThisMonth > 0 && dataState === 'DEMO' && (
                    <span className="text-xs font-bold text-amber-500">DEMO</span>
                  )}
                </div>
              </div>

              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="8months">Останні 8 місяців</option>
                <option value="6months">Останні 6 місяців</option>
                <option value="year">Цей рік</option>
              </select>
            </div>

            {/* 8-Month Vertical Bars */}
            {hasDetailedTrend ? (
              <div className="h-36 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
                {earningsSeries.map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all group-hover:brightness-110"
                      style={{ height: `${Math.max(4, (value / earningsMax) * 100)}%`, opacity: 0.45 + (i * 0.06) }}
                    />
                    <span className="text-[11px] font-medium text-slate-400">{monthLabels[i] ?? `#${i + 1}`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-center text-xs text-slate-400">
                Детальна динаміка доходу ще не підключена до API.
              </div>
            )}
          </div>

          {/* 2 Bottom Charts in 2-Columns: Структура доходу (Donut) & Динаміка мережі (Line) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Структура доходу (Donut) */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
            }`}>
              <h3 className="text-sm font-bold mb-2">Структура доходу</h3>

              <div className="flex items-center justify-center my-3 relative">
                <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                  {/* Рівень 1 (10%): ₴8 460 ~ 68% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray={`${(levelOneIncome / Math.max(1, summary.totalBalance)) * 238.7} 238.7`} strokeDashoffset="0" />
                  {/* Рівень 2 (5%): ₴3 250 ~ 26% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray={`${(levelTwoIncome / Math.max(1, summary.totalBalance)) * 238.7} 238.7`} strokeDashoffset={`-${(levelOneIncome / Math.max(1, summary.totalBalance)) * 238.7}`} />
                  {/* Бонуси: ₴750 ~ 6% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray={`${(bonusIncome / Math.max(1, summary.totalBalance)) * 238.7} 238.7`} strokeDashoffset={`-${((levelOneIncome + levelTwoIncome) / Math.max(1, summary.totalBalance)) * 238.7}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-sm font-black leading-tight">₴ {summary.totalBalance.toLocaleString()}</span>
                  <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Всього</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Рівень 1 (20%)</span>
                  </span>
                  <span className="font-bold">₴ {levelOneIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Рівень 2 (20%)</span>
                  </span>
                  <span className="font-bold">₴ {levelTwoIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Бонуси</span>
                  </span>
                  <span className="font-bold">₴ {bonusIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Динаміка мережі (Line chart) */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Динаміка мережі</h3>
                <span className="text-xs font-bold text-amber-500">{hasDetailedTrend ? (dataState === 'LIVE' ? 'LIVE' : 'DEMO-ГРАФІК') : 'ДАНІ НЕДОСТУПНІ'}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{summary.qualifiedL1 ?? '—'} qualified L1</span>
                <span className="font-bold text-slate-900 dark:text-white">{hasDetailedTrend ? 'Є серія' : '—'}</span>
              </div>

              {/* Line chart svg only when a real/demo series exists. */}
              <div className="h-28 flex items-center justify-center my-2">
                {hasDetailedTrend ? (
                <svg viewBox="0 0 200 80" className="w-full h-full">
                  <path
                    d="M 10 70 Q 50 65 90 45 T 190 10"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="70" r="4" fill="#2563EB" />
                  <circle cx="90" cy="45" r="4" fill="#2563EB" />
                  <circle cx="190" cy="10" r="5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
                ) : <span className="text-xs text-slate-400">Очікуємо аналітичний API</span>}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Січ</span>
                <span>Сер</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right (4 cols): Rank & Withdraw Action & Payment Methods */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          
          {/* Card 1: Партнерський рівень */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Партнерський рівень</div>
                <div className="text-base font-black text-amber-500 flex items-center gap-1.5 mt-0.5">
                  <Award className="w-4 h-4" />
                  <span>{calculateRankByL1(summary.qualifiedL1 ?? 0).badgeLabel}</span>
                </div>
              </div>
              <button onClick={() => onOpenNetwork?.()} aria-label="Відкрити партнерську мережу" className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center cursor-pointer">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {(() => {
                const currentRankTier = calculateRankByL1(summary.qualifiedL1);
                const nextTierData = getNextTierInfo(currentRankTier, summary.qualifiedL1);
                const nextTierName = nextTierData.nextTier ? nextTierData.nextTier.name : 'Максимальний';
                const targetMinL1 = nextTierData.nextTier ? nextTierData.nextTier.minL1 : summary.qualifiedL1;
                return (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        До наступного рівня ({nextTierName}): <span className="font-bold text-slate-800 dark:text-slate-200">{nextTierData.remainingL1} L1</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${nextTierData.progressPercent}%` }} />
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-400">{summary.qualifiedL1} / {targetMinL1}</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Card 2: Вивести кошти (1:1 with Screenshot 4) */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Вивести кошти</h3>
                <button onClick={() => setShowWithdrawModal(true)} disabled={dataState === 'NOT_CONNECTED'} aria-label="Відкрити виведення коштів" className="w-7 h-7 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Доступно до виводу</div>
              <div className="text-3xl font-black mt-1 text-slate-900 dark:text-white">
                ₴ {summary.availableBalance.toLocaleString()}
              </div>

              <button
                onClick={() => {
                  setShowWithdrawModal(true);
                  playWebAudioSound('click');
                }}
                disabled={dataState === 'NOT_CONNECTED'}
                className="w-full mt-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{dataState === 'NOT_CONNECTED' ? 'Виведення недоступне' : 'Вивести кошти'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Perks breakdown */}
            <div className={`space-y-2 pt-4 mt-4 border-t text-xs ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold leading-tight">Payout flow</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Автоматизація після API</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold leading-tight">Підтримка у кабінеті</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Контекстні підказки та статуси</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold leading-tight">Повна прозорість</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Усі транзакції у вашому кабінеті</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Способи виплати */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Способи виплати</h3>
              <button 
                onClick={() => setShowAddCardModal(true)}
                disabled={dataState === 'DEMO' && payoutMethods.length === 0}
                className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Додати</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {payoutMethods.map((method, idx) => (
                <button type="button" key={method.id} onClick={() => setSelectedMethodId(method.id)} className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-colors ${
                  selectedMethodId === method.id
                    ? (isDark ? 'bg-blue-950/40 border-blue-700/70' : 'bg-blue-50 border-blue-200')
                    : (isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100')
                }`}>
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${idx === 0 ? 'text-blue-600' : 'text-purple-600'}`} />
                    <div>
                      <div className="font-bold leading-tight">{method.type === 'IBAN' ? 'IBAN (UAH)' : method.type === 'USDT_TRC20' ? 'USDT (TRC-20)' : 'Картка'}</div>
                      <div className="text-[10px] text-slate-400">
                        {method.accountMasked}
                      </div>
                    </div>
                  </div>
                {selectedMethodId === method.id || method.isDefault ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {selectedMethodId === method.id && !method.isDefault ? 'Обрано' : 'Основна'}
                  </span>
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              ))}
              {payoutMethods.length === 0 && (
                <div className={`rounded-xl border px-3 py-3 text-xs ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  Verified payout methods unavailable. No card or account details are shown.
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* 4. Bottom Grid: Останні транзакції (Left) | Цілі та досягнення (Center) | Запроси ще друзів Promo (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Card 1: Останні транзакції (6 cols) */}
        <div className={`lg:col-span-6 p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Останні транзакції</h3>
              <button 
                onClick={() => {
                  setShowHistoryDrawer(true);
                }}
                className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Всі транзакції</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {ledger.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-none">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'COMMISSION_L1' || tx.type === 'COMMISSION_L2'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' 
                        : tx.type === 'BONUS_LEADER'
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}>
                      {tx.type === 'PAYOUT_WITHDRAWAL' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : tx.type === 'BONUS_LEADER' ? <Gift className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-semibold">{tx.description}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{tx.timestamp}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-black ${tx.direction === 'DEBIT' ? 'text-slate-800 dark:text-slate-200' : 'text-emerald-500'}`}>
                      {tx.direction === 'DEBIT' ? `−${tx.amount.toLocaleString('uk-UA')}` : `+${tx.amount.toLocaleString('uk-UA')}`} ₴
                    </div>
                    <div className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${tx.direction === 'DEBIT' ? 'text-blue-500' : 'text-emerald-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tx.direction === 'DEBIT' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      <span>{dataState === 'LIVE' ? (tx.direction === 'DEBIT' ? 'Виплачено' : 'Зараховано') : 'DEMO-приклад'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Цілі та досягнення (3 cols) */}
        <div className={`lg:col-span-3 p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Цілі та досягнення</h3>
              <button onClick={() => setShowFaqDrawer(true)} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Всі цілі</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Target 1: next rank, derived from qualified L1 only. */}
            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/50 border-amber-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <div className="font-bold">{nextRankProgress.nextTier ? nextRankProgress.nextTier.name : currentRankTier.name}</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {nextRankProgress.nextTier ? `Залишилось ${nextRankProgress.remainingL1} qualified L1` : 'Максимальний ранг досягнуто'}
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${nextRankProgress.progressPercent}%` }} />
                </div>
                <div className="text-right text-[10px] font-mono mt-1 text-slate-400">
                  {summary.qualifiedL1 ?? '—'} / {nextRankProgress.nextTier?.minL1 ?? summary.qualifiedL1 ?? '—'} L1
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Award className="w-3.5 h-3.5 text-blue-500" />
                    <span>Кваліфіковані L1</span>
                  </span>
                  <span className="font-bold">{summary.qualifiedL1 ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>Lifetime earnings</span>
                  </span>
                  <span className="font-bold">{summary.lifetimeEarnings > 0 ? `₴ ${summary.lifetimeEarnings.toLocaleString('uk-UA')}` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Статус даних</span>
                  </span>
                  <span className="font-bold">{dataState}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Запроси ще друзів і отримуй більше! (3 cols, 3D Gift Promo 1:1 with Screenshot 4) */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          
          {/* 3D Gift Box SVG on Bottom Right */}
          <div className="absolute -bottom-2 -right-2 w-28 h-28 opacity-90 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Gift box base */}
              <rect x="20" y="35" width="60" height="50" rx="8" fill="#818CF8" />
              <rect x="15" y="30" width="70" height="15" rx="4" fill="#6366F1" />
              {/* Ribbon */}
              <rect x="44" y="30" width="12" height="55" fill="#FDE047" />
              <rect x="20" y="55" width="60" height="10" fill="#FDE047" />
              {/* Bow */}
              <ellipse cx="40" cy="24" rx="10" ry="6" fill="#FDE047" transform="rotate(-20 40 24)" />
              <ellipse cx="60" cy="24" rx="10" ry="6" fill="#FDE047" transform="rotate(20 60 24)" />
              <circle cx="50" cy="25" r="4" fill="#EAB308" />
            </svg>
          </div>

          <div>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-black leading-tight max-w-[180px]">
              Запроси ще друзів і отримуй більше!
            </h3>
            <p className="text-xs text-blue-100 mt-2 max-w-[180px] leading-relaxed">
              Запрошуй партнерів через прозорий L1/L2 механізм. Платні промо-правила з’являться лише після окремого versioned approval.
            </p>
          </div>

          <div className="pt-4 z-10">
            <button
              onClick={() => onOpenNetwork?.()}
              className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Відкрити мережу</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Instant Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              ✕
            </button>

            <h3 className="text-lg font-black mb-1">Виведення коштів</h3>
            <p className="text-xs text-slate-400 mb-4">Доступно до виводу: ₴ {summary.availableBalance.toLocaleString('uk-UA')}</p>

            {dataState !== 'LIVE' && (
              <div className={`mb-4 rounded-2xl border px-3 py-2 text-[11px] ${isDark ? 'border-purple-900/50 bg-purple-950/30 text-purple-200' : 'border-purple-200 bg-purple-50 text-purple-700'}`}>
                DEMO: payout provider не підключений. Реальний переказ не виконується; доступність payout залежить від verified FX, KYC та provider.
              </div>
            )}

            {withdrawSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black">{dataState === 'LIVE' ? 'Заявку успішно створено!' : 'DEMO-заявку створено'}</h4>
                <p className="text-xs text-slate-400">{dataState === 'LIVE' ? 'Кошти будуть зараховані після підтвердження payout provider.' : 'Реального переказу не виконано. Підключіть payout provider для production-виплат.'}</p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Сума виводу (₴)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={summary.availableBalance}
                    min={summary.minimumPayout > 0 ? summary.minimumPayout : undefined}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-base font-bold outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <div className="text-[10px] text-slate-400 mt-1">Мінімальна сума: {minimumPayoutLabel}</div>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Оберіть рахунок для виплати</label>
                  <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold">{selectedMethod?.title || 'Платіжний метод не підключений'} {selectedMethod?.accountMasked ? `(${selectedMethod.accountMasked})` : ''}</span>
                    </div>
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || (dataState === 'DEMO' && payoutMethods.length === 0) || !minimumPayoutResolved}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <span>{!minimumPayoutResolved ? 'Payout недоступний' : dataState === 'LIVE' ? 'Підтвердити' : 'Запустити DEMO'}{minimumPayoutResolved ? ` виплату ₴ ${withdrawAmount}` : ''}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={closeAddCardModal}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              ✕
            </button>
            <h3 className="text-lg font-black mb-1">Додати платіжний метод</h3>
            <p className="text-xs text-slate-400 mb-4">Демо-форма приймає картку локально. Повний номер не зберігається й не передається без підключеного payout provider.</p>

            {newMethodSuccess ? (
              <div className="space-y-4 py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black">Метод додано в DEMO</h4>
                  <p className="mt-1 text-xs text-slate-500">У production потрібна верифікація через payout provider.</p>
                </div>
                <button type="button" onClick={closeAddCardModal} className="w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Готово</button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleAddPayoutMethod}>
              <input 
                type="text" 
                placeholder="Номер картки (16 цифр)"
                inputMode="numeric"
                autoComplete="off"
                value={newCardNumber}
                onChange={(event) => setNewCardNumber(event.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`} 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="ММ / РР"
                  inputMode="numeric"
                  autoComplete="off"
                  value={newCardExpiry}
                  onChange={(event) => setNewCardExpiry(event.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`} 
                />
                <input 
                  type="text" 
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="off"
                  value={newCardCvv}
                  onChange={(event) => setNewCardCvv(event.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`} 
                />
              </div>
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-blue-950/20 border-blue-900/50 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
              }`}>
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Важливо:</strong><br/>
                  Якщо у вас виникли проблеми з додаванням картки, будь ласка, переконайтесь, що вона відкрита для інтернет-платежів.
                </div>
              </div>
              {newMethodError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{newMethodError}</div>}
              <button type="submit" className="w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">Додати картку</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FAQ Drawer */}
      <ContextDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        title="Історія операцій"
        icon={<FileText className="w-5 h-5" />}
        theme={theme}
      >
        <div className="space-y-2">
          {dataState !== 'LIVE' && (
            <div className={`rounded-2xl border px-3 py-2 text-[11px] ${isDark ? 'border-purple-900/50 bg-purple-950/30 text-purple-200' : 'border-purple-200 bg-purple-50 text-purple-700'}`}>
              Історія нижче — демонстраційна структура ledger. Реальні операції з’являться після підключення financial API.
            </div>
          )}
          {ledger.map((transaction) => (
            <div key={transaction.id} className={`rounded-2xl border p-3 ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold">{transaction.description}</div>
                  <div className={`mt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{transaction.timestamp}</div>
                </div>
                <div className={`whitespace-nowrap text-xs font-black ${transaction.direction === 'CREDIT' ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {transaction.direction === 'CREDIT' ? '+' : '−'}₴ {transaction.amount.toLocaleString('uk-UA')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContextDrawer>

      {/* FAQ Drawer */}
      <ContextDrawer
        isOpen={showFaqDrawer}
        onClose={() => setShowFaqDrawer(false)}
        title="Як формується мій дохід?"
        icon={<HelpCircle className="w-5 h-5" />}
        theme={theme}
      >
        <div className="space-y-6 text-sm">
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Твій дохід у SIREN UA формується з двох рівнів партнерської мережі та бонусів за ранги.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold mb-1">1. Комісії Першого Рівня (L1)</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ти отримуєш <strong>{calculateRankByL1(summary.qualifiedL1).l1Percent}%</strong> від кваліфікованої оплати підписки людьми, яких ти особисто запросив. Це твої найпряміші партнери. Ставка фіксується правилами рангу на момент кваліфікації платежу.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-1">2. Комісії Другого Рівня (L2)</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ти також отримуєш <strong>{calculateRankByL1(summary.qualifiedL1).l2Percent}%</strong> комісійних з оплат людей, яких запросили твої партнери з L1. Вони формують дохід другого рівня, але <strong>НЕ</strong> враховуються для підвищення твого рангу.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-1">3. Бонуси (Bonuses)</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Досягнення та медалі за замовчуванням не змінюють фінансову математику. Будь-яка платна промо-кампанія має пройти окреме versioned-правило та перевірку ліміту.
              </p>
            </div>
            
            <div className={`p-4 rounded-xl border mt-4 ${
              isDark ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50 border-amber-200'
            }`}>
              <h4 className="font-bold mb-2 flex items-center gap-1.5 text-amber-600">
                <Clock className="w-4 h-4" />
                Статуси балансу
              </h4>
              <ul className={`text-xs space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li><strong>Очікується (Pending):</strong> Кошти надійшли, але проходять налаштований policy-період перевірки.</li>
                <li><strong>Доступно (Available):</strong> Кошти перевірені та готові до виводу на вашу картку.</li>
              </ul>
            </div>
          </div>
        </div>
      </ContextDrawer>

    </div>
  );
};
