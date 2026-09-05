import express from 'express';
import { randomUUID } from 'node:crypto';
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
  AuditLogItem,
  UserSession,
  RankType,
  RiskLevel
} from './src/types';
import {
  NotConnectedPayoutProvider,
  percentHalfUp,
  validateAllocationCap,
  verifyWebhookSignature,
  type SubscriptionTransitionEvent
} from './src/domain/partnerPlatform';
import { createPostgresBoundary, DatabaseRuntimeStatus } from './src/server/postgresBoundary';
import { createOidcIdentityVerifier, IdentityRole } from './src/server/identityBoundary';
import { PostgresPartnerRepository } from './src/server/postgresPartnerRepository';
import { FinancialRuleRepository } from './src/server/financialRuleRepository';
import { SubscriptionRepository } from './src/server/subscriptionRepository';
import { PartnerEngagementRepository } from './src/server/partnerEngagementRepository';
import { AdminRepository } from './src/server/adminRepository';
import { AutoPayoutRepository } from './src/server/autoPayoutRepository';
import { PayoutRepository } from './src/server/payoutRepository';

// ============================================================================
// IN-MEMORY DEMO STATE. It is never exposed as live production telemetry.
// ============================================================================

// 1. Threat & Situational Intelligence Data
const isDevelopment = process.env.NODE_ENV === 'development';
const isProductionLike = !isDevelopment;
// Development defaults to fixtures for local UI work, but an explicit
// NOT_CONNECTED mode must always be respected so disconnected behavior can be
// tested locally before deployment.
// Synthetic fixtures are a development-only aid. An explicit DEMO flag must
// never be able to turn fake safety or financial data on in production.
const demoDataEnabled = isDevelopment && (!process.env.SIREN_DATA_MODE || process.env.SIREN_DATA_MODE === 'DEMO_DATA');
const financialDemoEnabled = isDevelopment && (!process.env.SIREN_FINANCIAL_MODE || process.env.SIREN_FINANCIAL_MODE === 'DEMO_DATA');
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
let sandboxSequence = 0;
const payoutProvider = new NotConnectedPayoutProvider();
let databaseRuntimeStatus: DatabaseRuntimeStatus = 'NOT_CONFIGURED';

type ConfigurationState = 'CONFIGURED' | 'NOT_CONFIGURED';

function hasConfiguration(...keys: string[]): ConfigurationState {
  return keys.every((key) => typeof process.env[key] === 'string' && process.env[key]!.trim().length > 0) ? 'CONFIGURED' : 'NOT_CONFIGURED';
}

function integrationConfiguration(): Record<'threatServer' | 'identity' | 'database' | 'queue' | 'billing' | 'fx' | 'kyc' | 'payout', ConfigurationState> {
  return {
    threatServer: hasConfiguration('THREAT_SERVER_URL', 'THREAT_SERVER_AUTH_SECRET'),
    identity: hasConfiguration('IDENTITY_ISSUER_URL', 'IDENTITY_AUDIENCE', 'IDENTITY_JWKS_URL', 'SESSION_SECRET', 'PII_ENCRYPTION_KEY'),
    database: hasConfiguration('DATABASE_URL'),
    queue: hasConfiguration('QUEUE_URL'),
    billing: hasConfiguration('PAYMENT_PROVIDER', 'PAYMENT_WEBHOOK_SECRET'),
    fx: hasConfiguration('FX_PROVIDER', 'FX_PROVIDER_API_KEY'),
    kyc: hasConfiguration('KYC_PROVIDER', 'KYC_PROVIDER_API_KEY'),
    payout: hasConfiguration('PAYOUT_PROVIDER', 'PAYOUT_PROVIDER_API_KEY', 'PAYOUT_WEBHOOK_SECRET')
  };
}

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
      const isPartnerEarningCredit = entry.creditAccount === 'PARTNER_PENDING_PAYABLE'
        || entry.creditAccount === 'PARTNER_AVAILABLE_PAYABLE'
        || entry.creditAccount === 'PARTNER_LOCKED_PAYOUT';
      if (entry.creditAccount === 'PARTNER_AVAILABLE_PAYABLE') {
        availableMinor += entry.amountMinor;
      } else if (entry.creditAccount === 'PARTNER_PENDING_PAYABLE') {
        pendingMinor += entry.amountMinor;
      } else if (entry.creditAccount === 'PARTNER_LOCKED_PAYOUT') {
        lockedPayoutMinor += entry.amountMinor;
      }
      if (isPartnerEarningCredit) lifetimeEarnedMinor += entry.amountMinor;

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

  return {
    partnerId,
    pendingMinor,
    heldMinor,
    availableMinor,
    lockedPayoutMinor,
    paidTotalMinor,
    lifetimeEarnedMinor,
    currency: 'UAH'
  };
}

function maskSensitiveDestination(value: string): string {
  const normalized = value.replace(/\s+/g, '');
  return normalized.length >= 4 ? `•••• ${normalized.slice(-4)}` : '••••';
}

function configuredPublicOrigin(req: express.Request): string | null {
  const configured = (process.env.SIREN_PUBLIC_ORIGIN ?? process.env.APP_URL ?? '').trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return parsed.origin;
    } catch {
      return null;
    }
  }
  // Host-derived URLs are acceptable only for local demo links. Production
  // must supply an allowlisted canonical origin to prevent host-header link
  // injection in referral messages and QR codes.
  if (isProductionLike) return null;
  const host = req.get('host');
  return host ? `${req.protocol}://${host}` : null;
}

function normalizeCampaignToken(value: unknown, fallback?: string): string | null {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[^A-Za-z0-9._~-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized.length >= 1 && normalized.length <= 64 ? normalized : null;
}

function readReferralContext(req: express.Request): Record<string, string> {
  const context: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const value = normalizeCampaignToken(req.query[key]);
    if (value) context[key] = value;
  }
  return context;
}

function parseNormalizedPayoutWebhook(value: unknown): {
  payoutId: string;
  providerPayoutId: string;
  status: 'PAID' | 'FAILED';
  occurredAt: string;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_PAYOUT_WEBHOOK');
  const payload = value as Record<string, unknown>;
  const required = (field: string): string => {
    const item = payload[field];
    if (typeof item !== 'string' || item.trim().length === 0 || item.length > 256) throw new Error(`INVALID_PAYOUT_WEBHOOK:${field}`);
    return item.trim();
  };
  const status = payload.status;
  if (status !== 'PAID' && status !== 'FAILED') throw new Error('INVALID_PAYOUT_WEBHOOK:status');
  const occurredAt = required('occurredAt');
  if (!Number.isFinite(new Date(occurredAt).getTime())) throw new Error('INVALID_PAYOUT_WEBHOOK:occurredAt');
  return {
    payoutId: required('payoutId'),
    providerPayoutId: required('providerPayoutId'),
    status,
    occurredAt: new Date(occurredAt).toISOString()
  };
}

