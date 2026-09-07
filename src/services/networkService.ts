/**
 * SIREN UA Network & Affiliate Domain Service
 * 
 * Central source of truth for partner network operations, tree nodes,
 * graph coordinates, activity stream, and rank advancement.
 * 
 * Strictly integrates with `referralEngine.ts`.
 */

import { DataEnvelope, DataState } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';
import { calculateRankByL1, getNextTierInfo, ReferralTierDefinition } from './referralEngine';
import { getJsonFromPaths, inferDataState, isJsonObject } from './apiClient';

export interface NetworkNode {
  id: string;
  name: string;
  level: 'ME' | 'L1' | 'L2';
  avatar: string;
  earnings: string;
  rawEarningsUah: number;
  peopleCount: number;
  status: 'ACTIVE' | 'NEW' | 'TOP' | 'TRIAL';
  x: number;
  y: number;
  parentId?: string;
  parentName?: string;
  joinDate: string;
  plan: string;
  planPrice: number;
  qualifiedL1Count: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  level: 'L1' | 'L2';
}

export interface NetworkActivity {
  id: string;
  timestamp: string;
  partnerName: string;
  partnerAvatar: string;
  action: 'NEW_L1_REGISTRATION' | 'NEW_L2_REGISTRATION' | 'PLAN_UPGRADE' | 'COMMISSION_ACCRUED';
  description: string;
  amountUah?: number;
  level: 'L1' | 'L2';
}

export interface NetworkBranchStats {
  branchId: string;
  branchName: string;
  leaderName: string;
  leaderAvatar: string;
  totalMembers: number;
  l1Members: number;
  l2Members: number;
  monthlyVolumeUah: number;
  sharePercent: number;
  conversionPercent: number;
}

export interface AmbassadorProgress {
  status: 'NOT_ELIGIBLE' | 'CANDIDATE' | 'APPROVED';
  criteria: {
    minL1: number;
    currentL1: number;
    communityVerified: boolean;
    educationalContentCreated: boolean;
  };
}

export interface NetworkSummary {
  totalNetworkSize: number;
  activeL1Count: number;
  activeL2Count: number;
  new30DaysCount: number;
  conversionRatePercent: number;
  monthlyNetworkIncomeUah: number;
  qualifiedL1: number;
  currentTier: ReferralTierDefinition;
  nextTier: ReferralTierDefinition | null;
  remainingToNextRank: number;
  rankProgressPercent: number;
  ambassador: AmbassadorProgress;
  referralCode: string;
  referralUrl: string;
  trafficSources: {
    name: string;
    percent: number;
    count: number;
    color: string;
  }[];
  metricsAvailability?: {
    conversion: boolean;
    new30Days: boolean;
    monthlyIncome: boolean;
    trafficSources: boolean;
  };
}

