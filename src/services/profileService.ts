/**
 * SIREN UA User Profile & Account Domain Service
 * 
 * Manages authenticated user profile, identity verification status,
 * partner accreditation, and settings persistence.
 * 
 * Strictly integrates with `referralEngine.ts`.
 */

import { DataEnvelope } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';
import { calculateRankByL1, getNextTierInfo, ReferralTierDefinition } from './referralEngine';
import { getJsonFromPaths, inferDataState, isJsonObject } from './apiClient';

export interface UserProfileData {
  id: string;
  partnerId: string;
  partnerCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  regionId: string;
  avatarUrl: string;
  registrationDate: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  qualifiedL1: number;
  totalNetworkCount: number;
  currentRank: ReferralTierDefinition;
  nextRank: ReferralTierDefinition | null;
  remainingL1ToNextRank: number;
  rankProgressPercent: number;
  ambassadorStatus: 'NOT_ELIGIBLE' | 'CANDIDATE' | 'APPROVED';
  ambassadorTitle: string;
}

const DEFAULT_PROFILE: UserProfileData = {
  id: 'demo-profile',
  partnerId: 'partner-demo',
  partnerCode: 'DEMO',
  fullName: 'Демонстраційний профіль',
  firstName: 'Демо',
  lastName: 'користувач',
  email: '',
  phone: '',
  city: '',
  regionId: 'odesa',
  avatarUrl: '',
  registrationDate: '',
  isEmailVerified: false,
  isPhoneVerified: false,
  qualifiedL1: 154,
  totalNetworkCount: 2847,
  currentRank: calculateRankByL1(154),
  nextRank: getNextTierInfo(calculateRankByL1(154), 154).nextTier,
  remainingL1ToNextRank: getNextTierInfo(calculateRankByL1(154), 154).remainingL1, // 46 for Platinum
  rankProgressPercent: getNextTierInfo(calculateRankByL1(154), 154).progressPercent, // 63%
  ambassadorStatus: 'CANDIDATE',
  ambassadorTitle: 'Кандидат у Бренд-Амбасадори',
};

class ProfileService {
  private profile: UserProfileData = DEFAULT_PROFILE;

  public async getProfile(): Promise<DataEnvelope<UserProfileData>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

