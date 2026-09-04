/**
 * SIREN UA 2026 Type Definitions
 * Enterprise-grade contracts for Threat Pipeline, 2-Level Referral Engine,
 * Immutable Double-Entry Ledger, and Automatic Payouts.
 */

// ==========================================
// THREAT PIPELINE & SITUATIONAL INTELLIGENCE
// ==========================================

export type RiskLevel = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export type ThreatCategory = 'MISSILE' | 'DRONE_SHAhed' | 'BALLISTIC' | 'AVIATION' | 'ARTILLERY' | 'RECON';

export type ConfidenceLevel = 'CONFIRMED' | 'ESTIMATED' | 'PREDICTED' | 'UNVERIFIED' | 'UNKNOWN';

export type ThreatStatus = 'ACTIVE' | 'TRACKING' | 'INTERCEPTED' | 'IMPACT' | 'EXPIRED';

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  timeOffsetMin: number;
  isConfirmed: boolean;
}

export interface ThreatEvent {
  id: string;
  category: ThreatCategory;
  categoryLabel: string;
  speedKmh: number;
  directionDeg: number;
  directionLabel: string;
  originRegion: string;
  currentLat: number;
  currentLng: number;
  trajectory: TrajectoryPoint[];
  estimatedArrivalMin: string; // e.g. "10–15 хв"
  targetDistricts: string[];
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  status: ThreatStatus;
  detectedAt: string;
  updatedAt: string;
  source: string;
  notes?: string;
}

export interface RegionAlert {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  hasAlert: boolean;
  alertType?: 'RED' | 'YELLOW' | 'NONE';
  riskLevel: RiskLevel;
  threatCount: number;
  sheltersCount: number;
  lastUpdated: string;
  districts: {
    name: string;
    riskLevel: RiskLevel;
    etaMinutes?: string;
  }[];
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  type: 'BOMB_SHELTER' | 'SUBWAY' | 'BASEMENT' | 'PARKING';
  capacity: number;
  lat: number;
  lng: number;
  isOpen24h: boolean;
  hasPowerBackup: boolean;
  hasWater: boolean;
  distanceMeters?: number;
}

// ==========================================
// PARTNER & 2-LEVEL REFERRAL ENGINE
// ==========================================

export type RankType = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type RankState = 'ACTIVE' | 'BELOW_THRESHOLD' | 'GRACE' | 'COOLDOWN' | 'SUSPENDED';

export type QualityStatus = 'QUALITY_GOOD' | 'QUALITY_REVIEW' | 'QUALITY_RESTRICTED' | 'QUALITY_BLOCKED';

export type AmbassadorTier = 'NONE' | 'CANDIDATE' | 'AMBASSADOR' | 'PRO' | 'ELITE' | 'LEGEND';

export interface GracePeriodInfo {
  isActive: boolean;
  enteredAt?: string;
  expiresAt?: string;
  daysRemaining: number;
  cycleCount: number; // Max 2 per 180 days
  preservedRank: RankType;
  preservedRateBps: number;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  referralCode: string;
  vanitySlug?: string;
  rank: RankType;
  effectiveRank: RankType;
  partnerRateBps: number; // 500 (5%), 1000 (10%), 1500 (15%), 2000 (20%), 2500 (25%)
  rankState: RankState;
  graceInfo: GracePeriodInfo;
  qualityScore: number; // 0-100
  qualityStatus: QualityStatus;
  ambassadorTier: AmbassadorTier;
  isAmbassadorApproved: boolean;
  activeL1PaidCount: number;
  activeL2PaidCount: number;
  totalL1Count: number;
  totalL2Count: number;
  totalClicks: number;
  totalInstalls: number;
  createdAt: string;
  customContractId?: string;
}

export interface ReferralAttribution {
  id: string;
  userId: string;
  userAnonymousLabel: string; // e.g. "Користувач #F82B" for privacy
  referrerL1Id: string;
  referrerL2Id?: string;
  sourceChannel: 'TIKTOK' | 'TELEGRAM' | 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE' | 'QR' | 'DIRECT' | 'CAMPAIGN';
  utmCampaign?: string;
  isQualifiedPaid: boolean;
  subscriptionPlan?: string;
  monthlyQcbMinor: number; // in minor units
  registeredAt: string;
  lastPaymentAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REFUNDED' | 'FRAUD_FLAGGED';
}

// ==========================================
// IMMUTABLE DOUBLE-ENTRY LEDGER & FINANCIALS
// ==========================================

export type LedgerAccountType = 
  | 'PLATFORM_REVENUE'
  | 'PARTNER_PENDING_PAYABLE'
  | 'PARTNER_AVAILABLE_PAYABLE'
  | 'PARTNER_LOCKED_PAYOUT'
  | 'PAYOUT_DISBURSEMENT'
  | 'REVERSAL_RECOVERY';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  timestamp: string;
  debitAccount: string;
  creditAccount: string;
  amountMinor: number; // Minor currency units (e.g. 500 = 5.00 UAH)
  currency: 'UAH' | 'USD' | 'EUR';
  partnerId?: string;
  referralLevel?: 'L1' | 'L2';
  rateBps?: number;
  description: string;
  idempotencyKey: string;
  isReversed?: boolean;
}

export interface WalletProjection {
  partnerId: string;
  pendingMinor: number;
  heldMinor: number;
  availableMinor: number;
  lockedPayoutMinor: number;
  paidTotalMinor: number;
  lifetimeEarnedMinor: number;
  currency: 'UAH';
}

export type PayoutStatus = 
  | 'REQUESTED' 
  | 'VALIDATING' 
  | 'AML_REVIEW' 
  | 'APPROVED' 
  | 'PROCESSING' 
  | 'PAID' 
  | 'FAILED' 
  | 'REJECTED';

export interface PayoutRequest {
  id: string;
  partnerId: string;
  amountMinor: number;
  currency: 'UAH';
  provider: 'MONOBANK' | 'LIQPAY' | 'IBAN_SEPA' | 'STRIPE';
  destinationAccount: string; // Masked IBAN or Card number
  status: PayoutStatus;
  idempotencyKey: string;
  kycVerified: boolean;
  taxIdVerified: boolean;
  requestedAt: string;
  completedAt?: string;
  failureReason?: string;
}

// ==========================================
// AUTH & USERS
// ==========================================

export type UserRole = 
  | 'USER' 
  | 'PARTNER' 
  | 'AMBASSADOR' 
  | 'SUPPORT' 
  | 'FINANCE_ADMIN' 
  | 'RISK_ADMIN' 
  | 'QUALITY_ADMIN' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  partnerProfile?: PartnerProfile;
  wallet?: WalletProjection;
  isKycVerified: boolean;
  taxId?: string;
}

// ==========================================
// ADMIN CONTROL CENTER & AUDIT
// ==========================================

export interface CapValidationResult {
  passed: boolean;
  totalAllocationBps: number;
  maxCapBps: number; // 5000 bps (50%)
  l1RateBps: number;
  l2RateBps: number;
  campaignBonusBps: number;
  reason?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetEntity: string;
  targetId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}
