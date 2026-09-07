export type ThreatType = 
  | 'none'
  | 'air'          // Повітряна тривога
  | 'drone'        // Загроза ударних БпЛА (Shahed)
  | 'missile'      // Ракетна небезпека
  | 'ballistic'    // Загроза застосування балістичного озброєння
  | 'artillery'    // Загроза артобстрілу
  | 'aviation'     // Активність тактичної авіації / КАБ
  | 'chemical';    // Хімічна / радіаційна загроза

export interface ThreatTrajectory {
  id: string;
  threatType: 'drone' | 'missile' | 'ballistic' | 'aviation';
  name: string;
  altitudeMeters: number;
  speedKmh: number;
  azimuthDeg: number;
  azimuthDirection: string; // e.g. "315° NW"
  pathD: string;
  currentPoint: { x: number; y: number; z: number };
  origin: string;
  targetRegion: string;
  etaMinutes: number;
  status: 'ACTIVE' | 'INTERCEPTED' | 'WARNING';
  altitudeLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Shelter {
  id: string;
  name: string;
  type: 'metro' | 'bunker' | 'basement' | 'parking';
  address: string;
  regionId: string;
  capacity: number;
  features: {
    powerGenerator: boolean;
    wifi: boolean;
    ventilation: boolean;
    waterSupply: boolean;
    wheelchairAccessible: boolean;
    allDayOpen: boolean;
  };
  distanceMeters: number;
  walkTimeMins: number;
  verifiedStatus: 'VERIFIED_DSNS' | 'COMMUNITY_CHECKED';
}

export interface SimulationStepData {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  technicalDetails: string;
  threatState: string;
  riskBadge: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  activeHighlight: 'radar' | 'trajectory' | 'risk' | 'eta' | 'shelter';
}

export interface RegionData {
  id: string;
  name: string;
  shortName: string;
  englishName: string;
  path: string;
  center: [number, number]; // [x, y] on SVG viewBox 0 0 1000 650
  isAlarm: boolean;
  threatType: ThreatType;
  startedAt: string | null;
  durationMinutes: number;
  threatDetails?: string;
  areaKm2: number;
  population: number;
  rayonsCount: number;
  partiallyAlarmed?: boolean;
  activeRayons?: string[];
  altitudeOffset?: number; // 3D elevation
}

export interface AlertEvent {
  id: string;
  regionId: string;
  regionName: string;
  type: 'start' | 'end' | 'update';
  threatType: ThreatType;
  timestamp: string;
  description: string;
  source: string;
}

export interface UserSettings {
  myRegion: string;
  soundEnabled: boolean;
  volume: number;
  voiceChime: boolean;
  vibrateOnMobile: boolean;
  theme: 'dark' | 'tactical' | 'light';
  showLabels: boolean;
  showThreatIcons: boolean;
  show3DDepth: boolean;
  showTrajectories: boolean;
  showRadarBeams: boolean;
  viewMode: '3D' | '2D';
  autoRefreshInterval: number;
}

export interface EmergencyKitItem {
  id: string;
  category: 'docs' | 'medical' | 'food' | 'tools' | 'clothes';
  title: string;
  description: string;
  checked: boolean;
}

export type AffiliateRankId = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface AffiliateRankTier {
  id: AffiliateRankId;
  name: string;
  minL1: number;
  maxL1: number | null; // null for 200+
  l1Percent: number;    // 5, 10, 15, 20, 25
  l2Percent: number;    // 0, 10, 15, 20, 25
  l1Rate: number;       // 0.05, 0.10, 0.15, 0.20, 0.25
  l2Rate: number;       // 0.00, 0.10, 0.15, 0.20, 0.25
  isL2Unlocked: boolean;
  badgeColor: string;
  accentColor: string;
  description: string;
  perks: string[];
}

export interface AffiliateCalculationResult {
  currentRank: AffiliateRankTier;
  nextRank: AffiliateRankTier | null;
  l1Count: number;
  avgL2PerL1: number;
  totalL2Count: number;
  totalNetworkSize: number;
  subscriptionPrice: number;
  l1MonthlyIncome: number;
  l2MonthlyIncome: number;
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  l1NeededForNextRank: number;
  progressToNextRankPercent: number;
  isL2Unlocked: boolean;
  maxTransactionPayoutPercent: number; // 50% max standard payout
}

export interface AffiliatePartnerNode {
  id: string;
  name: string;
  level: 'L1' | 'L2';
  parentId?: string;
  parentName?: string;
  joinDate: string;
  plan: string;
  planPrice: number;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED';
  l2ChildrenCount?: number;
  totalEarnedFromNode: number;
}

export interface AffiliatePayoutRequest {
  id: string;
  amount: number;
  currency: 'UAH' | 'USDT';
  method: 'MONOBANK' | 'PRIVATBANK' | 'IBAN' | 'USDT_TRC20';
  targetAccount: string;
  date: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
}

export interface AffiliatePromoTemplate {
  id: string;
  title: string;
  platform: 'Telegram' | 'Instagram / Facebook' | 'Twitter / X' | 'Web / Blog';
  text: string;
  tags: string[];
}

export type OrbitalDeviceType = 
  | 'tv' 
  | 'desktop' 
  | 'laptop' 
  | 'tablet' 
  | 'smartphone' 
  | 'watch' 
  | 'car' 
  | 'ar_vr'
  | 'kiosk';

/**
 * Truthful state of the safety scene.  A cached or stale scene may still be
 * useful for orientation, but it must never be presented as current live
 * intelligence.
 */
export type ThreatDataMode =
  | 'LIVE'
  | 'DEMO_DATA'
  | 'CACHED'
  | 'STALE'
  | 'NOT_CONNECTED'
  | 'ERROR';

export interface ThreatSceneModel {
  timestamp: string;
  freshness: 'REALTIME' | 'STABLE' | 'STALE' | 'DEGRADED';
  dataMode: ThreatDataMode;
  activeAlarmsCount: number;
  criticalRegions: string[];
  primaryThreat: ThreatTrajectory | null;
  nearestShelter: Shelter | null;
  myRegionStatus: {
    id: string;
    name: string;
    isAlarm: boolean;
    etaMinutes: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  partnerModeActive?: boolean;
}

export interface OrbitalDeviceConfig {
  id: OrbitalDeviceType;
  title: string;
  subtitle: string;
  category: string;
  modeTag: string;
  depthZone: 'FOREGROUND' | 'MIDGROUND' | 'BACKGROUND';
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  verticalOffset: number;
  bobAmplitude: number;
  bobFrequency: number;
  tilt: [number, number, number]; // [rotX, rotY, rotZ] in degrees
  scale: number;
  specs: {
    screen: string;
    latency: string;
    role: string;
    hapticOrSound: string;
  };
  keyFeatures: string[];
}

export type DashboardSection = 'HOME' | 'NETWORK' | 'FINANCE' | 'PRICING' | 'ANALYTICS' | 'SHELTERS' | 'AFFILIATE' | 'PROFILE' | 'ABOUT';

export type MainWorkspaceMode = 'SAFETY' | 'NETWORK';

export interface SmartMetric {
  id: string;
  label: string;
  value: string;
  secondary?: string;
  trend?: string;
  status?: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  tag?: string;
  category: 'SAFETY' | 'PARTNER';
  actionLabel?: string;
  onAction?: () => void;
}

export * from './types/finance';
export * from './types/dataEnvelope';