// Master authoritative dataset for the user's partner network
const AUTHORITATIVE_PARTNER_NODES: NetworkNode[] = [
  {
    id: 'me',
    name: 'Олександр Кравчук',
    level: 'ME',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 12 460',
    rawEarningsUah: 12460,
    peopleCount: 2847,
    status: 'TOP',
    x: 50,
    y: 50,
    joinDate: '12.04.2024',
    plan: 'Premium Pro',
    planPrice: 450,
    qualifiedL1Count: 154,
  },
  // L1 Partners (Direct)
  {
    id: 'l1-1',
    name: 'Марія Коваленко',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 4 230',
    rawEarningsUah: 4230,
    peopleCount: 284,
    status: 'TOP',
    x: 50,
    y: 22,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '18.04.2024',
    plan: 'Premium Pro',
    planPrice: 450,
    qualifiedL1Count: 38,
  },
  {
    id: 'l1-2',
    name: 'Ігор Сидоренко',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 3 950',
    rawEarningsUah: 3950,
    peopleCount: 192,
    status: 'TOP',
    x: 74,
    y: 34,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '24.04.2024',
    plan: 'Premium Pro',
    planPrice: 450,
    qualifiedL1Count: 29,
  },
  {
    id: 'l1-3',
    name: 'Анна Васильченко',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 3 120',
    rawEarningsUah: 3120,
    peopleCount: 176,
    status: 'ACTIVE',
    x: 70,
    y: 68,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '02.05.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 21,
  },
  {
    id: 'l1-4',
    name: 'Дмитро Лук’яненко',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 2 460',
    rawEarningsUah: 2460,
    peopleCount: 148,
    status: 'ACTIVE',
    x: 30,
    y: 68,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '15.05.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 17,
  },
  {
    id: 'l1-5',
    name: 'Олена Поліщук',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 2 180',
    rawEarningsUah: 2180,
    peopleCount: 132,
    status: 'ACTIVE',
    x: 26,
    y: 34,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '28.05.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 15,
  },
  {
    id: 'l1-6',
    name: 'Сергій Ткаченко',
    level: 'L1',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 1 640',
    rawEarningsUah: 1640,
    peopleCount: 94,
    status: 'NEW',
    x: 50,
    y: 78,
    parentId: 'me',
    parentName: 'Олександр Кравчук',
    joinDate: '10.06.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 9,
  },
  // L2 Partners (Sub-partners)
  {
    id: 'l2-1',
    name: 'Вікторія Мороз',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 890',
    rawEarningsUah: 890,
    peopleCount: 42,
    status: 'ACTIVE',
    x: 50,
    y: 8,
    parentId: 'l1-1',
    parentName: 'Марія Коваленко',
    joinDate: '12.06.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 6,
  },
  {
    id: 'l2-2',
    name: 'Андрій Шевченко',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 720',
    rawEarningsUah: 720,
    peopleCount: 38,
    status: 'NEW',
    x: 68,
    y: 12,
    parentId: 'l1-1',
    parentName: 'Марія Коваленко',
    joinDate: '18.06.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 4,
  },
  {
    id: 'l2-3',
    name: 'Катерина Бондар',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 640',
    rawEarningsUah: 640,
    peopleCount: 29,
    status: 'ACTIVE',
    x: 88,
    y: 24,
    parentId: 'l1-2',
    parentName: 'Ігор Сидоренко',
    joinDate: '21.06.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 3,
  },
  {
    id: 'l2-4',
    name: 'Михайло Мельник',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 580',
    rawEarningsUah: 580,
    peopleCount: 24,
    status: 'ACTIVE',
    x: 92,
    y: 48,
    parentId: 'l1-2',
    parentName: 'Ігор Сидоренко',
    joinDate: '25.06.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 2,
  },
  {
    id: 'l2-5',
    name: 'Тетяна Гаврилюк',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 510',
    rawEarningsUah: 510,
    peopleCount: 21,
    status: 'ACTIVE',
    x: 85,
    y: 78,
    parentId: 'l1-3',
    parentName: 'Анна Васильченко',
    joinDate: '01.07.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 2,
  },
  {
    id: 'l2-6',
    name: 'Богдан Романюк',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 490',
    rawEarningsUah: 490,
    peopleCount: 18,
    status: 'NEW',
    x: 50,
    y: 92,
    parentId: 'l1-6',
    parentName: 'Сергій Ткаченко',
    joinDate: '04.07.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 1,
  },
  {
    id: 'l2-7',
    name: 'Юлія Костюк',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 460',
    rawEarningsUah: 460,
    peopleCount: 17,
    status: 'ACTIVE',
    x: 15,
    y: 78,
    parentId: 'l1-4',
    parentName: 'Дмитро Лук’яненко',
    joinDate: '07.07.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 1,
  },
  {
    id: 'l2-8',
    name: 'Павло Руденко',
    level: 'L2',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    earnings: '₴ 420',
    rawEarningsUah: 420,
    peopleCount: 15,
    status: 'ACTIVE',
    x: 8,
    y: 48,
    parentId: 'l1-5',
    parentName: 'Олена Поліщук',
    joinDate: '11.07.2024',
    plan: 'Standard',
    planPrice: 250,
    qualifiedL1Count: 1,
  },
];

