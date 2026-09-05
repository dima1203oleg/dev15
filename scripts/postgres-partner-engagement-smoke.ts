import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { PartnerEngagementRepository } from '../src/server/partnerEngagementRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `engagement-user-${suffix}`;
const partnerId = `engagement-partner-${suffix}`;
const now = '2026-02-01T00:00:00.000Z';

try {
  await database.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Engagement Test']);
  await database.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status, public_profile_opt_in)
    VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 100, 'QUALITY_GOOD', true)`, [partnerId, userId, `ENGAGE_${suffix}`]);
  const repository = new PartnerEngagementRepository(database);
  const first = await repository.syncPartner(partnerId, now);
  assert.equal(first.achievements.length, 8);
  assert.equal(first.ambassador.tier, 'NONE');
  const second = await repository.syncPartner(partnerId, now);
  assert.equal(second.achievements.length, 0);
  assert.equal((await repository.listAchievements(partnerId)).length, 8);
  await database.query('UPDATE partners SET qualified_active_paid_l1 = 500 WHERE id = $1', [partnerId]);
  const candidate = await repository.syncPartner(partnerId, '2026-02-02T00:00:00.000Z');
  assert.equal(candidate.ambassador.tier, 'CANDIDATE');
  assert.equal(candidate.achievements.length, 3);
  const snapshot = await repository.createLeaderboardSnapshot({ metric: 'QUALIFIED_L1', snapshotKey: `monthly:${suffix}`, periodStart: '2026-01-01T00:00:00.000Z', periodEnd: '2026-02-02T00:00:00.000Z' });
  assert.equal(snapshot.status, 'CREATED');
  assert.equal(snapshot.entries, 1);
  assert.equal((await repository.createLeaderboardSnapshot({ metric: 'QUALIFIED_L1', snapshotKey: `monthly:${suffix}`, periodStart: '2026-01-01T00:00:00.000Z', periodEnd: '2026-02-02T00:00:00.000Z' })).status, 'DUPLICATE');
  assert.equal((await repository.latestLeaderboard('QUALIFIED_L1'))[0]?.partnerId, partnerId);
  await database.query('UPDATE partners SET public_profile_opt_in = false WHERE id = $1', [partnerId]);
  const privateSnapshot = await repository.createLeaderboardSnapshot({ metric: 'MONTHLY', snapshotKey: `private:${suffix}`, periodStart: '2026-01-01T00:00:00.000Z', periodEnd: '2026-02-02T00:00:00.000Z' });
  assert.equal(privateSnapshot.entries, 0);
  await assert.rejects(() => repository.createLeaderboardSnapshot({ metric: 'REGIONAL', snapshotKey: `regional:${suffix}` }), /REGION_NOT_AVAILABLE/);
  console.log('PostgreSQL partner engagement smoke: PASS');
} finally {
  await database.close();
}
