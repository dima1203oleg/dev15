import { 
  AffiliateRankTier, 
  AffiliateCalculationResult, 
  AffiliateRankId,
  AffiliatePartnerNode,
  AffiliatePayoutRequest,
  AffiliatePromoTemplate
} from '../types';

export const AFFILIATE_RANKS: AffiliateRankTier[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    minL1: 1,
    maxL1: 9,
    l1Percent: 5,
    l2Percent: 0,
    l1Rate: 0.05,
    l2Rate: 0.00,
    isL2Unlocked: false,
    badgeColor: 'bg-slate-800 text-slate-200 border-slate-700',
    accentColor: '#94a3b8',
    description: 'Стартовий рівень для нових партнерів. Винагорода нараховується виключно з особисто запрошених (L1).',
    perks: [
      '5% від кожної підписки L1',
      'Особистий реферальний кабінет',
      'Аналітика переходів та конверсій',
      'L2 заблоковано (потрібно 10 L1 для Bronze)'
    ]
  },
  {
    id: 'BRONZE',
    name: 'Bronze',
    minL1: 10,
    maxL1: 29,
    l1Percent: 10,
    l2Percent: 10,
    l1Rate: 0.10,
    l2Rate: 0.10,
    isL2Unlocked: true,
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    accentColor: '#d97706',
    description: 'Розблокування другого рівня (L2). Зростання виплат з L1 у 2 рази та старт пасивного доходу від мережі.',
    perks: [
      '10% від підписок L1 (особисті)',
      '10% від підписок L2 (партнерські)',
      'Розблоковано доступ до L2 мережі',
      'Пріоритетні щотижневі виплати'
    ]
  },
  {
    id: 'SILVER',
    name: 'Silver',
    minL1: 30,
    maxL1: 74,
    l1Percent: 15,
    l2Percent: 15,
    l1Rate: 0.15,
    l2Rate: 0.15,
    isL2Unlocked: true,
    badgeColor: 'bg-slate-300/20 text-slate-100 border-slate-400/50',
    accentColor: '#cbd5e1',
    description: 'Масштабування партнерської мережі. 15% з обох рівнів для стабільного регулярного прибутку.',
    perks: [
      '15% з L1 + 15% з L2',
      'Персональний промокод та банери',
      'Виділена лінія партнерської підтримки',
      'Доступ до закритих вебінарів розвитку'
    ]
  },
  {
    id: 'GOLD',
    name: 'Gold',
    minL1: 75,
    maxL1: 199,
    l1Percent: 20,
    l2Percent: 20,
    l1Rate: 0.20,
    l2Rate: 0.20,
    isL2Unlocked: true,
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    accentColor: '#eab308',
    description: 'Топ-рівень партнерства. 20% комісії з першого та другого рівнів, бонуси лідерів.',
    perks: [
      '20% з L1 + 20% з L2',
      'Миттєвий щоденний вивід коштів',
      'Індивідуальні лендінги та UTM-трекінг',
      'Бонусні квартальні пули лідерів'
    ]
  },
  {
    id: 'PLATINUM',
    name: 'Platinum',
    minL1: 200,
    maxL1: null,
    l1Percent: 25,
    l2Percent: 25,
    l1Rate: 0.25,
    l2Rate: 0.25,
    isL2Unlocked: true,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    accentColor: '#06b6d4',
    description: 'Максимальний ранг. Максимальна виплата 50% з транзакції (25% L1 + 25% L2).',
    perks: [
      '25% з L1 + 25% з L2 (50% max cap)',
      'VIP персональний менеджер 24/7',
      'Спільні ко-маркетингові кампанії',
      'API інтеграція для автоматизації виплат'
    ]
  }
];

/**
 * Determine rank tier solely based on the number of active paid L1 referrals.
 * L2 DOES NOT affect rank!
 */