const AUTHORITATIVE_EDGES: NetworkEdge[] = [
  { from: 'me', to: 'l1-1', level: 'L1' },
  { from: 'me', to: 'l1-2', level: 'L1' },
  { from: 'me', to: 'l1-3', level: 'L1' },
  { from: 'me', to: 'l1-4', level: 'L1' },
  { from: 'me', to: 'l1-5', level: 'L1' },
  { from: 'me', to: 'l1-6', level: 'L1' },
  { from: 'l1-1', to: 'l2-1', level: 'L2' },
  { from: 'l1-1', to: 'l2-2', level: 'L2' },
  { from: 'l1-2', to: 'l2-3', level: 'L2' },
  { from: 'l1-2', to: 'l2-4', level: 'L2' },
  { from: 'l1-3', to: 'l2-5', level: 'L2' },
  { from: 'l1-6', to: 'l2-6', level: 'L2' },
  { from: 'l1-4', to: 'l2-7', level: 'L2' },
  { from: 'l1-5', to: 'l2-8', level: 'L2' },
];

const AUTHORITATIVE_ACTIVITIES: NetworkActivity[] = [
  {
    id: 'act-1',
    timestamp: '10 хв тому',
    partnerName: 'Марія Коваленко',
    partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    action: 'COMMISSION_ACCRUED',
    description: 'Нараховано 20% комісії від підписки L1',
    amountUah: 90,
    level: 'L1',
  },
  {
    id: 'act-2',
    timestamp: '35 хв тому',
    partnerName: 'Андрій Шевченко',
    partnerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    action: 'NEW_L2_REGISTRATION',
    description: 'Новий партнер у гілці Марії Коваленко (L2)',
    level: 'L2',
  },
  {
    id: 'act-3',
    timestamp: '2 год тому',
    partnerName: 'Ігор Сидоренко',
    partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    action: 'PLAN_UPGRADE',
    description: 'Оновлення тарифу до Premium Pro. Комісія +₴ 90',
    amountUah: 90,
    level: 'L1',
  },
  {
    id: 'act-4',
    timestamp: '5 год тому',
    partnerName: 'Сергій Ткаченко',
    partnerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    action: 'NEW_L1_REGISTRATION',
    description: 'Пряма реєстрація за вашим реферальним кодом OLEKSANDR25',
    level: 'L1',
  },
];

const AUTHORITATIVE_BRANCHES: NetworkBranchStats[] = [
  {
    branchId: 'br-1',
    branchName: 'Гілка Марії Коваленко',
    leaderName: 'Марія Коваленко',
    leaderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    totalMembers: 284,
    l1Members: 38,
    l2Members: 246,
    monthlyVolumeUah: 34800,
    sharePercent: 38.2,
    conversionPercent: 18.4,
  },
  {
    branchId: 'br-2',
    branchName: 'Гілка Ігоря Сидоренка',
    leaderName: 'Ігор Сидоренко',
    leaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    totalMembers: 192,
    l1Members: 29,
    l2Members: 163,
    monthlyVolumeUah: 28200,
    sharePercent: 26.5,
    conversionPercent: 15.2,
  },
  {
    branchId: 'br-3',
    branchName: 'Гілка Анни Васильченко',
    leaderName: 'Анна Васильченко',
    leaderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    totalMembers: 176,
    l1Members: 21,
    l2Members: 155,
    monthlyVolumeUah: 21400,
    sharePercent: 19.8,
    conversionPercent: 12.8,
  },
];

class NetworkService {
  private qualifiedL1 = 154; // Master value: Gold Partner (75-199 L1)
  private totalNetworkSize = 2847;
  private activeL1Count = 247;
  private activeL2Count = 2600;
  private new30DaysCount = 84;
  private conversionRate = 13.8;
  private monthlyEarnings = 12460;
  private referralCode = 'OLEKSANDR25';