function webhookToleranceSeconds(): number {
  const configured = Number.parseInt(process.env.PAYOUT_WEBHOOK_TOLERANCE_SECONDS ?? '300', 10);
  return Number.isInteger(configured) && configured >= 0 && configured <= 900 ? configured : 300;
}

function parseNormalizedSubscriptionWebhook(value: unknown): {
  subscriptionId: string;
  event: SubscriptionTransitionEvent;
  occurredAt: string;
  providerSubscriptionId?: string;
  billingConsentAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SUBSCRIPTION_WEBHOOK');
  const payload = value as Record<string, unknown>;
  const required = (field: string): string => {
    const item = payload[field];
    if (typeof item !== 'string' || item.trim().length === 0 || item.length > 256) throw new Error(`INVALID_SUBSCRIPTION_WEBHOOK:${field}`);
    return item.trim();
  };
  const events: readonly SubscriptionTransitionEvent[] = [
    'TRIAL_STARTED', 'TRIAL_ENDING', 'TRIAL_EXPIRED', 'PAYMENT_REQUESTED', 'PAYMENT_SUCCEEDED',
    'PAYMENT_FAILED', 'SUBSCRIPTION_PAST_DUE', 'SUBSCRIPTION_GRACE', 'CANCEL_AT_PERIOD_END',
    'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_REFUNDED', 'SUBSCRIPTION_SUSPENDED',
    'SUBSCRIPTION_RESTORED'
  ];
  const event = payload.event;
  if (typeof event !== 'string' || !events.includes(event as SubscriptionTransitionEvent)) throw new Error('INVALID_SUBSCRIPTION_WEBHOOK:event');
  const optionalDate = (field: string): string | undefined => {
    if (payload[field] === undefined || payload[field] === null) return undefined;
    const valueForDate = required(field);
    if (!Number.isFinite(new Date(valueForDate).getTime())) throw new Error(`INVALID_SUBSCRIPTION_WEBHOOK:${field}`);
    return new Date(valueForDate).toISOString();
  };
  const occurredAt = required('occurredAt');
  if (!Number.isFinite(new Date(occurredAt).getTime())) throw new Error('INVALID_SUBSCRIPTION_WEBHOOK:occurredAt');
  return {
    subscriptionId: required('subscriptionId'),
    event: event as SubscriptionTransitionEvent,
    occurredAt: new Date(occurredAt).toISOString(),
    providerSubscriptionId: payload.providerSubscriptionId === undefined ? undefined : required('providerSubscriptionId'),
    billingConsentAt: optionalDate('billingConsentAt'),
    currentPeriodStart: optionalDate('currentPeriodStart'),
    currentPeriodEnd: optionalDate('currentPeriodEnd')
  };
}

async function transitionFinancialRule(
  req: express.Request,
  res: express.Response,
  repository: FinancialRuleRepository,
  action: 'VALIDATE' | 'APPROVE' | 'SCHEDULE',
  effectiveFrom?: unknown
) {
  if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailableResponse(res);
  const principal = res.locals.principal as { subject?: unknown } | undefined;
  if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
  try {
    const version = typeof req.params.version === 'string' ? req.params.version : '';
    return res.json({ rule: await repository.transition(version, action, principal.subject, typeof effectiveFrom === 'string' ? effectiveFrom : undefined) });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'FINANCIAL_RULE_TRANSITION_FAILED';
    const status = code === 'FINANCIAL_RULE_NOT_FOUND' ? 404 : code === 'INVALID_FINANCIAL_RULE_TRANSITION' || code === 'MAKER_CHECKER_REQUIRED' || code === 'INVALID_RULE_VALUE:effective_from' ? 409 : 503;
    return res.status(status).json({ error: code, message: 'Не вдалося змінити стан financial rule.' });
  }
}

function financialUnavailableResponse(res: express.Response) {
  return res.status(503).json({
    error: 'FINANCIAL_DATA_NOT_CONNECTED',
    status: 'NOT_CONNECTED',
    message: 'Фінансові дані, автентифікація та partner provider ще не підключені.'
  });
}

// ============================================================================
// EXPRESS APPLICATION INITIALIZATION
// ============================================================================

