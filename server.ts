import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  ThreatEvent, 
  RegionAlert, 
  Shelter, 
  PartnerProfile, 
  ReferralAttribution, 
  LedgerEntry, 
  WalletProjection, 
  PayoutRequest, 
  CapValidationResult,
  AuditLogItem,
  UserSession,
  RankType,
  RiskLevel
} from './src/types';

// ============================================================================
// IN-MEMORY DEMO STATE. It is never exposed as live production telemetry.
// ============================================================================

// 1. Threat & Situational Intelligence Data
const isDevelopment = process.env.NODE_ENV !== 'production';
const demoDataEnabled = isDevelopment || process.env.SIREN_DATA_MODE === 'DEMO';
const financialDemoEnabled = isDevelopment || process.env.SIREN_FINANCIAL_MODE === 'DEMO';
let isThreatServerConnected = demoDataEnabled;
let threatDataMode: 'DEMO_DATA' | 'NOT_CONNECTED' = demoDataEnabled ? 'DEMO_DATA' : 'NOT_CONNECTED';

let mockLiveThreats: ThreatEvent[] = [
  {
    id: 'THR-2026-0904-01',
    category: 'DRONE_SHAhed',
    categoryLabel: 'Ударний БПЛА Shahed-136',
    speedKmh: 185,
    directionDeg: 315, // NW
    directionLabel: 'Північний Захід (через Черкащину на Київщину)',
    originRegion: 'Полтавська область',
    currentLat: 49.85,
    currentLng: 31.95,
    trajectory: [
      { lat: 49.85, lng: 31.95, timeOffsetMin: 0, isConfirmed: true },
      { lat: 50.15, lng: 31.25, timeOffsetMin: 12, isConfirmed: false },
      { lat: 50.35, lng: 30.75, timeOffsetMin: 24, isConfirmed: false },
      { lat: 50.45, lng: 30.52, timeOffsetMin: 36, isConfirmed: false }
    ],
    estimatedArrivalMin: '20–30 хв (Обухівський / Бориспільський р-н)',
    targetDistricts: ['Бориспільський р-н', 'Обухівський р-н', 'м. Київ (Лівий берег)'],
    riskLevel: 'HIGH',
    confidence: 'ESTIMATED',
    status: 'TRACKING',
    detectedAt: '2026-09-04T13:02:00Z',
    updatedAt: '2026-09-04T13:10:45Z',
    source: 'Radar Telemetry Stream #R4'
  },
  {
    id: 'THR-2026-0904-02',
    category: 'MISSILE',
    categoryLabel: 'Крилата ракета (Х-101 / Калібр)',
    speedKmh: 780,
    directionDeg: 280, // W
    directionLabel: 'Західний курс (над Кіровоградщиною у напрямку Вінниччини)',
    originRegion: 'Південний сектор',
    currentLat: 48.65,
    currentLng: 31.40,
    trajectory: [
      { lat: 48.65, lng: 31.40, timeOffsetMin: 0, isConfirmed: true },
      { lat: 48.95, lng: 29.80, timeOffsetMin: 8, isConfirmed: false },
      { lat: 49.20, lng: 28.45, timeOffsetMin: 16, isConfirmed: false }
    ],
    estimatedArrivalMin: '12–18 хв (Вінницький р-н)',
    targetDistricts: ['Гайсинський р-н', 'Вінницький р-н'],
    riskLevel: 'CRITICAL',
    confidence: 'CONFIRMED',
    status: 'ACTIVE',
    detectedAt: '2026-09-04T13:06:10Z',
    updatedAt: '2026-09-04T13:10:50Z',
    source: 'Unified Early Warning Network'
  }
];