  private now(): string {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }

  private referralQuery(): string {
    if (!runtimeConfig.referralAppleUserId) throw new Error('REFERRAL_USER_NOT_CONFIGURED');
    return `?apple_user_id=${encodeURIComponent(runtimeConfig.referralAppleUserId)}`;
  }

  private notConnected<T>(source: string): DataEnvelope<T> {
    return {
      data: null,
      state: 'NOT_CONNECTED',
      source,
      updatedAt: this.now(),
      isRealData: false,
      error: 'Partner API is not connected or returned an invalid payload',
    };
  }

  private buildSummary(overrides: Partial<NetworkSummary> = {}): NetworkSummary {
    const qualifiedL1 = Number.isFinite(overrides.qualifiedL1) ? Number(overrides.qualifiedL1) : this.qualifiedL1;
    const currentTier = calculateRankByL1(qualifiedL1);
    const progression = getNextTierInfo(currentTier, qualifiedL1);
    const defaultTrafficSources = [
      { name: 'TikTok', percent: 38, count: 1082, color: '#2563EB' },
      { name: 'Instagram', percent: 24, count: 683, color: '#8B5CF6' },
      { name: 'YouTube', percent: 16, count: 456, color: '#EF4444' },
      { name: 'Telegram', percent: 12, count: 342, color: '#38BDF8' },
      { name: 'Інше', percent: 10, count: 284, color: '#94A3B8' },
    ];

    return {
      totalNetworkSize: overrides.totalNetworkSize ?? this.totalNetworkSize,
      activeL1Count: overrides.activeL1Count ?? this.activeL1Count,
      activeL2Count: overrides.activeL2Count ?? this.activeL2Count,
      new30DaysCount: overrides.new30DaysCount ?? this.new30DaysCount,
      conversionRatePercent: overrides.conversionRatePercent ?? this.conversionRate,
      monthlyNetworkIncomeUah: overrides.monthlyNetworkIncomeUah ?? this.monthlyEarnings,
      qualifiedL1,
      currentTier,
      nextTier: progression.nextTier,
      remainingToNextRank: progression.remainingL1,
      rankProgressPercent: progression.progressPercent,
      ambassador: overrides.ambassador ?? {
        status: 'CANDIDATE',
        criteria: {
          minL1: 500,
          currentL1: qualifiedL1,
          communityVerified: true,
          educationalContentCreated: true,
        },
      },
      referralCode: overrides.referralCode ?? this.referralCode,
      referralUrl: overrides.referralUrl ?? `https://siren.ua/r/${this.referralCode}`,
      trafficSources: overrides.trafficSources ?? defaultTrafficSources,
      metricsAvailability: overrides.metricsAvailability ?? {
        conversion: true,
        new30Days: true,
        monthlyIncome: true,
        trafficSources: true,
      },
    };
  }

