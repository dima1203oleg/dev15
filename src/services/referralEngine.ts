/**
 * SIREN UA Referral Engine & Rank Calculator
 * 
 * Strict Business Rules (Master Specification):
 * - STARTER:  1–9 qualified active paid L1   -> L1 = 5%,  L2 = 0%  (L2 locked)
 * - BRONZE:   10–29 qualified active paid L1  -> L1 = 10%, L2 = 10% (L2 unlocked)
 * - SILVER:   30–74 qualified active paid L1  -> L1 = 15%, L2 = 15% (L2 unlocked)
 * - GOLD:     75–199 qualified active paid L1 -> L1 = 20%, L2 = 20% (L2 unlocked)
 * - PLATINUM: 200+ qualified active paid L1   -> L1 = 25%, L2 = 25% (L2 unlocked)
 * 
 * CRITICAL DIRECTIVES:
 * 1. Rank is determined EXCLUSIVELY by own qualified active paid L1 partners.
 * 2. L2 does NOT affect rank advancement.
 * 3. Exactly 2 financial commission levels: L1 and L2.
 * 4. Starter NEVER receives L2 commissions.
 */

export type ReferralRankId = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface ReferralTierDefinition {
  id: ReferralRankId;
  name: string;
  minL1: number;
  maxL1: number | null;
  l1Percent: number;
  l2Percent: number;
  l1Rate: number;
  l2Rate: number;
  isL2Unlocked: boolean;
  badgeLabel: string;
  description: string;
}

export const REFERRAL_TIERS: Record<ReferralRankId, ReferralTierDefinition> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    minL1: 1,
    maxL1: 9,
    l1Percent: 5,
    l2Percent: 0,
    l1Rate: 0.05,
    l2Rate: 0.00,
    isL2Unlocked: false,
    badgeLabel: 'Starter Partner',
    description: 'Стартовий рівень для нових партнерів. 5% з прямих підписок L1. L2 заблоковано до 10 L1.'
  },
  BRONZE: {
    id: 'BRONZE',
    name: 'Bronze',
    minL1: 10,
    maxL1: 29,
    l1Percent: 10,
    l2Percent: 10,
    l1Rate: 0.10,
    l2Rate: 0.10,
    isL2Unlocked: true,
    badgeLabel: 'Bronze Partner',
    description: 'Розблокування другого рівня (L2). 10% з L1 та 10% з L2.'
  },
  SILVER: {
    id: 'SILVER',
    name: 'Silver',
    minL1: 30,
    maxL1: 74,
    l1Percent: 15,
    l2Percent: 15,
    l1Rate: 0.15,
    l2Rate: 0.15,
    isL2Unlocked: true,
    badgeLabel: 'Silver Partner',
    description: 'Масштабування мережі. 15% з L1 та 15% з L2.'
  },
  GOLD: {
    id: 'GOLD',
    name: 'Gold',
    minL1: 75,
    maxL1: 199,
    l1Percent: 20,
    l2Percent: 20,
    l1Rate: 0.20,
    l2Rate: 0.20,
    isL2Unlocked: true,
    badgeLabel: 'Gold Partner',
    description: 'Лідерський рівень. 20% з L1 та 20% з L2.'
  },
  PLATINUM: {
    id: 'PLATINUM',
    name: 'Platinum',
    minL1: 200,
    maxL1: null,
    l1Percent: 25,
    l2Percent: 25,
    l1Rate: 0.25,
    l2Rate: 0.25,
    isL2Unlocked: true,
    badgeLabel: 'Platinum Partner',
    description: 'Максимальний партнерський статус. 25% з L1 та 25% з L2.'
  }
};

export const ORDERED_TIERS: ReferralTierDefinition[] = [
  REFERRAL_TIERS.STARTER,
  REFERRAL_TIERS.BRONZE,
  REFERRAL_TIERS.SILVER,
  REFERRAL_TIERS.GOLD,
  REFERRAL_TIERS.PLATINUM
];

/**
 * Calculates user rank strictly by qualified active paid L1 count.
 * L2 count is completely ignored for rank progression.
 */
export function calculateRankByL1(qualifiedL1: number): ReferralTierDefinition {
  const count = Math.max(0, qualifiedL1);
  if (count >= 200) return REFERRAL_TIERS.PLATINUM;
  if (count >= 75) return REFERRAL_TIERS.GOLD;
  if (count >= 30) return REFERRAL_TIERS.SILVER;
  if (count >= 10) return REFERRAL_TIERS.BRONZE;
  return REFERRAL_TIERS.STARTER;
}

/**
 * Returns next tier progression info
 */
export function getNextTierInfo(currentTier: ReferralTierDefinition, qualifiedL1: number): {
  nextTier: ReferralTierDefinition | null;
  remainingL1: number;
  progressPercent: number;
} {
  const currentIndex = ORDERED_TIERS.findIndex(t => t.id === currentTier.id);
  if (currentIndex === -1 || currentIndex === ORDERED_TIERS.length - 1) {
    return {
      nextTier: null,
      remainingL1: 0,
      progressPercent: 100
    };
  }

  const nextTier = ORDERED_TIERS[currentIndex + 1];
  const remainingL1 = Math.max(0, nextTier.minL1 - qualifiedL1);
  const tierSpan = nextTier.minL1 - currentTier.minL1;
  const currentInTier = qualifiedL1 - currentTier.minL1;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInTier / tierSpan) * 100)));

  return {
    nextTier,
    remainingL1,
    progressPercent
  };
}

/**
 * Calculates earnings for given L1 and L2 sales volume in UAH
 */
export function calculateCommissions(
  qualifiedL1: number,
  l1SalesVolume: number,
  l2SalesVolume: number
): {
  tier: ReferralTierDefinition;
  l1Commission: number;
  l2Commission: number;
  totalCommission: number;
  isL2Unlocked: boolean;
} {
  const tier = calculateRankByL1(qualifiedL1);
  const l1Commission = Math.round(l1SalesVolume * tier.l1Rate);
  const l2Commission = tier.isL2Unlocked ? Math.round(l2SalesVolume * tier.l2Rate) : 0;
  const totalCommission = l1Commission + l2Commission;

  return {
    tier,
    l1Commission,
    l2Commission,
    totalCommission,
    isL2Unlocked: tier.isL2Unlocked
  };
}
