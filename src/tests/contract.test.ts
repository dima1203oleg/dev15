/**
 * SIREN UA Cross-Repository Contract Tests
 * 
 * Verifies:
 * 1. Referral tier rules match Master Prompt section 8 (L1 only rank, 2 levels, L2 locked for starter).
 * 2. ThreatServer API schemas and backward-compatible additive structures.
 * 3. Financial summary view models.
 * 4. Shelter geo-query and response contracts.
 */

import { calculateRankByL1, calculateCommissions, REFERRAL_TIERS } from '../services/referralEngine';
import { INITIAL_REGIONS } from '../data/ukraineMapData';
import { INITIAL_TRAJECTORIES } from '../data/spatialThreatData';
import { calculateCompensation, calculateQcb } from '../services/compensationEngine';
import { threatServerService } from '../services/threatServerService';
import { inferDataState } from '../services/apiClient';

export interface ContractTestResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
}

export function runAllContractTests(): {
  total: number;
  passed: number;
  failed: number;
  results: ContractTestResult[];
} {
  const results: ContractTestResult[] = [];

  // Helper
  const assert = (condition: boolean, suite: string, name: string, errMsg?: string) => {
    results.push({
      suite,
      name,
      passed: !!condition,
      message: condition ? undefined : (errMsg || 'Assertion failed')
    });
  };

  // --- SUITE 1: REFERRAL TIER RULES (Section 8) ---
  const s1 = 'Referral Model & Rank Rules';
  
  // Rule 1: Starter (1-9 L1) -> 5% L1, 0% L2, L2 locked
  const starterRank = calculateRankByL1(5);
  assert(starterRank.id === 'STARTER', s1, '5 L1 should yield STARTER rank');
  assert(starterRank.l1Percent === 5, s1, 'STARTER L1 percent must be 5%');
  assert(starterRank.l2Percent === 0, s1, 'STARTER L2 percent must be 0%');
  assert(starterRank.isL2Unlocked === false, s1, 'STARTER must have L2 locked');

  // Boundary: zero and threshold transitions must be deterministic.
  assert(calculateRankByL1(0).id === 'STARTER', s1, '0 L1 should remain STARTER without negative rank state');
  assert(calculateRankByL1(9).id === 'STARTER', s1, '9 L1 should remain STARTER');
  assert(calculateRankByL1(10).id === 'BRONZE', s1, '10 L1 should upgrade to BRONZE');

  // Rule 2: Bronze (10-29 L1) -> 10% L1, 10% L2, L2 unlocked
  const bronzeRank = calculateRankByL1(15);
  assert(bronzeRank.id === 'BRONZE', s1, '15 L1 should yield BRONZE rank');
  assert(bronzeRank.l1Percent === 10, s1, 'BRONZE L1 percent must be 10%');
  assert(bronzeRank.l2Percent === 10, s1, 'BRONZE L2 percent must be 10%');
  assert(bronzeRank.isL2Unlocked === true, s1, 'BRONZE must have L2 unlocked');

  // Rule 3: Silver (30-74 L1) -> 15% L1, 15% L2
  const silverRank = calculateRankByL1(45);
  assert(silverRank.id === 'SILVER', s1, '45 L1 should yield SILVER rank');
  assert(silverRank.l1Percent === 15, s1, 'SILVER L1 percent must be 15%');
  assert(silverRank.l2Percent === 15, s1, 'SILVER L2 percent must be 15%');

  // Rule 4: Gold (75-199 L1) -> 20% L1, 20% L2
  const goldRank = calculateRankByL1(100);
  assert(goldRank.id === 'GOLD', s1, '100 L1 should yield GOLD rank');
  assert(goldRank.l1Percent === 20, s1, 'GOLD L1 percent must be 20%');
  assert(goldRank.l2Percent === 20, s1, 'GOLD L2 percent must be 20%');

  // Rule 5: Platinum (200+ L1) -> 25% L1, 25% L2
  const platRank = calculateRankByL1(250);
  assert(platRank.id === 'PLATINUM', s1, '250 L1 should yield PLATINUM rank');
  assert(platRank.l1Percent === 25, s1, 'PLATINUM L1 percent must be 25%');
  assert(platRank.l2Percent === 25, s1, 'PLATINUM L2 percent must be 25%');

  // Rule 6: Starter earning calculation ignores L2 sales
  const starterCalc = calculateCommissions(5, 10000, 50000);
  assert(starterCalc.l1Commission === 500, s1, 'STARTER 5% on 10000 = 500');
  assert(starterCalc.l2Commission === 0, s1, 'STARTER L2 commission must be 0 even with L2 sales');

  // Rule 7: Gold earning calculation computes both 20% L1 and 20% L2
  const goldCalc = calculateCommissions(80, 10000, 10000);
  assert(goldCalc.l1Commission === 2000, s1, 'GOLD 20% on 10000 = 2000');
  assert(goldCalc.l2Commission === 2000, s1, 'GOLD 20% on 10000 = 2000');
  assert(goldCalc.totalCommission === 4000, s1, 'GOLD total = 4000');

  // The same QCB should never produce different results for the same rank.
  const repeatGoldCalc = calculateCommissions(80, 10000, 10000);
  assert(JSON.stringify(goldCalc) === JSON.stringify(repeatGoldCalc), s1, 'Commission calculation must be deterministic');

  // QCB and hard cap must be calculated before ledger integration.
  const qcb = calculateQcb({
    grossMinorUnits: 100,
    platformCostsMinorUnits: 10,
    processingCostsMinorUnits: 5,
  });
  assert(qcb.qcbMinorUnits === 85, s1, 'QCB must subtract configured non-commissionable deductions');

  const platinumCap = calculateCompensation({
    qcbMinorUnits: 100,
    directRank: 'PLATINUM',
    secondLevelRank: 'PLATINUM',
  });
  assert(platinumCap.status === 'OK', s1, 'Platinum + Platinum must pass the 50% cap');
  assert(platinumCap.totalAllocationMinorUnits === 50, s1, 'Platinum + Platinum must allocate exactly 50% of QCB');

  const failedCap = calculateCompensation({
    qcbMinorUnits: 100,
    directRank: 'PLATINUM',
    secondLevelRank: 'PLATINUM',
    promoAllocationBps: 500,
  });
  assert(failedCap.status === 'CAP_VALIDATION_FAILED', s1, 'Allocations above 50% must not produce commission entries');

  // --- SUITE 2: THREATSERVER API CONTRACTS ---
  const s2 = 'ThreatServer API Contracts';
  
  // All regions must have valid ISO / Oblast IDs and threat fields
  assert(INITIAL_REGIONS.length === 27, s2, 'Must have all 27 Ukrainian administrative units (24 oblasts + Kyiv + Sevastopol + Crimea)');
  const odesa = INITIAL_REGIONS.find(r => r.id === 'odesa');
  assert(!!odesa, s2, 'Odesa region must exist in dataset');
  assert(typeof odesa?.isAlarm === 'boolean', s2, 'isAlarm must be boolean');
  assert(typeof odesa?.name === 'string', s2, 'name must be string');

  // Spatial trajectories
  assert(INITIAL_TRAJECTORIES.length > 0, s2, 'Spatial trajectories dataset must have active vector entries');
  const traj1 = INITIAL_TRAJECTORIES[0];
  assert(typeof traj1.id === 'string', s2, 'Trajectory id must be string');
  assert(typeof traj1.pathD === 'string', s2, 'Trajectory pathD must be SVG curve path string');
  assert(traj1.pathD.length > 5, s2, 'Trajectory pathD must have SVG curve coordinates');

  // A threat response must not invent shelter proximity when the shelter
  // registry was not part of the payload. Demo is the only state allowed to
  // use the local illustrative catalog.
  const disconnectedScene = threatServerService.normalizeThreatScene(INITIAL_REGIONS, [], 'odesa', 'NOT_CONNECTED', '—');
  const demoScene = threatServerService.normalizeThreatScene(INITIAL_REGIONS, [], 'odesa', 'DEMO', '—');
  const cachedScene = threatServerService.normalizeThreatScene(INITIAL_REGIONS, [], 'odesa', 'CACHED', '14:32');
  const staleScene = threatServerService.normalizeThreatScene(INITIAL_REGIONS, [], 'odesa', 'STALE', '13:10');
  assert(disconnectedScene.nearestShelter === null, s2, 'NOT_CONNECTED threat scene must not expose a fake nearest shelter');
  assert(demoScene.nearestShelter !== null, s2, 'DEMO threat scene may expose an explicitly local shelter catalog');
  assert(cachedScene.dataMode === 'CACHED' && cachedScene.freshness === 'STABLE', s2, 'CACHED threat scene must remain visibly cached');
  assert(staleScene.dataMode === 'STALE' && staleScene.freshness === 'STALE', s2, 'STALE threat scene must remain visibly stale');

  // --- SUITE 3: BACKWARD COMPATIBILITY & MOCK ISOLATION ---
  const s3 = 'API Backward Compatibility';
  assert(typeof REFERRAL_TIERS.GOLD.l1Rate === 'number', s3, 'l1Rate must be numeric rate (0.20)');
  assert(typeof REFERRAL_TIERS.GOLD.l1Percent === 'number', s3, 'l1Percent must be integer percent (20)');
  assert(inferDataState({ status: 'DEMO_DATA' }) === 'DEMO', s3, 'Explicit DEMO_DATA must remain DEMO');
  assert(inferDataState({ status: 'NOT_CONNECTED' }) === 'NOT_CONNECTED', s3, 'Explicit NOT_CONNECTED must not be promoted to LIVE');
  assert(inferDataState({ dataMode: 'STALE' }) === 'STALE', s3, 'Explicit STALE must remain STALE');
  assert(inferDataState({ status: 'READY' }) === 'LIVE', s3, 'Validated provider payload with unknown status may use LIVE fallback');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  return {
    total,
    passed,
    failed,
    results
  };
}