  /**
   * Returns unified summary data envelope
   */
  public async getNetworkSummary(): Promise<DataEnvelope<NetworkSummary>> {
    const updatedAt = this.now();

    try {
      const remote = await getJsonFromPaths<unknown>([
        `/api/referral/stats${this.referralQuery()}`,
        '/api/partner/dashboard',
        '/api/v1/partner/summary',
      ], 2500);
      if (!isJsonObject(remote)) throw new Error('Partner summary has invalid shape');

      // Native ThreatServer referral contract: stats are authoritative and
      // deliberately contain USD values. Do not fabricate UAH conversions.
      if (typeof remote.referral_code === 'string' && typeof remote.total_network_size === 'number') {
        const activeSubscribers = Number(remote.active_subscribers ?? 0);
        const totalNetworkSize = Number(remote.total_network_size ?? 0);
        const totalReferrals = Number(remote.total_referrals ?? 0);
        const qualifiedL1 = activeSubscribers;
        const remoteSummary = this.buildSummary({
          totalNetworkSize,
          activeL1Count: totalReferrals,
          activeL2Count: Math.max(0, totalNetworkSize - totalReferrals),
          new30DaysCount: 0,
          conversionRatePercent: totalReferrals > 0 ? (activeSubscribers / totalReferrals) * 100 : 0,
          monthlyNetworkIncomeUah: 0,
          qualifiedL1,
          referralCode: remote.referral_code,
          referralUrl: `https://siren.ua/r/${remote.referral_code}`,
          trafficSources: [],
          metricsAvailability: { conversion: true, new30Days: false, monthlyIncome: false, trafficSources: false },
        });
        const state = inferDataState(remote);
        if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        return { data: remoteSummary, state, source: 'SIREN_UA_REFERRAL_STATS', updatedAt, isRealData: state === 'LIVE' };
      }

      const partner = isJsonObject(remote.partner) ? remote.partner : remote;
      const rankProgress = isJsonObject(remote.rankProgress) ? remote.rankProgress : null;
      const qualifiedL1 = Number(partner.activeL1PaidCount ?? remote.qualifiedL1);
      const totalL1 = Number(partner.totalL1Count ?? remote.totalL1Count);
      const totalL2 = Number(partner.totalL2Count ?? remote.totalL2Count);
      const activeL1 = Number(partner.activeL1PaidCount ?? remote.activeL1Count);
      const activeL2 = Number(partner.activeL2PaidCount ?? remote.activeL2Count);
      if (![qualifiedL1, totalL1, totalL2, activeL1, activeL2].every(Number.isFinite)) {
        throw new Error('Partner dashboard is missing required network fields');
      }

      const requiredNumericFields = [
        qualifiedL1,
        totalL1,
        totalL2,
        activeL1,
        activeL2,
      ];
      if (requiredNumericFields.some((field) => typeof field !== 'number' || !Number.isFinite(field))) {
        throw new Error('Partner summary is missing required numeric fields');
      }

      const remoteSummary = this.buildSummary({
        totalNetworkSize: totalL1 + totalL2,
        activeL1Count: activeL1,
        activeL2Count: activeL2,
        new30DaysCount: 0,
        conversionRatePercent: 0,
        monthlyNetworkIncomeUah: typeof remote.monthlyNetworkIncomeUah === 'number' ? remote.monthlyNetworkIncomeUah : 0,
        qualifiedL1,
        referralCode: typeof partner.referralCode === 'string' ? partner.referralCode : undefined,
        referralUrl: typeof partner.referralCode === 'string' ? `https://siren.ua/r/${partner.referralCode}` : undefined,
        trafficSources: Array.isArray(remote.trafficSources)
          ? remote.trafficSources.filter((source): source is NetworkSummary['trafficSources'][number] => (
            isJsonObject(source)
            && typeof source.name === 'string'
            && typeof source.percent === 'number'
            && Number.isFinite(source.percent)
            && typeof source.count === 'number'
            && Number.isFinite(source.count)
            && typeof source.color === 'string'
          ))
          : [],
        metricsAvailability: {
          conversion: typeof remote.conversionRatePercent === 'number',
          new30Days: typeof remote.new30DaysCount === 'number',
          monthlyIncome: typeof remote.monthlyNetworkIncomeUah === 'number',
          trafficSources: Array.isArray(remote.trafficSources),
        },
      });

      const state = inferDataState(remote);
      if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
      return {
        data: remoteSummary,
        state,
        source: 'SIREN_UA_PARTNER_SUMMARY',
        updatedAt,
        isRealData: state === 'LIVE',
      };
    } catch {
      if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) return this.notConnected<NetworkSummary>('SIREN_UA_PARTNER_SUMMARY');
      // Local development remains useful, but explicitly labels the local dataset as DEMO.
    }

    const summary = this.buildSummary();