async function startServer() {
  const app = express();
  const database = createPostgresBoundary();
  const identityVerifier = createOidcIdentityVerifier();
  const partnerRepository = new PostgresPartnerRepository(database);
  const financialRuleRepository = new FinancialRuleRepository(database);
  const subscriptionRepository = new SubscriptionRepository(database);
  const partnerEngagementRepository = new PartnerEngagementRepository(database);
  const adminRepository = new AdminRepository(database);
  const autoPayoutRepository = new AutoPayoutRepository(database);
  const payoutRepository = new PayoutRepository(database);
  databaseRuntimeStatus = database.status();
  if (database.configured) await database.probe();
  databaseRuntimeStatus = database.status();
  const configuredPort = Number.parseInt(process.env.PORT ?? '3000', 10);
  if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const PORT = configuredPort;

  app.disable('x-powered-by');
  app.use(express.json({
    limit: '100kb',
    verify: (req, _res, buffer) => {
      (req as express.Request & { rawBody?: string }).rawBody = buffer.toString('utf8');
    }
  }));
  app.use((_req, res, next) => {
    const suppliedRequestId = _req.get('x-request-id');
    const requestId = suppliedRequestId && /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    if (isProductionLike) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; media-src 'self'");
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    }
    if (_req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    next();
  });

  const financialUnavailable = (res: express.Response) => res.status(503).json({
    error: 'FINANCIAL_DATA_NOT_CONNECTED',
    status: 'NOT_CONNECTED',
    message: 'Фінансові дані, автентифікація та partner provider ще не підключені.'
  });

  const requireRoles = (...roles: IdentityRole[]) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Demo fixtures are only enabled in development. This bypass cannot be
    // activated by a production environment variable.
    if (financialDemoEnabled) return next();
    // Preserve the existing dependency boundary while identity is absent; a
    // configured identity provider is required before any production handler
    // can inspect partner/admin state.
    if (identityVerifier.status() !== 'CONFIGURED') return next();
    try {
      const principal = await identityVerifier.authenticate(req.get('authorization'));
      if (roles.length && !roles.some((role) => principal.roles.includes(role))) {
        return res.status(403).json({ error: 'IDENTITY_FORBIDDEN', status: 'FORBIDDEN', message: 'Недостатньо прав для цього ресурсу.' });
      }
      res.locals.principal = principal;
      return next();
    } catch (error) {
      const code = error instanceof Error ? error.message : 'IDENTITY_UNAUTHORIZED';
      return res.status(code === 'IDENTITY_FORBIDDEN' ? 403 : 401).json({
        error: code,
        status: code === 'IDENTITY_FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHORIZED',
        message: code === 'IDENTITY_FORBIDDEN' ? 'Недостатньо прав для цього ресурсу.' : 'Потрібен дійсний bearer token.'
      });
    }
  };

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      threatDataMode,
      financialDataMode: financialDemoEnabled ? 'DEMO_DATA' : 'NOT_CONNECTED',
      payoutProvider: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED',
      integrationConfiguration: integrationConfiguration()
    });
  });

  app.get('/api/ready', (_req, res) => {
    const checks: Record<'threatData' | 'financialData' | 'payoutProvider' | 'database', string> = {
      threatData: isThreatServerConnected ? threatDataMode : 'NOT_CONNECTED',
      financialData: financialDemoEnabled ? 'DEMO_DATA' : 'NOT_CONNECTED',
      payoutProvider: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED',
      database: databaseRuntimeStatus
    };
    const configuration = integrationConfiguration();
    const ready = checks.threatData === 'LIVE'
      && checks.financialData === 'CONNECTED'
      && checks.payoutProvider === 'CONNECTED'
      && checks.database === 'CONNECTED'
      && Object.values(configuration).every((state) => state === 'CONFIGURED');
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks,
      configuration,
      runtime: { database: databaseRuntimeStatus },
      message: ready ? 'Production dependencies are connected.' : 'Потрібні production-інтеграції ще не підключені.'
    });
  });

  // Provider adapters must normalize their provider-specific payload to this
  // small envelope before calling the durable settlement boundary. The raw
  // request body is signed and retained; parsed/re-serialized JSON is never
  // used for verification. Without both a database and webhook secret this
  // route fails closed and cannot move money.
  app.post('/api/webhooks/:provider/payout', async (req, res) => {
    const provider = typeof req.params.provider === 'string' ? req.params.provider : '';
    const secret = (process.env.PAYOUT_WEBHOOK_SECRET ?? '').trim();
    const rawBody = (req as express.Request & { rawBody?: string }).rawBody;
    const eventId = req.get('x-siren-event-id') ?? '';
    const timestamp = req.get('x-siren-timestamp') ?? '';
    const signature = req.get('x-siren-signature') ?? '';
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(provider) || !secret || databaseRuntimeStatus !== 'CONNECTED') {
      return res.status(503).json({ error: 'PAYOUT_WEBHOOK_NOT_CONNECTED', status: 'NOT_CONNECTED', message: 'Payout webhook gateway не підключений.' });
    }
    if (!rawBody || !/^[A-Za-z0-9._:-]{1,128}$/.test(eventId) || !/^\d+$/.test(timestamp)) {
      return res.status(400).json({ error: 'INVALID_PAYOUT_WEBHOOK', message: 'Webhook envelope не пройшов базову перевірку.' });
    }
    try {
      verifyWebhookSignature({ provider, eventId, rawBody, signature, timestamp, secret }, Date.now(), webhookToleranceSeconds());
    } catch (error) {
      const code = error instanceof Error ? error.message : 'WEBHOOK_SIGNATURE_INVALID';
      return res.status(401).json({ error: code, status: 'UNAUTHORIZED', message: 'Webhook signature не підтверджено.' });
    }
    let payload: ReturnType<typeof parseNormalizedPayoutWebhook>;
    try {
      payload = parseNormalizedPayoutWebhook(req.body);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_PAYOUT_WEBHOOK';
      return res.status(400).json({ error: code, message: 'Нормалізований payout webhook має некоректну структуру.' });
    }
    try {
      const result = await payoutRepository.settle({
        payoutId: payload.payoutId,
        provider,
        providerEventId: eventId,
        providerPayoutId: payload.providerPayoutId,
        status: payload.status,
        rawBody,
        signatureVerifiedAt: new Date().toISOString(),
        occurredAt: payload.occurredAt
      });
      return res.json({ status: result, provider, providerEventId: eventId });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'PAYOUT_SETTLEMENT_FAILED';
      const status = code === 'PAYOUT_NOT_FOUND' ? 404 : code === 'PAYOUT_STATE_CONFLICT' || code === 'PAYOUT_PROVIDER_ID_CONFLICT' || code === 'WEBHOOK_IDEMPOTENCY_CONFLICT' ? 409 : 503;
      console.error('[SIREN UA] payout webhook settlement failure', { requestId: res.locals.requestId, provider, eventId, code });
      return res.status(status).json({ error: code, message: 'Не вдалося завершити payout settlement.' });
    }
  });

  // Billing providers use the same signed transport but a separate secret and
  // normalized subscription envelope. This route changes only the durable
  // subscription state; payment qualification/commission creation remains a
  // separate post-verification boundary and is never inferred from a browser
  // request or from a trial record.
  app.post('/api/webhooks/:provider/subscription', async (req, res) => {
    const provider = typeof req.params.provider === 'string' ? req.params.provider : '';
    const secret = (process.env.PAYMENT_WEBHOOK_SECRET ?? '').trim();
    const rawBody = (req as express.Request & { rawBody?: string }).rawBody;
    const eventId = req.get('x-siren-event-id') ?? '';
    const timestamp = req.get('x-siren-timestamp') ?? '';
    const signature = req.get('x-siren-signature') ?? '';
    if (!['WEB', 'APPLE', 'GOOGLE'].includes(provider) || !secret || databaseRuntimeStatus !== 'CONNECTED') {
      return res.status(503).json({ error: 'PAYMENT_WEBHOOK_NOT_CONNECTED', status: 'NOT_CONNECTED', message: 'Billing webhook gateway не підключений.' });
    }
    if (!rawBody || !/^[A-Za-z0-9._:-]{1,128}$/.test(eventId) || !/^\d+$/.test(timestamp)) {
      return res.status(400).json({ error: 'INVALID_SUBSCRIPTION_WEBHOOK', message: 'Webhook envelope не пройшов базову перевірку.' });
    }
    try {
      verifyWebhookSignature({ provider, eventId, rawBody, signature, timestamp, secret }, Date.now(), webhookToleranceSeconds());
    } catch (error) {
      const code = error instanceof Error ? error.message : 'WEBHOOK_SIGNATURE_INVALID';
      return res.status(401).json({ error: code, status: 'UNAUTHORIZED', message: 'Webhook signature не підтверджено.' });
    }
    let payload: ReturnType<typeof parseNormalizedSubscriptionWebhook>;
    try {
      payload = parseNormalizedSubscriptionWebhook(req.body);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_SUBSCRIPTION_WEBHOOK';
      return res.status(400).json({ error: code, message: 'Нормалізований subscription webhook має некоректну структуру.' });
    }
    try {
      const result = await subscriptionRepository.applyVerifiedProviderEvent({
        subscriptionId: payload.subscriptionId,
        providerEventId: eventId,
        event: payload.event,
        payload: req.body as Record<string, unknown>,
        occurredAt: payload.occurredAt,
        provider: provider as 'WEB' | 'APPLE' | 'GOOGLE',
        rawBody,
        providerSubscriptionId: payload.providerSubscriptionId,
        billingConsentAt: payload.billingConsentAt,
        currentPeriodStart: payload.currentPeriodStart,
        currentPeriodEnd: payload.currentPeriodEnd
      });
      return res.json({ status: result, provider, providerEventId: eventId });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SUBSCRIPTION_WEBHOOK_FAILED';
      const status = code === 'SUBSCRIPTION_NOT_FOUND' ? 404 : code === 'INVALID_SUBSCRIPTION_TRANSITION' || code === 'WEBHOOK_IDEMPOTENCY_CONFLICT' ? 409 : 503;
      console.error('[SIREN UA] subscription webhook failure', { requestId: res.locals.requestId, provider, eventId, code });
      return res.status(status).json({ error: code, message: 'Не вдалося застосувати subscription event.' });
    }
  });

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
    if (!demoDataEnabled || !isThreatServerConnected) {
      return res.status(503).json({
        error: 'NOT_CONNECTED',
        message: 'Дані регіонів тимчасово недоступні. Потрібне авторитетне джерело ThreatServer.'
      });
    }
    res.json({
      regions: mockRegions,
      timestamp: new Date().toISOString(),
      dataMode: 'DEMO_DATA'
    });
  });

  // Shelters Finder API
  app.get('/api/threats/shelters', (req, res) => {
    if (!demoDataEnabled || !isThreatServerConnected) {
      return res.status(503).json({
        error: 'NOT_CONNECTED',
        message: 'Дані про укриття тимчасово недоступні. Потрібне авторитетне джерело.'
      });
    }
    const { district } = req.query;
    res.json({
      shelters: mockShelters,
      count: mockShelters.length,
      nearestDistance: '340 м',
      dataMode: 'DEMO_DATA'
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
  app.get('/api/auth/session', async (req, res) => {
    if (!financialDemoEnabled) {
      if (identityVerifier.status() !== 'CONFIGURED') return financialUnavailable(res);
      try {
        const principal = await identityVerifier.authenticate(req.get('authorization'));
        return res.json({
          user: {
            id: principal.subject,
            email: principal.email,
            role: principal.roles[0] ?? 'USER',
            roles: principal.roles,
            identitySource: 'OIDC'
          }
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : 'IDENTITY_UNAUTHORIZED';
        return res.status(code === 'IDENTITY_NOT_CONFIGURED' ? 503 : 401).json({
          error: code === 'IDENTITY_NOT_CONFIGURED' ? 'IDENTITY_NOT_CONNECTED' : 'IDENTITY_UNAUTHORIZED',
          status: code === 'IDENTITY_NOT_CONFIGURED' ? 'NOT_CONNECTED' : 'UNAUTHORIZED',
          message: code === 'IDENTITY_NOT_CONFIGURED' ? 'Identity provider не підключений.' : 'Потрібен дійсний bearer token.'
        });
      }
    }
    const partner = partners.get(demoPartnerId);
    const wallet = calculateWallet(demoPartnerId);

    return res.json({
      user: {
        id: 'usr-demo-01',
        email: 'partner@sirenua.com',
        name: 'Олександр (Atlas Partner)',
        role: 'PARTNER',
        partnerProfile: partner,
        wallet,
        isKycVerified: true,
        taxId: '••••2019',
        identitySource: 'DEMO_ONLY'
      }
    });
  });

  app.get('/api/subscription', requireRoles('USER', 'PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    try {
      const subscription = await subscriptionRepository.getForUser(principal.subject);
      if (!subscription) return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND', message: 'Підписку для цього користувача не знайдено.' });
      return res.json({ subscription });
    } catch (error) {
      console.error('[SIREN UA] subscription read failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
      return res.status(503).json({ error: 'SUBSCRIPTION_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Subscription data temporarily unavailable.' });
    }
  });

  app.post('/api/subscription/trial', requireRoles('USER', 'PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    try {
      const existing = await subscriptionRepository.getForUser(principal.subject);
      if (existing) return res.status(409).json({ error: 'SUBSCRIPTION_ALREADY_EXISTS', message: 'Для цього користувача вже існує subscription record.' });
      const result = await subscriptionRepository.startTrial({
        id: randomUUID(),
        userId: principal.subject,
        planCode: 'PREMIUM_MONTHLY',
        startedAt: new Date().toISOString()
      });
      return res.status(201).json({ subscription: result.subscription, status: result.status });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'TRIAL_START_FAILED';
      const status = code === 'USER_NOT_FOUND' ? 404 : code === 'SUBSCRIPTION_IDEMPOTENCY_CONFLICT' ? 409 : 503;
      return res.status(status).json({ error: code, message: 'Не вдалося активувати trial.' });
    }
  });

  // Switch Demo Role (For seamless UX testing)
  app.post('/api/auth/switch-role', (req, res) => {
    if (!financialDemoEnabled) return financialUnavailable(res);
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as { role?: unknown; rank?: unknown } : {};
    const { role, rank } = payload;
    const validRoles = new Set(['USER', 'PARTNER', 'AMBASSADOR']);
    const validRanks = new Set(['STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);
    if (typeof role !== 'string' || !validRoles.has(role) || (rank !== undefined && (typeof rank !== 'string' || !validRanks.has(rank)))) {
      return res.status(400).json({
        error: 'INVALID_ROLE_CONFIGURATION',
        message: 'Роль або ранг не підтримується demo-сесією.'
      });
    }
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
  app.get('/api/partner/dashboard', requireRoles('PARTNER', 'AMBASSADOR'), (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      return partnerRepository.getDashboardForUser(principal.subject).then((dashboard) => {
        if (!dashboard) return res.status(404).json({ error: 'PARTNER_NOT_FOUND', message: 'Partner profile не знайдено.' });
        return res.json({
          status: 'LIVE',
          ...dashboard,
          payoutEligibility: {
            canRequestPayout: false,
            minimumPayout: { baseCurrency: 'USD', baseAmount: '10.00', payoutCurrency: dashboard.wallet.currency, amountMinor: null, status: 'FX_SOURCE_NOT_CONNECTED' },
            minimumPayoutMinor: null,
            feesPaidBy: 'PARTNER',
            providerStatus: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED'
          }
        });
      }).catch((error) => {
        console.error('[SIREN UA] partner dashboard repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      });
    }
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
      status: 'DEMO_DATA',
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
        canRequestPayout: false,
        minimumPayout: { baseCurrency: 'USD', baseAmount: '10.00', payoutCurrency: 'UAH', amountMinor: null, status: 'FX_SOURCE_NOT_CONNECTED' },
        minimumPayoutMinor: null,
        feesPaidBy: 'PARTNER',
        kycStatus: 'VERIFIED',
        taxStatus: 'VERIFIED',
        providerStatus: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED'
      }
    });
  });

  // Financial platform capability/status boundary. This is intentionally
  // explicit: UI may explain what is configured, but cannot infer a live
  // payment, FX, KYC or payout connection from demo fixtures.
  app.get('/api/partner/platform-status', requireRoles(), (req, res) => {
    res.json({
      subscriptionBilling: 'NOT_CONNECTED',
      fx: 'NOT_CONNECTED',
      payoutProvider: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED',
      kyc: 'NOT_CONNECTED',
      fraud: 'RULES_ONLY',
      ledger: 'IN_MEMORY_DEMO_PROJECTION',
      financialDataMode: financialDemoEnabled ? 'DEMO_DATA' : 'NOT_CONNECTED',
      productionNotice: 'Реальні платежі, FX, KYC та виплати потребують підключених server-side adapters.'
    });
  });

  app.get('/api/partner/referral-link', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      try {
        const dashboard = await partnerRepository.getDashboardForUser(principal.subject);
        if (!dashboard) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
        const origin = configuredPublicOrigin(req);
        if (!origin) return res.status(503).json({ error: 'PUBLIC_ORIGIN_NOT_CONFIGURED', status: 'NOT_CONNECTED', message: 'Канонічний public origin не налаштований на сервері.' });
        return res.json({ status: 'LIVE', referralCode: dashboard.partner.referralCode, referralUrl: `${origin}/r/${encodeURIComponent(dashboard.partner.referralCode)}` });
      } catch (error) {
        console.error('[SIREN UA] referral link repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      }
    }
    const partner = partners.get(demoPartnerId);
    if (!partner) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
    const origin = configuredPublicOrigin(req);
    if (!origin) return res.status(503).json({ error: 'PUBLIC_ORIGIN_NOT_CONFIGURED', status: 'NOT_CONNECTED', message: 'Канонічний public origin не налаштований на сервері.' });
    res.json({
      status: 'DEMO_DATA',
      referralCode: partner.referralCode,
      referralUrl: `${origin}/r/${encodeURIComponent(partner.referralCode)}`
    });
  });

  // Campaign links are generated server-side so the canonical origin and
  // attribution parameters cannot be forged by a browser-only helper. This is
  // still demo-only until identity, durable attribution storage and auth are
  // connected in production.
  app.post('/api/partner/share', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body as { campaign?: unknown; content?: unknown }
      : {};
    const campaign = normalizeCampaignToken(payload.campaign, 'siren_share');
    const content = payload.content === undefined ? null : normalizeCampaignToken(payload.content);
    if (!campaign || (payload.content !== undefined && !content)) {
      return res.status(400).json({
        error: 'INVALID_CAMPAIGN_PARAMETERS',
        message: 'Назва кампанії та content можуть містити лише безпечні символи й до 64 знаків.'
      });
    }
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      try {
        const dashboard = await partnerRepository.getDashboardForUser(principal.subject);
        if (!dashboard) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
        const origin = configuredPublicOrigin(req);
        if (!origin) return res.status(503).json({ error: 'PUBLIC_ORIGIN_NOT_CONFIGURED', status: 'NOT_CONNECTED', message: 'Канонічний public origin не налаштований на сервері.' });
        const campaignLink = await partnerRepository.createCampaignLink(dashboard.partner.id, campaign, content ?? '');
        const url = new URL(`/r/${encodeURIComponent(dashboard.partner.referralCode)}`, origin);
        url.searchParams.set('utm_source', 'partner');
        url.searchParams.set('utm_medium', 'referral');
        url.searchParams.set('utm_campaign', campaign);
        if (content) url.searchParams.set('utm_content', content);
        return res.json({ status: 'LIVE', referralCode: dashboard.partner.referralCode, campaign, content, campaignLinkId: campaignLink.id, referralUrl: url.toString() });
      } catch (error) {
        console.error('[SIREN UA] campaign link repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      }
    }
    const partner = partners.get(demoPartnerId);
    if (!partner) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
    const origin = configuredPublicOrigin(req);
    if (!origin) return res.status(503).json({ error: 'PUBLIC_ORIGIN_NOT_CONFIGURED', status: 'NOT_CONNECTED', message: 'Канонічний public origin не налаштований на сервері.' });

    const url = new URL(`/r/${encodeURIComponent(partner.referralCode)}`, origin);
    url.searchParams.set('utm_source', 'partner');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', campaign);
    if (content) url.searchParams.set('utm_content', content);

    auditLogs.push({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      actor: demoPartnerId,
      action: 'REFERRAL_CAMPAIGN_LINK_GENERATED',
      targetEntity: 'PARTNER_SHARE',
      targetId: campaign,
      newValue: JSON.stringify({ campaign, content })
    });

    return res.json({
      status: 'DEMO_DATA',
      referralCode: partner.referralCode,
      campaign,
      content,
      referralUrl: url.toString()
    });
  });

  // Network (L1 and L2 referrals list with privacy masking)
  app.get('/api/partner/network', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      const parseQueryInteger = (value: unknown, fallback: number) => {
        if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback;
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) ? parsed : fallback;
      };
      const limit = Math.min(50, Math.max(1, parseQueryInteger(req.query.limit, 20)));
      const offset = parseQueryInteger(req.query.offset, 0);
      try {
        const partnerId = await partnerRepository.getPartnerIdForUser(principal.subject);
        if (!partnerId) return res.status(404).json({ error: 'PARTNER_NOT_FOUND', message: 'Partner profile не знайдено.' });
        const [l1, l2] = await Promise.all([
          partnerRepository.listNetwork(partnerId, 'L1', limit, offset),
          partnerRepository.listNetwork(partnerId, 'L2', limit, offset)
        ]);
        return res.json({ l1, l2, depthLimitNotice: 'Глибина партнерської моделі суворо обмежена 2 рівнями (L1 + L2). L3+ не оплачується.' });
      } catch (error) {
        console.error('[SIREN UA] partner network repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      }
    }
    const l1List = attributions.filter(a => a.referrerL1Id === demoPartnerId);
    const l2List = attributions.filter(a => a.referrerL2Id === demoPartnerId);
    const parseQueryInteger = (value: unknown, fallback: number) => {
      if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : fallback;
    };
    const limit = Math.min(50, Math.max(1, parseQueryInteger(req.query.limit, 20)));
    const offset = parseQueryInteger(req.query.offset, 0);
    const privacySafe = (item: ReferralAttribution) => ({
      id: item.id,
      userAnonymousLabel: item.userAnonymousLabel,
      sourceChannel: item.sourceChannel,
      utmCampaign: item.utmCampaign,
      isQualifiedPaid: item.isQualifiedPaid,
      subscriptionPlan: item.subscriptionPlan,
      monthlyQcbMinor: item.monthlyQcbMinor,
      registeredAt: item.registeredAt,
      lastPaymentAt: item.lastPaymentAt,
      status: item.status
    });
    const page = (items: ReferralAttribution[]) => ({
      count: items.length,
      activePaidCount: items.filter(a => a.isQualifiedPaid).length,
      offset,
      limit,
      hasMore: offset + limit < items.length,
      items: items.slice(offset, offset + limit).map(privacySafe)
    });

    res.json({
      l1: page(l1List),
      l2: page(l2List),
      depthLimitNotice: 'Глибина партнерської моделі суворо обмежена 2 рівнями (L1 + L2). L3+ не оплачується.'
    });
  });

  app.get('/api/partner/achievements', requireRoles('PARTNER', 'AMBASSADOR'), async (_req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    try {
      const partnerId = await partnerRepository.getPartnerIdForUser(principal.subject);
      if (!partnerId) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
      return res.json({ status: 'LIVE', achievements: await partnerEngagementRepository.listAchievements(partnerId) });
    } catch (error) {
      console.error('[SIREN UA] partner achievements repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
      return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
    }
  });

  app.get('/api/partner/ambassador', requireRoles('PARTNER', 'AMBASSADOR'), async (_req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    try {
      const partnerId = await partnerRepository.getPartnerIdForUser(principal.subject);
      if (!partnerId) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
      return res.json({ status: 'LIVE', ambassador: await partnerEngagementRepository.getAmbassador(partnerId) });
    } catch (error) {
      console.error('[SIREN UA] partner ambassador repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
      return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
    }
  });

  app.get('/api/partner/leaderboard', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    try {
      const metric = typeof req.query.metric === 'string' ? req.query.metric : 'MONTHLY';
      const limit = typeof req.query.limit === 'string' && /^\d+$/.test(req.query.limit) ? Math.min(100, Math.max(1, Number(req.query.limit))) : 100;
      return res.json({ status: 'LIVE', metric, entries: await partnerEngagementRepository.latestLeaderboard(metric, limit) });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'LEADERBOARD_UNAVAILABLE';
      if (code === 'INVALID_LEADERBOARD_METRIC') return res.status(400).json({ error: code, message: 'Непідтримуваний тип рейтингу.' });
      return res.status(503).json({ error: 'LEADERBOARD_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Leaderboard data temporarily unavailable.' });
    }
  });

  // Earnings & Immutable Ledger Projection
  app.get('/api/partner/ledger', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      try {
        const dashboard = await partnerRepository.getDashboardForUser(principal.subject);
        if (!dashboard) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
        const entries = await partnerRepository.listLedger(dashboard.partner.id);
        return res.json({ wallet: dashboard.wallet, entries, totalEntriesCount: entries.length, integrityCheck: 'DATABASE_PROJECTION' });
      } catch (error) {
        console.error('[SIREN UA] ledger repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      }
    }
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
  app.post('/api/partner/payouts', requireRoles('PARTNER', 'AMBASSADOR'), (req, res) => {
    return res.status(503).json({
      error: payoutProvider.connected ? 'PAYOUT_PROVIDER_NOT_IMPLEMENTED' : 'PAYOUT_PROVIDER_NOT_CONNECTED',
      message: 'Провайдер виплат не підключений. Реальні кошти не переміщуються.',
      status: 'NOT_CONNECTED'
    });
  });

  // Payout History
  app.get('/api/partner/payouts', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      const principal = res.locals.principal as { subject?: unknown } | undefined;
      if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
      try {
        const dashboard = await partnerRepository.getDashboardForUser(principal.subject);
        if (!dashboard) return res.status(404).json({ error: 'PARTNER_NOT_FOUND' });
        return res.json({ payouts: await partnerRepository.listPayouts(dashboard.partner.id) });
      } catch (error) {
        console.error('[SIREN UA] payouts repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'PARTNER_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Partner data temporarily unavailable.' });
      }
    }
    const list = payoutRequests.filter(p => p.partnerId === demoPartnerId);
    res.json({
      payouts: list.slice().reverse().map((payout) => ({
        ...payout,
        destinationAccount: maskSensitiveDestination(payout.destinationAccount)
      }))
    });
  });

  app.get('/api/partner/auto-payout', requireRoles('PARTNER', 'AMBASSADOR'), async (_req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    try {
      const partnerId = await partnerRepository.getPartnerIdForUser(principal.subject);
      if (!partnerId) return res.status(404).json({ error: 'PARTNER_NOT_FOUND', message: 'Partner profile не знайдено.' });
      return res.json({
        status: 'LIVE',
        policy: await autoPayoutRepository.getForPartner(partnerId),
        execution: {
          provider: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED',
          message: payoutProvider.connected ? 'Автовиплата очікує проходження всіх payout gates.' : 'Автовиплата збережена, але provider не підключений; кошти не переміщуються.'
        }
      });
    } catch (error) {
      console.error('[SIREN UA] auto payout read failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
      return res.status(503).json({ error: 'AUTO_PAYOUT_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Auto-payout data temporarily unavailable.' });
    }
  });

  app.put('/api/partner/auto-payout', requireRoles('PARTNER', 'AMBASSADOR'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
    if (typeof payload.enabled !== 'boolean' || (payload.cadence !== 'MONTHLY' && payload.cadence !== 'THRESHOLD') || typeof payload.thresholdMinor !== 'string' || !/^\d+$/.test(payload.thresholdMinor) || (payload.currency !== 'USD' && payload.currency !== 'UAH' && payload.currency !== 'EUR' && payload.currency !== 'PLN')) {
      return res.status(400).json({ error: 'INVALID_AUTO_PAYOUT_VALUE', message: 'Потрібні enabled, cadence, positive thresholdMinor та підтримувана currency.' });
    }
    try {
      const partnerId = await partnerRepository.getPartnerIdForUser(principal.subject);
      if (!partnerId) return res.status(404).json({ error: 'PARTNER_NOT_FOUND', message: 'Partner profile не знайдено.' });
      const policy = await autoPayoutRepository.upsert({
        partnerId,
        enabled: payload.enabled,
        cadence: payload.cadence,
        thresholdMinor: payload.thresholdMinor,
        currency: payload.currency,
        updatedBy: principal.subject,
        updatedAt: new Date().toISOString()
      });
      return res.json({
        status: 'LIVE',
        policy,
        execution: {
          provider: payoutProvider.connected ? 'CONNECTED' : 'NOT_CONNECTED',
          message: payoutProvider.connected ? 'Policy збережена; виконання додатково перевіряє KYC, compliance та fraud.' : 'Policy збережена. Реальний provider не підключений, тому автоматична виплата не запускається.'
        }
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'AUTO_PAYOUT_UPDATE_FAILED';
      const status = code === 'PARTNER_NOT_FOUND' ? 404 : code.startsWith('INVALID_AUTO_PAYOUT_VALUE') ? 400 : 503;
      return res.status(status).json({ error: code, message: 'Не вдалося зберегти налаштування автовиплати.' });
    }
  });

  // --------------------------------------------------------------------------
  // 4. ADMIN CONTROL CENTER API
  // --------------------------------------------------------------------------

  // Admin Overview
  app.get('/api/admin/overview', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'RISK_ADMIN', 'QUALITY_ADMIN', 'SUPPORT', 'CAMPAIGN_ADMIN', 'CONTRACT_ADMIN'), (req, res) => {
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
      try {
        return adminRepository.getOverview().then((overview) => res.json(overview)).catch((error) => {
          console.error('[SIREN UA] admin overview repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
          return res.status(503).json({ error: 'ADMIN_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Admin data temporarily unavailable.' });
        });
      } catch (error) {
        return res.status(503).json({ error: 'ADMIN_DATA_UNAVAILABLE', status: 'NOT_CONNECTED', message: error instanceof Error ? error.message : 'Admin data temporarily unavailable.' });
      }
    }
    if (!financialDemoEnabled) return financialUnavailable(res);
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
      financialDataMode: financialDemoEnabled ? 'DEMO_DATA' : 'NOT_CONNECTED',
      threatServerHealth: demoDataEnabled && isThreatServerConnected ? 'DEMO_DATA' : 'NOT_CONNECTED',
      activeThreatsCount: demoDataEnabled && isThreatServerConnected ? mockLiveThreats.length : 0,
      fraudIncidentsCount: 0
    });
  });

  // Admin Validate Cap
  app.post('/api/admin/validate-cap', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), (req, res) => {
    if (!financialDemoEnabled) return financialUnavailable(res);
    const { l1RateBps, l2RateBps, campaignBonusBps } = req.body ?? {};
    const parseRate = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isInteger(value)) return value;
      if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
      return null;
    };
    const l1 = parseRate(l1RateBps);
    const l2 = parseRate(l2RateBps);
    const campaign = parseRate(campaignBonusBps);
    if (l1 === null || l2 === null || campaign === null) {
      return res.status(400).json({ error: 'INVALID_RATE_BPS', message: 'Ставки мають бути цілими невід’ємними значеннями в basis points.' });
    }
    const result = validateAllocationCap([
      { partnerId: 'L1', referralLevel: 'L1', rateBps: l1 },
      { partnerId: 'L2', referralLevel: 'L2', rateBps: l2 },
      { partnerId: 'CAMPAIGN', referralLevel: 'L1', rateBps: campaign }
    ]);
    res.json({ ...result, l1RateBps: l1, l2RateBps: l2, campaignBonusBps: campaign });
  });

  // Financial configuration is a durable maker/checker workflow. It is not
  // available in the in-memory demo and never mutates balances directly.
  app.get('/api/admin/financial-rules', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    try {
      const ruleType = typeof req.query.ruleType === 'string' ? req.query.ruleType : undefined;
      return res.json({ rules: await financialRuleRepository.list(ruleType) });
    } catch (error) {
      console.error('[SIREN UA] financial rules list failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
      return res.status(503).json({ error: 'FINANCIAL_RULES_UNAVAILABLE', status: 'NOT_CONNECTED', message: 'Financial rule configuration temporarily unavailable.' });
    }
  });

  app.post('/api/admin/financial-rules', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), async (req, res) => {
    if (financialDemoEnabled || databaseRuntimeStatus !== 'CONNECTED') return financialUnavailable(res);
    const principal = res.locals.principal as { subject?: unknown } | undefined;
    if (!principal || typeof principal.subject !== 'string') return res.status(401).json({ error: 'IDENTITY_UNAUTHORIZED', status: 'UNAUTHORIZED' });
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as { version?: unknown; ruleType?: unknown; value?: unknown; reason?: unknown } : {};
    if (typeof payload.version !== 'string' || typeof payload.ruleType !== 'string' || !payload.value || typeof payload.value !== 'object' || Array.isArray(payload.value) || typeof payload.reason !== 'string') {
      return res.status(400).json({ error: 'INVALID_FINANCIAL_RULE', message: 'Потрібні version, ruleType, value та reason.' });
    }
    try {
      return res.status(201).json({ rule: await financialRuleRepository.createDraft({ version: payload.version, ruleType: payload.ruleType, value: payload.value as Record<string, unknown>, createdBy: principal.subject, reason: payload.reason }) });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'FINANCIAL_RULE_CREATE_FAILED';
      return res.status(code === 'INVALID_RULE_VALUE:value' ? 400 : 409).json({ error: code, message: 'Не вдалося створити financial rule draft.' });
    }
  });

  app.post('/api/admin/financial-rules/:version/validate', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), async (req, res) => {
    return transitionFinancialRule(req, res, financialRuleRepository, 'VALIDATE');
  });

  app.post('/api/admin/financial-rules/:version/approve', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), async (req, res) => {
    return transitionFinancialRule(req, res, financialRuleRepository, 'APPROVE');
  });

  app.post('/api/admin/financial-rules/:version/schedule', requireRoles('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTRACT_ADMIN'), async (req, res) => {
    const effectiveFrom = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body.effectiveFrom : undefined;
    return transitionFinancialRule(req, res, financialRuleRepository, 'SCHEDULE', effectiveFrom);
  });

  // Admin Toggle Threat Server Connection
  app.post('/api/admin/toggle-threat-server', requireRoles('ADMIN', 'SUPER_ADMIN', 'RISK_ADMIN'), (req, res) => {
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
    if (!financialDemoEnabled) {
      return res.status(409).json({ error: 'DEMO_ONLY', message: 'Sandbox-фінансові сценарії вимкнені поза development/demo mode.' });
    }
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

    sandboxSequence += 1;
    const sequence = sandboxSequence;
    const newAttr: ReferralAttribution = {
      id: `attr-l1-sandbox-${sequence}`,
      userId: `usr-new-sandbox-${sequence}`,
      userAnonymousLabel: `Користувач #L1-SANDBOX-${sequence}`,
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
    const commissionMinor = Number(percentHalfUp(14900n, partner.partnerRateBps));
    ledgerEntries.push({
      id: `led-sandbox-${sequence}`,
      transactionId: `TX-SANDBOX-${sequence}`,
      timestamp: new Date().toISOString(),
      debitAccount: 'PLATFORM_REVENUE',
      creditAccount: 'PARTNER_AVAILABLE_PAYABLE',
      amountMinor: commissionMinor,
      currency: 'UAH',
      partnerId: demoPartnerId,
      referralLevel: 'L1',
      rateBps: partner.partnerRateBps,
      description: `Комісія L1 (${partner.partnerRateBps / 100}%) за нового передплатника ${newAttr.userAnonymousLabel}`,
      idempotencyKey: `idem-sb-${sequence}`
    });

    res.json({
      success: true,
      newAttribution: newAttr,
      commissionEarnedMinor: commissionMinor,
      partner
    });
  });

  // Referral links are a server-side attribution boundary. In demo mode we
  // record the click and hand the referral code to the next page through an
  // HttpOnly cookie. Without an attribution/identity backend, production must
  // fail closed instead of pretending that a click was tracked.
  app.get('/r/:referralCode', async (req, res) => {
    const referralCode = req.params.referralCode;
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(referralCode)) {
      return res.status(400).json({ error: 'INVALID_REFERRAL_CODE', message: 'Некоректний referral-код.' });
    }
    let resolvedPartner: { id: string; referralCode: string } | undefined;
    if (!financialDemoEnabled) {
      if (databaseRuntimeStatus !== 'CONNECTED') {
        return res.status(503).json({
          error: 'REFERRAL_ATTRIBUTION_NOT_CONNECTED',
          status: 'NOT_CONNECTED',
          message: 'Referral attribution ще не підключено до production identity/database.'
        });
      }
      try {
        resolvedPartner = (await partnerRepository.findPartnerByReferralCode(referralCode)) ?? undefined;
        if (!resolvedPartner) return res.status(404).json({ error: 'REFERRAL_CODE_NOT_FOUND', message: 'Referral-код не знайдено.' });
      } catch (error) {
        console.error('[SIREN UA] referral click repository failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'REFERRAL_ATTRIBUTION_NOT_CONNECTED', status: 'NOT_CONNECTED', message: 'Referral attribution temporarily unavailable.' });
      }
    } else {
      const partner = Array.from(partners.values()).find((candidate) => candidate.referralCode === referralCode || candidate.vanitySlug === referralCode);
      if (!partner) return res.status(404).json({ error: 'REFERRAL_CODE_NOT_FOUND', message: 'Referral-код не знайдено.' });
      partner.totalClicks += 1;
      resolvedPartner = { id: partner.id, referralCode: partner.referralCode };
    }

    const secureCookie = isProductionLike ? '; Secure' : '';
    const referralContext = readReferralContext(req);
    if (!financialDemoEnabled && resolvedPartner) {
      try {
        await partnerRepository.recordClick({
          partnerId: resolvedPartner.id,
          referralCode: resolvedPartner.referralCode,
          utmSource: referralContext.utm_source,
          utmMedium: referralContext.utm_medium,
          utmCampaign: referralContext.utm_campaign,
          utmContent: referralContext.utm_content,
          requestId: res.locals.requestId
        });
      } catch (error) {
        console.error('[SIREN UA] referral click persistence failure', { requestId: res.locals.requestId, message: error instanceof Error ? error.message : 'unknown' });
        return res.status(503).json({ error: 'REFERRAL_ATTRIBUTION_NOT_CONNECTED', status: 'NOT_CONNECTED', message: 'Referral attribution temporarily unavailable.' });
      }
    }
    const contextCookie = encodeURIComponent(JSON.stringify({
      referralCode: resolvedPartner!.referralCode,
      ...referralContext
    }));
    res.setHeader('Set-Cookie', [
      `siren_referral=${encodeURIComponent(resolvedPartner!.referralCode)}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax${secureCookie}`,
      `siren_referral_context=${contextCookie}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax${secureCookie}`
    ]);
    const redirectParams = new URLSearchParams({ ref: resolvedPartner!.referralCode });
    for (const [key, value] of Object.entries(referralContext)) redirectParams.set(key, value);
    return res.redirect(302, `/?${redirectParams.toString()}`);
  });

  // Do not let the SPA fallback turn an unknown API call into HTML. Clients
  // need a deterministic JSON error so retries and monitoring can classify it.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API_NOT_FOUND', message: 'API route не знайдено.' });
  });

  // Keep API failures machine-readable. In particular, never leak a parser
  // stack trace or an HTML error page to clients consuming JSON endpoints.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const error = err as { type?: string; status?: number; message?: string };
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'INVALID_JSON', message: 'Некоректне тіло JSON-запиту.', requestId: res.locals.requestId });
    }
    console.error('[SIREN UA] request failure:', { requestId: res.locals.requestId, message: error.message ?? 'unknown error' });
    return res.status(error.status && error.status >= 400 ? error.status : 500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Внутрішня помилка сервера.',
      requestId: res.locals.requestId
    });
  });

  // --------------------------------------------------------------------------
  // VITE & STATIC SPA MIDDLEWARE
  // --------------------------------------------------------------------------

  if (!isProductionLike) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIREN UA 2026] Enterprise Platform running on http://localhost:${PORT}`);
  });
}

startServer();