    if (!runtimeConfig.apiBaseUrl && !runtimeConfig.allowDemoData) {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_PROFILE_API',
        updatedAt,
        isRealData: false,
        error: 'Профільний API не підключений',
      };
    }

    // ThreatServer's canonical identity is the referral user returned by
    // /api/referral/me. The legacy profile/dashboard routes do not expose this
    // account, so resolve the referral profile first when an identity is set.
    if (runtimeConfig.apiBaseUrl && runtimeConfig.referralAppleUserId) {
      try {
        const query = `?apple_user_id=${encodeURIComponent(runtimeConfig.referralAppleUserId)}`;
        const [remoteUser, remoteStats] = await Promise.all([
          getJsonFromPaths<unknown>([`/api/referral/me${query}`], 2500),
          getJsonFromPaths<unknown>([`/api/referral/stats${query}`], 2500),
        ]);
        if (!isJsonObject(remoteUser) || typeof remoteUser.id !== 'number' || typeof remoteUser.display_name !== 'string') {
          throw new Error('Referral profile payload has invalid shape');
        }
        const stats = isJsonObject(remoteStats) ? remoteStats : {};
        const qualifiedL1 = Number(stats.active_subscribers ?? 0);
        const totalNetworkCount = Number(stats.total_network_size ?? remoteUser.total_network_size ?? 0);
        const currentRank = calculateRankByL1(qualifiedL1);
        const progression = getNextTierInfo(currentRank, qualifiedL1);
        const names = remoteUser.display_name.trim().split(/\s+/);
        const data: UserProfileData = {
          ...this.profile,
          id: String(remoteUser.id),
          partnerId: String(remoteUser.id),
          partnerCode: typeof remoteUser.referral_code === 'string' ? remoteUser.referral_code : '',
          fullName: remoteUser.display_name,
          firstName: names[0] || remoteUser.display_name,
          lastName: names.slice(1).join(' '),
          email: typeof remoteUser.email === 'string' ? remoteUser.email : '',
          registrationDate: typeof remoteUser.registered_at === 'string' ? remoteUser.registered_at : '',
          qualifiedL1,
          totalNetworkCount,
          currentRank,
          nextRank: progression.nextTier,
          remainingL1ToNextRank: progression.remainingL1,
          rankProgressPercent: progression.progressPercent,
          ambassadorStatus: 'NOT_ELIGIBLE',
          ambassadorTitle: 'Статус не досягнуто',
        };
        this.profile = data;
        return { data, state: 'LIVE', source: 'SIREN_UA_REFERRAL_PROFILE', updatedAt, isRealData: true };
      } catch {
        // Fall through to legacy adapters so deployments with an older API
        // remain compatible.
      }
    }

    try {
      const remote = await getJsonFromPaths<unknown>([
        '/api/profile/me',
        '/api/v1/profile/me',
        '/api/partner/dashboard',
      ], 2500);
      if (!isJsonObject(remote) || typeof remote.id !== 'string' || typeof remote.fullName !== 'string' || typeof remote.qualifiedL1 !== 'number') {
        const partner = isJsonObject(remote) && isJsonObject(remote.partner) ? remote.partner : null;
        if (!partner || typeof partner.id !== 'string' || typeof partner.activeL1PaidCount !== 'number') {
          throw new Error('Profile payload has invalid shape');
        }
        const qualifiedL1 = partner.activeL1PaidCount;
        const currentRank = calculateRankByL1(qualifiedL1);
        const progression = getNextTierInfo(currentRank, qualifiedL1);
        const data: UserProfileData = {
          id: typeof partner.userId === 'string' ? partner.userId : partner.id,
          partnerId: partner.id,
          partnerCode: typeof partner.referralCode === 'string' ? partner.referralCode : '',
          // The canonical partner dashboard intentionally does not expose PII.
          fullName: 'Партнерський профіль',
          firstName: 'Партнер',
          lastName: '',
          email: '',
          phone: '',
          city: '',
          regionId: '',
          avatarUrl: '',
          registrationDate: typeof partner.createdAt === 'string' ? partner.createdAt : '',
          isEmailVerified: false,
          isPhoneVerified: false,
          qualifiedL1,
          totalNetworkCount: Number(partner.totalL1Count ?? 0) + Number(partner.totalL2Count ?? 0),
          currentRank,
          nextRank: progression.nextTier,
          remainingL1ToNextRank: progression.remainingL1,
          rankProgressPercent: progression.progressPercent,
          ambassadorStatus: partner.isAmbassadorApproved === true ? 'APPROVED' : partner.ambassadorTier === 'CANDIDATE' ? 'CANDIDATE' : 'NOT_ELIGIBLE',
          ambassadorTitle: partner.isAmbassadorApproved === true ? 'Амбасадор' : partner.ambassadorTier === 'CANDIDATE' ? 'Кандидат у амбасадори' : 'Статус не досягнуто',
        };
        return {
          data,
          state: inferDataState(remote),
          source: 'SIREN_UA_DEV15_PARTNER_DASHBOARD',
          updatedAt,
          isRealData: inferDataState(remote) === 'LIVE',
        };
      }

      const currentRank = calculateRankByL1(remote.qualifiedL1);
      const progression = getNextTierInfo(currentRank, remote.qualifiedL1);
      const data: UserProfileData = {
        ...this.profile,
        ...remote,
        currentRank,
        nextRank: progression.nextTier,
        remainingL1ToNextRank: progression.remainingL1,
        rankProgressPercent: progression.progressPercent,
      } as UserProfileData;

      return {
        data,
        state: 'LIVE',
        source: 'SIREN_UA_PROFILE_API',
        updatedAt,
        isRealData: true,
      };
    } catch {
      if (runtimeConfig.apiBaseUrl || !runtimeConfig.allowDemoData) {
        return {
          data: null,
          state: 'NOT_CONNECTED',
          source: 'SIREN_UA_PROFILE_API',
          updatedAt,
          isRealData: false,
          error: 'Профільний API не підключений або повернув некоректну відповідь',
        };
      }
      // Local development keeps a clearly labelled DEMO profile.
    }

    const currentRank = calculateRankByL1(this.profile.qualifiedL1);
    const progression = getNextTierInfo(currentRank, this.profile.qualifiedL1);
    const data: UserProfileData = {
      ...this.profile,
      currentRank,
      nextRank: progression.nextTier,
      remainingL1ToNextRank: progression.remainingL1,
      rankProgressPercent: progression.progressPercent,
    };

    return {
      data,
      state: 'DEMO',
      source: 'LOCAL_DEMO_PROFILE_DATA',
      updatedAt,
      isRealData: false,
    };
  }

  public updateProfile(updates: Partial<UserProfileData>): UserProfileData {
    this.profile = { ...this.profile, ...updates };
    return this.profile;
  }
}

export const profileService = new ProfileService();
