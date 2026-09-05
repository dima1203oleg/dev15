import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { AutoPayoutRepository } from '../src/server/autoPayoutRepository';
import { createPostgresBoundary } from '../src/server/postgresBoundary';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const userId = `auto-payout-user-${suffix}`;
const partnerId = `auto-payout-partner-${suffix}`;
const now = new Date().toISOString();

try {
  await database.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)', [userId, `${userId}@example.test`, 'Auto Payout Test']);
  await database.query(`INSERT INTO partners (id, user_id, referral_code, rank, rank_state, qualified_active_paid_l1, quality_status)
    VALUES ($1, $2, $3, 'STARTER', 'ACTIVE', 0, 'QUALITY_GOOD')`, [partnerId, userId, `AUTO_${suffix}`]);
  const repository = new AutoPayoutRepository(database);
  assert.equal(await repository.getForPartner(partnerId), null);
  const enabled = await repository.upsert({ partnerId, enabled: true, cadence: 'THRESHOLD', thresholdMinor: '1000', currency: 'UAH', updatedBy: 'partner-user', updatedAt: now });
  assert.equal(enabled.partnerId, partnerId);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.cadence, 'THRESHOLD');
  assert.equal(enabled.thresholdMinor, '1000');
  assert.equal(enabled.currency, 'UAH');
  const disabled = await repository.upsert({ partnerId, enabled: false, cadence: 'MONTHLY', thresholdMinor: 10000n, currency: 'USD', updatedBy: 'partner-user', updatedAt: new Date(new Date(now).getTime() + 1000).toISOString() });
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.cadence, 'MONTHLY');
  assert.equal(disabled.thresholdMinor, '10000');
  assert.equal((await database.query(`SELECT COUNT(*)::int AS count FROM audit_logs WHERE target_entity = 'AUTO_PAYOUT_POLICY' AND target_id = $1`, [partnerId])).rows[0].count, 2);
  await database.query('DELETE FROM audit_logs WHERE target_entity = $1 AND target_id = $2', ['AUTO_PAYOUT_POLICY', partnerId]);
  await database.query('DELETE FROM auto_payout_policies WHERE partner_id = $1', [partnerId]);
  await database.query('DELETE FROM partners WHERE id = $1', [partnerId]);
  await database.query('DELETE FROM users WHERE id = $1', [userId]);
  console.log('PostgreSQL auto-payout policy smoke: PASS');
} finally {
  await database.close();
}