    return {
      data: summary,
      state: 'DEMO',
      source: 'LOCAL_DEMO_NETWORK_DATA',
      updatedAt,
      isRealData: false,
    };
  }

  /**
   * Returns graph nodes and relational edges
   */
  public async getNetworkGraph(): Promise<DataEnvelope<{ nodes: NetworkNode[]; edges: NetworkEdge[] }>> {
    try {
        const remote = await getJsonFromPaths<unknown>([
          `/api/referral/tree${this.referralQuery()}&max_depth=2`,
          '/api/partner/network',
          '/api/v1/partner/network',
        ], 2500);
        if (!isJsonObject(remote)) throw new Error('Partner network has invalid shape');
        if (isJsonObject(remote.user) && Array.isArray(remote.children)) {
          const root = remote;
          const nodes: NetworkNode[] = [{
            id: String(isJsonObject(root.user) ? root.user.id ?? 'me' : 'me'),
            name: isJsonObject(root.user) && typeof root.user.display_name === 'string' ? root.user.display_name : 'Моя мережа',
            level: 'ME', avatar: '', earnings: '—', rawEarningsUah: 0,
            peopleCount: Number(root.network_size ?? 0), status: 'ACTIVE', x: 50, y: 50,
            joinDate: '', plan: 'Premium', planPrice: 0, qualifiedL1Count: 0,
          }];
          const edges: NetworkEdge[] = [];
          const walk = (children: unknown[], parentId: string, depth: 1 | 2) => children.filter(isJsonObject).forEach((child, index) => {
            const user = isJsonObject(child.user) ? child.user : {};
            const id = String(user.id ?? `ref-${depth}-${index}`);
            const level = depth === 1 ? 'L1' : 'L2';
            nodes.push({
              id, name: typeof user.display_name === 'string' && user.display_name ? user.display_name : 'Партнер',
              level, avatar: '', earnings: '—', rawEarningsUah: 0,
              peopleCount: Number(child.network_size ?? child.children_count ?? 1),
              status: user.is_active_subscriber === true ? 'ACTIVE' : 'TRIAL',
              x: depth === 1 ? 25 + index * 25 : 15 + index * 14, y: depth === 1 ? 30 : 70,
              parentId, parentName: '', joinDate: '', plan: 'Premium', planPrice: 0, qualifiedL1Count: 0,
            });
            edges.push({ from: parentId, to: id, level });
            if (depth === 1 && Array.isArray(child.children)) walk(child.children, id, 2);
          });
          walk(remote.children, nodes[0].id, 1);
          const state = inferDataState(remote);
          if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
          return { data: { nodes, edges }, state, source: 'SIREN_UA_REFERRAL_TREE', updatedAt: this.now(), isRealData: state === 'LIVE' };
        }
        if (!Array.isArray(remote.nodes) || !Array.isArray(remote.edges)) {
          const l1 = isJsonObject(remote.l1) ? remote.l1 : null;
          const l2 = isJsonObject(remote.l2) ? remote.l2 : null;
          if (!l1 || !l2 || typeof l1.count !== 'number' || typeof l2.count !== 'number') {
            throw new Error('Partner network has invalid aggregate shape');
          }
          const dashboard = await getJsonFromPaths<unknown>(['/api/partner/dashboard'], 2500).catch(() => null);
          const dashboardPartner = isJsonObject(dashboard) && isJsonObject(dashboard.partner) ? dashboard.partner : null;
          const l1Total = dashboardPartner && typeof dashboardPartner.totalL1Count === 'number' ? dashboardPartner.totalL1Count : l1.count;
          const l2Total = dashboardPartner && typeof dashboardPartner.totalL2Count === 'number' ? dashboardPartner.totalL2Count : l2.count;
          const qualifiedL1 = dashboardPartner && typeof dashboardPartner.activeL1PaidCount === 'number'
            ? dashboardPartner.activeL1PaidCount
            : typeof l1.activePaidCount === 'number' ? l1.activePaidCount : 0;
          const nodes: NetworkNode[] = [
            {
              id: 'me', name: 'Моя мережа', level: 'ME', avatar: '', earnings: '—', rawEarningsUah: 0,
              peopleCount: l1Total + l2Total, status: 'TOP', x: 50, y: 50, joinDate: '', plan: 'Aggregate', planPrice: 0, qualifiedL1Count: qualifiedL1,
            },
            {
              id: 'l1-aggregate', name: 'L1 · прямі партнери', level: 'L1', avatar: '', earnings: '—', rawEarningsUah: 0,
              peopleCount: l1Total, status: 'ACTIVE', x: 28, y: 35, parentId: 'me', parentName: 'Моя мережа', joinDate: '', plan: 'Aggregate', planPrice: 0, qualifiedL1Count: qualifiedL1,
            },
            {
              id: 'l2-aggregate', name: 'L2 · мережа другого рівня', level: 'L2', avatar: '', earnings: '—', rawEarningsUah: 0,
              peopleCount: l2Total, status: 'ACTIVE', x: 72, y: 35, parentId: 'me', parentName: 'Моя мережа', joinDate: '', plan: 'Aggregate', planPrice: 0, qualifiedL1Count: 0,
            },
          ];
          const edges: NetworkEdge[] = [
            { from: 'me', to: 'l1-aggregate', level: 'L1' },
            { from: 'me', to: 'l2-aggregate', level: 'L2' },
          ];
          const state = inferDataState(remote);
          if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
          return {
            data: { nodes, edges },
            state,
            source: 'SIREN_UA_PARTNER_NETWORK_AGGREGATE',
            updatedAt: this.now(),
            isRealData: state === 'LIVE',
          };
        }
        const state = inferDataState(remote);
        if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        return {
          data: { nodes: remote.nodes as NetworkNode[], edges: remote.edges as NetworkEdge[] },
          state,
          source: 'SIREN_UA_PARTNER_NETWORK',
          updatedAt: this.now(),
          isRealData: state === 'LIVE',
        };
    } catch {
      if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) return this.notConnected<{ nodes: NetworkNode[]; edges: NetworkEdge[] }>('SIREN_UA_PARTNER_NETWORK');
    }

    return {
      data: {
        nodes: AUTHORITATIVE_PARTNER_NODES,
        edges: AUTHORITATIVE_EDGES,
      },
      state: 'DEMO',
      source: 'LOCAL_DEMO_NETWORK_DATA',
      updatedAt: this.now(),
      isRealData: false,
    };
  }

  /**
   * Returns list of partners filtered by level and search
   */
  public async getNetworkPartners(levelFilter: 'ALL' | 'L1' | 'L2' = 'ALL', search: string = ''): Promise<DataEnvelope<NetworkNode[]>> {
    try {
        const query = new URLSearchParams({ level: levelFilter, search: search.trim() });
        const remote = await getJsonFromPaths<unknown>([
          `/api/partner/network?${query.toString()}`,
          `/api/v1/partner/network/partners?${query.toString()}`,
        ], 2500);
        const sourceItems = Array.isArray(remote)
          ? remote
          : isJsonObject(remote)
            ? [
                ...(isJsonObject(remote) && isJsonObject(remote.l1) && Array.isArray(remote.l1.items) ? remote.l1.items : []),
                ...(isJsonObject(remote) && isJsonObject(remote.l2) && Array.isArray(remote.l2.items) ? remote.l2.items : []),
              ]
            : [];
        if (!sourceItems.length && isJsonObject(remote) && !('l1' in remote) && !('l2' in remote)) throw new Error('Partner list has invalid shape');
        const nodes = sourceItems.map((item, index): NetworkNode => {
          const row = isJsonObject(item) ? item : {};
          const level = row.referralLevel === 'L2' || row.level === 'L2' ? 'L2' : 'L1';
          const qualified = row.isQualifiedPaid === true;
          return {
            id: typeof row.id === 'string' ? row.id : `partner-${index}`,
            name: typeof row.userAnonymousLabel === 'string' ? row.userAnonymousLabel : 'Партнер без ідентифікації',
            level,
            avatar: '',
            earnings: '—',
            rawEarningsUah: 0,
            peopleCount: 1,
            status: qualified ? 'ACTIVE' : 'TRIAL',
            x: 20 + (index % 5) * 15,
            y: level === 'L1' ? 30 : 70,
            parentId: level === 'L1' ? 'me' : 'l1-aggregate',
            parentName: level === 'L1' ? 'Моя мережа' : 'L1 · прямі партнери',
            joinDate: typeof row.registeredAt === 'string' ? row.registeredAt : '',
            plan: typeof row.subscriptionPlan === 'string' ? row.subscriptionPlan : '—',
            planPrice: typeof row.monthlyQcbMinor === 'number' ? row.monthlyQcbMinor / 100 : 0,
            qualifiedL1Count: 0,
          };
        });
        const state = inferDataState(remote);
        if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        return {
          data: nodes,
          state,
          source: 'SIREN_UA_PARTNER_NETWORK_PARTNERS',
          updatedAt: this.now(),
          isRealData: state === 'LIVE',
        };
    } catch {
      if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) return this.notConnected<NetworkNode[]>('SIREN_UA_PARTNER_NETWORK_PARTNERS');
    }

    let filtered = AUTHORITATIVE_PARTNER_NODES.filter(n => n.level !== 'ME');
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(n => n.level === levelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(n => n.name.toLowerCase().includes(q) || n.plan.toLowerCase().includes(q));
    }

    return {
      data: filtered,
      state: 'DEMO',
      source: 'LOCAL_DEMO_NETWORK_DATA',
      updatedAt: this.now(),
      isRealData: false,
    };
  }

  /**
   * Returns real-time activity stream
   */
  public async getNetworkActivity(): Promise<DataEnvelope<NetworkActivity[]>> {
    if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) {
      try {
        const remote = await getJsonFromPaths<unknown>([
          '/api/partner/activity',
          '/api/v1/partner/activity',
        ], 2500);
        if (!Array.isArray(remote)) throw new Error('Partner activity has invalid shape');
        return {
          data: remote as NetworkActivity[],
          state: 'LIVE',
          source: 'SIREN_UA_PARTNER_ACTIVITY',
          updatedAt: this.now(),
          isRealData: true,
        };
      } catch {
        return this.notConnected<NetworkActivity[]>('SIREN_UA_PARTNER_ACTIVITY');
      }
    }

    return {
      data: AUTHORITATIVE_ACTIVITIES,
      state: 'DEMO',
      source: 'LOCAL_DEMO_NETWORK_DATA',
      updatedAt: this.now(),
      isRealData: false,
    };
  }

  /**
   * Returns branch breakdown
   */
  public async getBranchStats(): Promise<DataEnvelope<NetworkBranchStats[]>> {
    if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) {
      try {
        const remote = await getJsonFromPaths<unknown>([
          '/api/partner/branches',
          '/api/v1/partner/branches',
        ], 2500);
        if (!Array.isArray(remote)) throw new Error('Partner branches have invalid shape');
        return {
          data: remote as NetworkBranchStats[],
          state: 'LIVE',
          source: 'SIREN_UA_PARTNER_BRANCHES',
          updatedAt: this.now(),
          isRealData: true,
        };
      } catch {
        return this.notConnected<NetworkBranchStats[]>('SIREN_UA_PARTNER_BRANCHES');
      }
    }

    return {
      data: AUTHORITATIVE_BRANCHES,
      state: 'DEMO',
      source: 'LOCAL_DEMO_NETWORK_DATA',
      updatedAt: this.now(),
      isRealData: false,
    };
  }
}

export const networkService = new NetworkService();