export function getRankByL1Count(l1Count: number): AffiliateRankTier {
  const safeL1 = Math.max(0, l1Count);
  
  if (safeL1 >= 200) {
    return AFFILIATE_RANKS[4]; // Platinum
  }
  if (safeL1 >= 75) {
    return AFFILIATE_RANKS[3]; // Gold
  }
  if (safeL1 >= 30) {
    return AFFILIATE_RANKS[2]; // Silver
  }
  if (safeL1 >= 10) {
    return AFFILIATE_RANKS[1]; // Bronze
  }
  return AFFILIATE_RANKS[0]; // Starter (1-9 or 0)
}

/**
 * Get next tier for progress calculations
 */
export function getNextRank(currentTier: AffiliateRankTier): AffiliateRankTier | null {
  const currentIndex = AFFILIATE_RANKS.findIndex(r => r.id === currentTier.id);
  if (currentIndex >= 0 && currentIndex < AFFILIATE_RANKS.length - 1) {
    return AFFILIATE_RANKS[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate full affiliate earnings & metrics
 */
export function calculateAffiliateEarnings(
  l1Count: number,
  avgL2PerL1: number,
  subscriptionPrice: number = 200 // UAH or USD
): AffiliateCalculationResult {
  const safeL1 = Math.max(0, l1Count);
  const safeAvgL2 = Math.max(0, avgL2PerL1);
  const currentRank = getRankByL1Count(safeL1);
  const nextRank = getNextRank(currentRank);

  // Total L2 referrals generated
  const totalL2Count = Math.round(safeL1 * safeAvgL2);
  const totalNetworkSize = safeL1 + totalL2Count;

  // Earnings calculation:
  // L1 income = safeL1 * price * currentRank.l1Rate
  const l1MonthlyIncome = safeL1 * subscriptionPrice * currentRank.l1Rate;

  // L2 income: ONLY if currentRank.isL2Unlocked (Starter gets 0%)
  const l2MonthlyIncome = currentRank.isL2Unlocked
    ? totalL2Count * subscriptionPrice * currentRank.l2Rate
    : 0;

  const totalMonthlyIncome = l1MonthlyIncome + l2MonthlyIncome;
  const totalAnnualIncome = totalMonthlyIncome * 12;

  // Progress to next rank
  let l1NeededForNextRank = 0;
  let progressToNextRankPercent = 100;

  if (nextRank) {
    l1NeededForNextRank = Math.max(0, nextRank.minL1 - safeL1);
    const rangeSpan = nextRank.minL1 - currentRank.minL1;
    const progressInCurrentRange = safeL1 - currentRank.minL1;
    progressToNextRankPercent = Math.min(
      100,
      Math.max(0, Math.round((progressInCurrentRange / rangeSpan) * 100))
    );
  }

  return {
    currentRank,
    nextRank,
    l1Count: safeL1,
    avgL2PerL1: safeAvgL2,
    totalL2Count,
    totalNetworkSize,
    subscriptionPrice,
    l1MonthlyIncome,
    l2MonthlyIncome,
    totalMonthlyIncome,
    totalAnnualIncome,
    l1NeededForNextRank,
    progressToNextRankPercent,
    isL2Unlocked: currentRank.isL2Unlocked,
    maxTransactionPayoutPercent: 50
  };
}

export const SAMPLE_SIMULATED_TRANSACTIONS = [
  {
    id: 'TX-9481',
    user: 'Олександр К.',
    level: 'L1',
    plan: 'SirenUA Pro Річний',
    amount: 2400,
    date: 'Сьогодні, 14:20',
    status: 'COMPLETED'
  },
  {
    id: 'TX-9480',
    user: 'Марія В. (від Олександра)',
    level: 'L2',
    plan: 'SirenUA Pro Місячний',
    amount: 200,
    date: 'Сьогодні, 13:45',
    status: 'COMPLETED'
  },
  {
    id: 'TX-9479',
    user: 'Ігор С.',
    level: 'L1',
    plan: 'SirenUA Pro Місячний',
    amount: 200,
    date: 'Вчора, 21:10',
    status: 'COMPLETED'
  },
  {
    id: 'TX-9478',
    user: 'Тарас П. (від Ігоря)',
    level: 'L2',
    plan: 'SirenUA Pro Річний',
    amount: 2400,
    date: 'Вчора, 18:02',
    status: 'COMPLETED'
  },
  {
    id: 'TX-9477',
    user: 'Олена Д.',
    level: 'L1',
    plan: 'SirenUA Pro Місячний',
    amount: 200,
    date: '03 Бер, 16:50',
    status: 'COMPLETED'
  }
];

export const FAQ_AFFILIATE = [
  {
    q: 'Як визначається мій партнерський ранг?',
    a: 'Ранг завжди визначається виключно кількістю ваших власних активних платних рефералів 1-го рівня (L1). Реферали 2-го рівня (L2) не впливають на підвищення рангу.'
  },
  {
    q: 'Чому на ранзі Starter винагорода з L2 становить 0%?',
    a: 'Новий партнер на рівні Starter (1–9 платних L1) заробляє 5% тільки з людей, яких запросив особисто. Як тільки ви залучаєте 10 активних платних L1, ви переходите у Bronze, де автоматично відкривається 10% винагороди з 2-го рівня (L2).'
  },
  {
    q: 'Яка максимальна сумарна виплата з однієї транзакції?',
    a: 'Максимальна стандартна виплата системи з однієї транзакції становить 50%: 25% отримує прямий спонсор (L1), і 25% отримує спонсор другого рівня (L2) на ранзі Platinum.'
  },
  {
    q: 'Коли та як нараховуються виплати?',
    a: 'Нарахування відбуваються миттєво після кожної успішної оплати підписки за вашим посиланням. Виплати здійснюються щотижня або щоденно (для Gold/Platinum) на банківську картку (IBAN/UAH) або USDT TRC-20.'
  },
  {
    q: 'Що вважається «активним платним L1»?',
    a: 'Користувач, який зареєструвався за вашим особистим реферальним посиланням та має діючу активну платну підписку SirenUA Pro.'
  }
];

export const SAMPLE_PARTNER_TREE: AffiliatePartnerNode[] = [
  {
    id: 'USR-L1-01',
    name: 'Олександр Коваленко',
    level: 'L1',
    joinDate: '12 Січ 2026',
    plan: 'SirenUA Pro Річний',
    planPrice: 2400,
    status: 'ACTIVE',
    l2ChildrenCount: 5,
    totalEarnedFromNode: 1440
  },
  {
    id: 'USR-L2-01A',
    name: 'Марія Васильченко',
    level: 'L2',
    parentId: 'USR-L1-01',
    parentName: 'Олександр Коваленко',
    joinDate: '18 Січ 2026',
    plan: 'SirenUA Pro Місячний',
    planPrice: 200,
    status: 'ACTIVE',
    totalEarnedFromNode: 120
  },
  {
    id: 'USR-L2-01B',
    name: 'Сергій Бондар',
    level: 'L2',
    parentId: 'USR-L1-01',
    parentName: 'Олександр Коваленко',
    joinDate: '24 Січ 2026',
    plan: 'SirenUA Pro Річний',
    planPrice: 2400,
    status: 'ACTIVE',
    totalEarnedFromNode: 480
  },
  {
    id: 'USR-L1-02',
    name: 'Ігор Стельмах',
    level: 'L1',
    joinDate: '02 Лют 2026',
    plan: 'SirenUA Pro Місячний',
    planPrice: 200,
    status: 'ACTIVE',
    l2ChildrenCount: 8,
    totalEarnedFromNode: 680
  },
  {
    id: 'USR-L2-02A',
    name: 'Тарас Павленко',
    level: 'L2',
    parentId: 'USR-L1-02',
    parentName: 'Ігор Стельмах',
    joinDate: '10 Лют 2026',
    plan: 'SirenUA Pro Річний',
    planPrice: 2400,
    status: 'ACTIVE',
    totalEarnedFromNode: 360
  },
  {
    id: 'USR-L2-02B',
    name: 'Анастасія Литвин',
    level: 'L2',
    parentId: 'USR-L1-02',
    parentName: 'Ігор Стельмах',
    joinDate: '15 Лют 2026',
    plan: 'SirenUA Pro Місячний',
    planPrice: 200,
    status: 'ACTIVE',
    totalEarnedFromNode: 80
  },
  {
    id: 'USR-L1-03',
    name: 'Олена Дмитрук',
    level: 'L1',
    joinDate: '14 Лют 2026',
    plan: 'SirenUA Pro Місячний',
    planPrice: 200,
    status: 'ACTIVE',
    l2ChildrenCount: 2,
    totalEarnedFromNode: 260
  },
  {
    id: 'USR-L1-04',
    name: 'Дмитро Мельник',
    level: 'L1',
    joinDate: '20 Лют 2026',
    plan: 'SirenUA Pro Річний',
    planPrice: 2400,
    status: 'ACTIVE',
    l2ChildrenCount: 3,
    totalEarnedFromNode: 820
  },
  {
    id: 'USR-L1-05',
    name: 'Андрій Кравчук',
    level: 'L1',
    joinDate: '28 Лют 2026',
    plan: 'SirenUA Pro 3 Місяці',
    planPrice: 600,
    status: 'ACTIVE',
    l2ChildrenCount: 1,
    totalEarnedFromNode: 180
  }
];

export const SAMPLE_PAYOUT_HISTORY: AffiliatePayoutRequest[] = [
  {
    id: 'PAY-8831',
    amount: 5400,
    currency: 'UAH',
    method: 'MONOBANK',
    targetAccount: '•••• 4419 (Monobank Black)',
    date: '01 Бер 2026, 11:30',
    status: 'COMPLETED'
  },
  {
    id: 'PAY-8720',
    amount: 12800,
    currency: 'UAH',
    method: 'IBAN',
    targetAccount: 'UA893052990000026007812903112',
    date: '15 Лют 2026, 16:45',
    status: 'COMPLETED'
  },
  {
    id: 'PAY-8611',
    amount: 250,
    currency: 'USDT',
    method: 'USDT_TRC20',
    targetAccount: 'TX9...zK4 (TRC-20)',
    date: '01 Лют 2026, 09:15',
    status: 'COMPLETED'
  }
];

export const AFFILIATE_PROMO_TEMPLATES: AffiliatePromoTemplate[] = [
  {
    id: 'PROMO-TG-1',
    title: 'Пост для новинного Telegram-каналу',
    platform: 'Telegram',
    text: '🚨 Надійний моніторинг повітряних загроз в Україні з миттєвим сповіщенням!\n\nSirenUA Pro надає карту тривог, траєкторії дронів/ракет у реальному часі та навігацію до найближчого укриття.\n\n👉 Підключайтеся за посиланням: https://sirenua.com/ref/partner_link',
    tags: ['#Тривога', '#Безпека', '#SirenUA', '#Укриття', '#Україна']
  },
  {
    id: 'PROMO-INSTA-1',
    title: 'Сторіз / Ріліс для Instagram',
    platform: 'Instagram / Facebook',
    text: 'Завжди знайте точну траєкторію небезпеки у вашому місті. SirenUA Pro — сучасний цифровий щит та супутникова карта загроз України. Посилання в шапці профілю 🇺🇦',
    tags: ['#SirenUA', '#UkraineSafety', '#DigitalShield', '#SafeAir']
  },
  {
    id: 'PROMO-TW-1',
    title: 'Тред або пост для X (Twitter)',
    platform: 'Twitter / X',
    text: 'Моніторинг загроз нового покоління: Digital Twin простору над Україною, аналіз векторів підльоту та автоматична локація укриттів. Використовуйте SirenUA Pro: https://sirenua.com/ref/partner_link',
    tags: ['#OSINT', '#UkraineWar', '#AirAlerts', '#SirenUA']
  }
];