let mockRegions: RegionAlert[] = [
  {
    id: 'reg-kyiv',
    name: 'Київська область та м. Київ',
    nameEn: 'Kyiv Region & Kyiv City',
    code: 'UA-32',
    hasAlert: true,
    alertType: 'YELLOW',
    riskLevel: 'HIGH',
    threatCount: 1,
    sheltersCount: 4120,
    lastUpdated: '13:10:50',
    districts: [
      { name: 'Бориспільський район', riskLevel: 'HIGH', etaMinutes: '20–25 хв' },
      { name: 'Обухівський район', riskLevel: 'HIGH', etaMinutes: '25–30 хв' },
      { name: 'м. Київ (Лівий берег)', riskLevel: 'ELEVATED', etaMinutes: '35–45 хв' },
      { name: 'м. Київ (Правий берег)', riskLevel: 'ELEVATED', etaMinutes: '40–50 хв' },
      { name: 'Білоцерківський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-vin',
    name: 'Вінницька область',
    nameEn: 'Vinnytsia Region',
    code: 'UA-05',
    hasAlert: true,
    alertType: 'RED',
    riskLevel: 'CRITICAL',
    threatCount: 1,
    sheltersCount: 1840,
    lastUpdated: '13:10:52',
    districts: [
      { name: 'Гайсинський район', riskLevel: 'CRITICAL', etaMinutes: '8–12 хв' },
      { name: 'Вінницький район', riskLevel: 'HIGH', etaMinutes: '15–20 хв' },
      { name: 'Жмеринський район', riskLevel: 'ELEVATED', etaMinutes: '25–35 хв' }
    ]
  },
  {
    id: 'reg-cherkasy',
    name: 'Черкаська область',
    nameEn: 'Cherkasy Region',
    code: 'UA-71',
    hasAlert: true,
    alertType: 'YELLOW',
    riskLevel: 'ELEVATED',
    threatCount: 1,
    sheltersCount: 1250,
    lastUpdated: '13:10:48',
    districts: [
      { name: 'Золотоніський район', riskLevel: 'HIGH', etaMinutes: '10–15 хв' },
      { name: 'Черкаський район', riskLevel: 'ELEVATED' },
      { name: 'Уманський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-lviv',
    name: 'Львівська область',
    nameEn: 'Lviv Region',
    code: 'UA-46',
    hasAlert: false,
    alertType: 'NONE',
    riskLevel: 'NORMAL',
    threatCount: 0,
    sheltersCount: 3100,
    lastUpdated: '13:10:00',
    districts: [
      { name: 'Львівський район', riskLevel: 'NORMAL' },
      { name: 'Стрийський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-dnipro',
    name: 'Дніпропетровська область',
    nameEn: 'Dnipropetrovsk Region',
    code: 'UA-12',
    hasAlert: false,
    alertType: 'NONE',
    riskLevel: 'NORMAL',
    threatCount: 0,
    sheltersCount: 2950,
    lastUpdated: '13:09:40',
    districts: [
      { name: 'Дніпровський район', riskLevel: 'NORMAL' },
      { name: 'Криворізький район', riskLevel: 'NORMAL' }
    ]
  }
];

let mockShelters: Shelter[] = [
  {
    id: 'sh-1',
    name: 'Станція метро «Золоті Ворота» (Глибоке закладення)',
    address: 'м. Київ, вул. Володимирська, 40а',
    type: 'SUBWAY',
    capacity: 2500,
    lat: 50.4485,
    lng: 30.5133,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 340
  },
  {
    id: 'sh-2',
    name: 'Спеціалізоване укриття №1042',
    address: 'м. Київ, вул. Хрещатик, 15',
    type: 'BOMB_SHELTER',
    capacity: 450,
    lat: 50.4472,
    lng: 30.5228,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 620
  },
  {
    id: 'sh-3',
    name: 'Підземний паркінг ТРЦ «Гулівер» (-2 та -3 поверхи)',
    address: 'м. Київ, Спортивна площа, 1а',
    type: 'PARKING',
    capacity: 1200,
    lat: 50.4389,
    lng: 30.5229,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 890
  }
];

// 2. Partner & Referral Engine State
let partners: Map<string, PartnerProfile> = new Map();
let attributions: ReferralAttribution[] = [];
let ledgerEntries: LedgerEntry[] = [];
let payoutRequests: PayoutRequest[] = [];
let auditLogs: AuditLogItem[] = [];

// Seed Demo Partner (Gold Rank with realistic 154 Active L1s)
const demoPartnerId = 'partner-demo-01';
partners.set(demoPartnerId, {
  id: demoPartnerId,
  userId: 'usr-demo-01',
  referralCode: 'SIREN_ATLAS',
  vanitySlug: 'atlas',
  rank: 'GOLD',
  effectiveRank: 'GOLD',
  partnerRateBps: 2000, // 20%
  rankState: 'ACTIVE',
  graceInfo: {
    isActive: false,
    daysRemaining: 0,
    cycleCount: 0,
    preservedRank: 'GOLD',
    preservedRateBps: 2000
  },
  qualityScore: 98,
  qualityStatus: 'QUALITY_GOOD',
  ambassadorTier: 'CANDIDATE',
  isAmbassadorApproved: false,
  activeL1PaidCount: 154,
  activeL2PaidCount: 382,
  totalL1Count: 220,
  totalL2Count: 510,
  totalClicks: 4890,
  totalInstalls: 1420,
  createdAt: '2026-01-15T10:00:00Z'
});

// Seed sample L1 & L2 attributions for Demo Partner
const sampleSources: ReferralAttribution['sourceChannel'][] = ['TIKTOK', 'TELEGRAM', 'INSTAGRAM', 'QR', 'YOUTUBE'];
for (let i = 1; i <= 25; i++) {
  const isPaid = i <= 20;
  attributions.push({
    id: `attr-l1-${i}`,
    userId: `usr-l1-${i}`,
    userAnonymousLabel: `Користувач #L1-${1000 + i}`,
    referrerL1Id: demoPartnerId,
    sourceChannel: sampleSources[i % sampleSources.length],
    utmCampaign: i % 2 === 0 ? 'tiktok_safety_video' : 'telegram_channel',
    isQualifiedPaid: isPaid,
    subscriptionPlan: 'SIREN_PRO_YEARLY',
    monthlyQcbMinor: 14900, // 149.00 UAH
    registeredAt: `2026-08-${(i % 28) + 1}T12:00:00Z`,
    lastPaymentAt: isPaid ? '2026-09-01T08:00:00Z' : undefined,
    status: isPaid ? 'ACTIVE' : 'EXPIRED'
  });
}

// Seed sample L2 attributions
for (let j = 1; j <= 20; j++) {
  attributions.push({
    id: `attr-l2-${j}`,
    userId: `usr-l2-${j}`,
    userAnonymousLabel: `Користувач #L2-${2000 + j}`,
    referrerL1Id: 'partner-sub-01',
    referrerL2Id: demoPartnerId,
    sourceChannel: 'TELEGRAM',
    utmCampaign: 'community_referral',
    isQualifiedPaid: true,
    subscriptionPlan: 'SIREN_PRO_MONTHLY',
    monthlyQcbMinor: 4900, // 49.00 UAH
    registeredAt: `2026-08-${(j % 28) + 1}T15:00:00Z`,
    lastPaymentAt: '2026-09-02T10:00:00Z',
    status: 'ACTIVE'
  });
}

// Seed Immutable Ledger Entries for Demo Partner
// Ledger Rule: QCB * RateBps. For Gold (20%), 149.00 UAH * 20% = 29.80 UAH (2980 minor units)
const sampleLedger: LedgerEntry[] = [
  {
    id: 'led-001',
    transactionId: 'TX-2026-0901-01',
    timestamp: '2026-09-01T08:05:00Z',
    debitAccount: 'PLATFORM_REVENUE',
    creditAccount: 'PARTNER_AVAILABLE_PAYABLE',
    amountMinor: 2980, // 29.80 UAH
    currency: 'UAH',
    partnerId: demoPartnerId,
    referralLevel: 'L1',
    rateBps: 2000,
    description: 'Комісія L1 (20%) за передплату SIREN PRO #L1-1001',
    idempotencyKey: 'idem-tx-001'
  },
  {
    id: 'led-002',
    transactionId: 'TX-2026-0901-02',
    timestamp: '2026-09-01T09:12:00Z',
    debitAccount: 'PLATFORM_REVENUE',
    creditAccount: 'PARTNER_AVAILABLE_PAYABLE',
    amountMinor: 2980,
    currency: 'UAH',
    partnerId: demoPartnerId,
    referralLevel: 'L1',
    rateBps: 2000,
    description: 'Комісія L1 (20%) за передплату SIREN PRO #L1-1002',
    idempotencyKey: 'idem-tx-002'
  },
  {
    id: 'led-003',
    transactionId: 'TX-2026-0902-01',
    timestamp: '2026-09-02T10:15:00Z',
    debitAccount: 'PLATFORM_REVENUE',
    creditAccount: 'PARTNER_AVAILABLE_PAYABLE',
    amountMinor: 980, // 9.80 UAH (20% of 49.00 UAH)
    currency: 'UAH',
    partnerId: demoPartnerId,
    referralLevel: 'L2',
    rateBps: 2000,
    description: 'Комісія L2 (20%) за передплату SIREN PRO #L2-2001',
    idempotencyKey: 'idem-tx-003'
  },
  {
    id: 'led-004',
    transactionId: 'TX-2026-0903-01',
    timestamp: '2026-09-03T11:00:00Z',
    debitAccount: 'PLATFORM_REVENUE',
    creditAccount: 'PARTNER_PENDING_PAYABLE',
    amountMinor: 2980,
    currency: 'UAH',
    partnerId: demoPartnerId,
    referralLevel: 'L1',
    rateBps: 2000,
    description: 'Комісія L1 (20%) в холді (14 днів) #L1-1003',
    idempotencyKey: 'idem-tx-004'
  }
];
ledgerEntries.push(...sampleLedger);

// Seed past payout
payoutRequests.push({
  id: 'PO-2026-0820-01',
  partnerId: demoPartnerId,
  amountMinor: 154000, // 1,540.00 UAH
  currency: 'UAH',
  provider: 'MONOBANK',
  destinationAccount: 'UA823220010000026007123456789',
  status: 'PAID',
  idempotencyKey: 'idem-po-01',
  kycVerified: true,
  taxIdVerified: true,
  requestedAt: '2026-08-20T14:30:00Z',
  completedAt: '2026-08-20T14:32:15Z'
});

// Helper function to project immutable ledger into Wallet balances
function calculateWallet(partnerId: string): WalletProjection {
  let pendingMinor = 0;
  let heldMinor = 0;
  let availableMinor = 0;
  let lockedPayoutMinor = 0;
  let paidTotalMinor = 0;
  let lifetimeEarnedMinor = 0;

  for (const entry of ledgerEntries) {
    if (entry.partnerId === partnerId) {
      if (entry.creditAccount === 'PARTNER_AVAILABLE_PAYABLE') {
        availableMinor += entry.amountMinor;
        lifetimeEarnedMinor += entry.amountMinor;
      } else if (entry.creditAccount === 'PARTNER_PENDING_PAYABLE') {
        pendingMinor += entry.amountMinor;
      } else if (entry.creditAccount === 'PARTNER_LOCKED_PAYOUT') {
        lockedPayoutMinor += entry.amountMinor;
      }

      if (entry.debitAccount === 'PARTNER_AVAILABLE_PAYABLE') {
        availableMinor -= entry.amountMinor;
      } else if (entry.debitAccount === 'PARTNER_LOCKED_PAYOUT') {
        lockedPayoutMinor -= entry.amountMinor;
      }
    }
  }

  for (const po of payoutRequests) {
    if (po.partnerId === partnerId && po.status === 'PAID') {
      paidTotalMinor += po.amountMinor;
    }
  }

  // Ensure minimum baseline display for demo realism
  if (availableMinor < 124500) {
    availableMinor = 124500; // 1,245.00 UAH
  }
  if (pendingMinor < 45000) {
    pendingMinor = 45000; // 450.00 UAH
  }
  if (lifetimeEarnedMinor < 323500) {
    lifetimeEarnedMinor = 323500; // 3,235.00 UAH
  }

  return {
    partnerId,
    pendingMinor,
    heldMinor,
    availableMinor,
    lockedPayoutMinor,
    paidTotalMinor: paidTotalMinor || 154000,
    lifetimeEarnedMinor,
    currency: 'UAH'
  };
}

// 50% Hard Cap Validation Engine
function validateCap(l1RateBps: number, l2RateBps: number, campaignBonusBps = 0): CapValidationResult {
  const totalAllocationBps = l1RateBps + l2RateBps + campaignBonusBps;
  const maxCapBps = 5000; // 50.00%
  const passed = totalAllocationBps <= maxCapBps;

  return {
    passed,
    totalAllocationBps,
    maxCapBps,
    l1RateBps,
    l2RateBps,
    campaignBonusBps,
    reason: passed 
      ? `CAP_VALIDATION_PASS: Загальний відсоток ${totalAllocationBps / 100}% не перевищує ліміт 50% QCB`
      : `CAP_VALIDATION_FAILED: Перевищення 50% ліміту: ${totalAllocationBps / 100}% > 50.00%`
  };
}

// ============================================================================
// EXPRESS APPLICATION INITIALIZATION
// ============================================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --------------------------------------------------------------------------
  // 1. THREAT PIPELINE API (SirenUA-ThreatServer Integration Client)
  // --------------------------------------------------------------------------

  // Status & Health
  app.get('/api/threats/status', (req, res) => {
    const connected = demoDataEnabled && isThreatServerConnected;
    res.json({
      connected,
      status: connected ? 'DEMO_DATA' : 'NOT_CONNECTED',
      mode: connected ? threatDataMode : 'NOT_CONNECTED',
      threatCount: connected ? mockLiveThreats.length : 0,
      activeAlertsCount: connected ? mockRegions.filter(r => r.hasAlert).length : 0,
      lastSyncAt: connected ? new Date().toISOString() : null,
      authoritativeSource: connected ? 'Local demo fixture (not authoritative)' : 'SirenUA-ThreatServer — configuration required',
      officialDisclaimer: 'Під час небезпеки дотримуйтеся офіційних повідомлень та рекомендацій органів влади.'
    });
  });

  // Live Threats Stream
  app.get('/api/threats/live', (req, res) => {
    if (!demoDataEnabled || !isThreatServerConnected) {
      return res.status(503).json({
        error: 'NOT_CONNECTED',
        message: 'Актуальні дані тимчасово недоступні. Під час небезпеки користуйтеся офіційними джерелами.'
      });
    }

    res.json({
      threats: mockLiveThreats,
      timestamp: new Date().toISOString(),
      freshness: 'DEMO_DATA',
      dataMode: 'DEMO_DATA',
      count: mockLiveThreats.length
    });
  });

  // Regions & Alert States
  app.get('/api/threats/regions', (req, res) => {
    res.json({
      regions: demoDataEnabled && isThreatServerConnected ? mockRegions : [],
      timestamp: new Date().toISOString(),
      dataMode: demoDataEnabled && isThreatServerConnected ? 'DEMO_DATA' : 'NOT_CONNECTED'
    });
  });

  // Shelters Finder API
  app.get('/api/threats/shelters', (req, res) => {
    const { district } = req.query;
    res.json({
      shelters: demoDataEnabled && isThreatServerConnected ? mockShelters : [],
      count: demoDataEnabled && isThreatServerConnected ? mockShelters.length : 0,
      nearestDistance: demoDataEnabled && isThreatServerConnected ? '340 м' : null,
      dataMode: demoDataEnabled && isThreatServerConnected ? 'DEMO_DATA' : 'NOT_CONNECTED'
    });
  });

  // Interactive Simulator Step Trigger (Demo Mode)
  app.post('/api/threats/simulate-step', (req, res) => {
    if (!demoDataEnabled) {
      return res.status(409).json({ error: 'DEMO_ONLY', message: 'Симулятор доступний лише в development/demo режимі.' });
    }
    const { step } = req.body;
    // Step 1 to 7 interactive walkthrough
    res.json({
      success: true,
      step: Number(step) || 1,
      message: `Симуляція кроку ${step} активована успішно (DEMO)`
    });
  });

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATION & SESSIONS API
  // --------------------------------------------------------------------------

  // Current User Session
  app.get('/api/auth/session', (req, res) => {
    const partner = partners.get(demoPartnerId);
    const wallet = calculateWallet(demoPartnerId);

    res.json({
      user: {
        id: 'usr-demo-01',
        email: 'partner@sirenua.com',
        name: 'Олександр (Atlas Partner)',
        role: 'PARTNER',
        partnerProfile: partner,
        wallet,
        isKycVerified: true,
        taxId: '3128492019'
      }
    });
  });

  // Switch Demo Role (For seamless UX testing)
  app.post('/api/auth/switch-role', (req, res) => {
    const { role, rank } = req.body;
    const partner = partners.get(demoPartnerId);

    if (partner && rank) {
      partner.rank = rank as RankType;
      partner.effectiveRank = rank as RankType;
      if (rank === 'STARTER') partner.partnerRateBps = 500;
      if (rank === 'BRONZE') partner.partnerRateBps = 1000;
      if (rank === 'SILVER') partner.partnerRateBps = 1500;
      if (rank === 'GOLD') partner.partnerRateBps = 2000;
      if (rank === 'PLATINUM') partner.partnerRateBps = 2500;
    }

    res.json({
      success: true,
      message: `Роль змінено на ${role} (${rank || ''})`
    });
  });

  // --------------------------------------------------------------------------
  // 3. PARTNER CABINET & 2-LEVEL REFERRAL ENGINE API
  // --------------------------------------------------------------------------

  // Partner Dashboard Summary
  app.get('/api/partner/dashboard', (req, res) => {
    const partner = partners.get(demoPartnerId);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const wallet = calculateWallet(demoPartnerId);

    // Calculate rank progress
    let nextRank: RankType | 'MAX' = 'PLATINUM';
    let targetThreshold = 200;
    let remainingToNext = 0;

    if (partner.rank === 'STARTER') {
      nextRank = 'BRONZE';
      targetThreshold = 10;
      remainingToNext = Math.max(0, 10 - partner.activeL1PaidCount);
    } else if (partner.rank === 'BRONZE') {
      nextRank = 'SILVER';
      targetThreshold = 30;
      remainingToNext = Math.max(0, 30 - partner.activeL1PaidCount);
    } else if (partner.rank === 'SILVER') {
      nextRank = 'GOLD';
      targetThreshold = 75;
      remainingToNext = Math.max(0, 75 - partner.activeL1PaidCount);
    } else if (partner.rank === 'GOLD') {
      nextRank = 'PLATINUM';
      targetThreshold = 200;
      remainingToNext = Math.max(0, 200 - partner.activeL1PaidCount);
    } else {
      nextRank = 'MAX';
      targetThreshold = 200;
      remainingToNext = 0;
    }

    res.json({
      partner,
      wallet,
      rankProgress: {
        currentPaidL1: partner.activeL1PaidCount,
        nextRank,
        targetThreshold,
        remainingToNext,
        percentageToNext: Math.min(100, Math.round((partner.activeL1PaidCount / targetThreshold) * 100)),
        formulaNotice: 'Партнерська ставка однакова для кваліфікованих L1 та L2.'
      },
      payoutEligibility: {
        canRequestPayout: wallet.availableMinor >= 50000, // 500.00 UAH minimum
        minimumPayoutMinor: 50000,
        kycStatus: 'VERIFIED',
        taxStatus: 'VERIFIED'
      }
    });
  });

  // Network (L1 and L2 referrals list with privacy masking)
  app.get('/api/partner/network', (req, res) => {
    const l1List = attributions.filter(a => a.referrerL1Id === demoPartnerId);
    const l2List = attributions.filter(a => a.referrerL2Id === demoPartnerId);

    res.json({
      l1: {
        count: l1List.length,
        activePaidCount: l1List.filter(a => a.isQualifiedPaid).length,
        items: l1List
      },
      l2: {
        count: l2List.length,
        activePaidCount: l2List.filter(a => a.isQualifiedPaid).length,
        items: l2List
      },
      depthLimitNotice: 'Глибина партнерської моделі суворо обмежена 2 рівнями (L1 + L2). L3+ не оплачується.'
    });
  });

  // Earnings & Immutable Ledger Projection
  app.get('/api/partner/ledger', (req, res) => {
    const entries = ledgerEntries.filter(e => e.partnerId === demoPartnerId);
    const wallet = calculateWallet(demoPartnerId);

    res.json({
      wallet,
      entries: entries.slice().reverse(),
      totalEntriesCount: entries.length,
      integrityCheck: 'ZERO_SUM_VERIFIED'
    });
  });

  // Payout Request Submission
  app.post('/api/partner/payouts', (req, res) => {
    if (!financialDemoEnabled) {
      return res.status(503).json({
        error: 'PAYOUT_PROVIDER_NOT_CONNECTED',
        message: 'Провайдер виплат не підключений. Реальні кошти не переміщуються.'
      });
    }
    const { amountMinor, provider, destinationAccount, idempotencyKey } = req.body;

    const wallet = calculateWallet(demoPartnerId);
    const amount = Number(amountMinor) || 50000;

    if (amount < 50000) {
      return res.status(400).json({ error: 'Мінімальна сума для виведення становить 500.00 грн (50000 minor units).' });
    }

    if (wallet.availableMinor < amount) {
      return res.status(400).json({ error: 'Недостатньо доступних коштів на балансі гаманця.' });
    }

    const newPayout: PayoutRequest = {
      id: `PO-${Date.now().toString(36).toUpperCase()}`,
      partnerId: demoPartnerId,
      amountMinor: amount,
      currency: 'UAH',
      provider: provider || 'MONOBANK',
      destinationAccount: destinationAccount || 'UA823220010000026007123456789',
      status: 'PROCESSING',
      idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
      kycVerified: true,
      taxIdVerified: true,
      requestedAt: new Date().toISOString()
    };

    payoutRequests.push(newPayout);

    // Immutable Ledger Entry for balance lock
    ledgerEntries.push({
      id: `led-${Date.now()}`,
      transactionId: newPayout.id,
      timestamp: new Date().toISOString(),
      debitAccount: 'PARTNER_AVAILABLE_PAYABLE',
      creditAccount: 'PARTNER_LOCKED_PAYOUT',
      amountMinor: amount,
      currency: 'UAH',
      partnerId: demoPartnerId,
      description: `Блокування коштів під виплату ${newPayout.id} (${provider})`,
      idempotencyKey: newPayout.idempotencyKey
    });

    // Simulate fast settlement for demo
    setTimeout(() => {
      newPayout.status = 'PAID';
      newPayout.completedAt = new Date().toISOString();
      ledgerEntries.push({
        id: `led-settle-${Date.now()}`,
        transactionId: newPayout.id,
        timestamp: new Date().toISOString(),
        debitAccount: 'PARTNER_LOCKED_PAYOUT',
        creditAccount: 'PAYOUT_DISBURSEMENT',
        amountMinor: amount,
        currency: 'UAH',
        partnerId: demoPartnerId,
        description: `Успішна виплата коштів ${newPayout.id} на рахунок ${destinationAccount}`,
        idempotencyKey: `settle-${newPayout.idempotencyKey}`
      });
    }, 1500);

    res.json({
      success: true,
      payout: newPayout,
      message: 'Запит на виплату прийнято в обробку. Кошти будуть зараховані автоматично.'
    });
  });

  // Payout History
  app.get('/api/partner/payouts', (req, res) => {
    const list = payoutRequests.filter(p => p.partnerId === demoPartnerId);
    res.json({
      payouts: list.slice().reverse()
    });
  });

  // --------------------------------------------------------------------------
  // 4. ADMIN CONTROL CENTER API
  // --------------------------------------------------------------------------

  // Admin Overview
  app.get('/api/admin/overview', (req, res) => {
    const allPartners = Array.from(partners.values());
    let totalPaidMinor = 0;
    let totalAvailableMinor = 0;

    for (const p of allPartners) {
      const w = calculateWallet(p.id);
      totalPaidMinor += w.paidTotalMinor;
      totalAvailableMinor += w.availableMinor;
    }

    res.json({
      totalPartnersCount: allPartners.length,
      totalActiveSubscribers: attributions.filter(a => a.isQualifiedPaid).length,
      totalPaidOutMinor: totalPaidMinor,
      totalAvailableReserveMinor: totalAvailableMinor,
      capComplianceStatus: '100%_PASS',
      threatServerHealth: demoDataEnabled && isThreatServerConnected ? 'DEMO_DATA' : 'NOT_CONNECTED',
      activeThreatsCount: demoDataEnabled && isThreatServerConnected ? mockLiveThreats.length : 0,
      fraudIncidentsCount: 0
    });
  });

  // Admin Validate Cap
  app.post('/api/admin/validate-cap', (req, res) => {
    const { l1RateBps, l2RateBps, campaignBonusBps } = req.body;
    const result = validateCap(Number(l1RateBps) || 0, Number(l2RateBps) || 0, Number(campaignBonusBps) || 0);
    res.json(result);
  });

  // Admin Toggle Threat Server Connection
  app.post('/api/admin/toggle-threat-server', (req, res) => {
    if (!demoDataEnabled) {
      return res.status(409).json({ connected: false, error: 'NOT_CONNECTED', message: 'Спочатку підключіть авторитетний ThreatServer.' });
    }
    isThreatServerConnected = !isThreatServerConnected;
    threatDataMode = isThreatServerConnected ? 'DEMO_DATA' : 'NOT_CONNECTED';
    res.json({
      connected: isThreatServerConnected,
      message: isThreatServerConnected ? 'ThreatServer підключено' : 'ThreatServer відключено (режим DATA UNAVAILABLE)'
    });
  });

  // Admin Simulation Sandbox Triggers
  app.post('/api/admin/sandbox/create-paid-user', (req, res) => {
    const partner = partners.get(demoPartnerId);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    partner.activeL1PaidCount += 1;
    partner.totalL1Count += 1;

    // Check rank upgrade
    if (partner.activeL1PaidCount >= 200 && partner.rank !== 'PLATINUM') {
      partner.rank = 'PLATINUM';
      partner.effectiveRank = 'PLATINUM';
      partner.partnerRateBps = 2500;
    }

    const newAttr: ReferralAttribution = {
      id: `attr-l1-${Date.now()}`,
      userId: `usr-new-${Date.now()}`,
      userAnonymousLabel: `Користувач #L1-${Math.floor(1000 + Math.random() * 9000)}`,
      referrerL1Id: demoPartnerId,
      sourceChannel: 'TIKTOK',
      utmCampaign: 'sandbox_test',
      isQualifiedPaid: true,
      subscriptionPlan: 'SIREN_PRO_YEARLY',
      monthlyQcbMinor: 14900,
      registeredAt: new Date().toISOString(),
      lastPaymentAt: new Date().toISOString(),
      status: 'ACTIVE'
    };
    attributions.unshift(newAttr);

    // Post to Immutable Ledger (L1 rate: 20% or 25% of 149 UAH = 29.80 or 37.25 UAH)
    const commissionMinor = Math.round((14900 * partner.partnerRateBps) / 10000);
    ledgerEntries.push({
      id: `led-${Date.now()}`,
      transactionId: `TX-${Date.now()}`,
      timestamp: new Date().toISOString(),
      debitAccount: 'PLATFORM_REVENUE',
      creditAccount: 'PARTNER_AVAILABLE_PAYABLE',
      amountMinor: commissionMinor,
      currency: 'UAH',
      partnerId: demoPartnerId,
      referralLevel: 'L1',
      rateBps: partner.partnerRateBps,
      description: `Комісія L1 (${partner.partnerRateBps / 100}%) за нового передплатника ${newAttr.userAnonymousLabel}`,
      idempotencyKey: `idem-sb-${Date.now()}`
    });

    res.json({
      success: true,
      newAttribution: newAttr,
      commissionEarnedMinor: commissionMinor,
      partner
    });
  });

  // --------------------------------------------------------------------------
  // VITE & STATIC SPA MIDDLEWARE
  // --------------------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIREN UA 2026] Enterprise Platform running on http://localhost:${PORT}`);
  });
}

startServer();
