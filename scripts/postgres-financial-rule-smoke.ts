import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPostgresBoundary } from '../src/server/postgresBoundary';
import { FinancialRuleRepository } from '../src/server/financialRuleRepository';

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const database = createPostgresBoundary({ DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv);
assert.equal(await database.probe(), 'CONNECTED');
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const ruleVersion = `comp-${suffix}`;
const futureVersion = `future-${suffix}`;
const repository = new FinancialRuleRepository(database);

try {
  const draft = await repository.createDraft({
    version: ruleVersion,
    ruleType: 'COMPENSATION',
    value: { capBps: 5000, rates: { STARTER: 500 } },
    createdBy: `maker-${suffix}`,
    reason: 'Acceptance test rule'
  });
  assert.equal(draft.state, 'DRAFT');
  assert.equal((await repository.transition(ruleVersion, 'VALIDATE', `maker-${suffix}`)).state, 'VALIDATED');
  assert.equal((await repository.transition(ruleVersion, 'APPROVE', `checker-${suffix}`)).state, 'APPROVED');
  assert.equal((await repository.transition(ruleVersion, 'SCHEDULE', `checker-${suffix}`, '2026-01-01T00:00:00.000Z')).state, 'SCHEDULED');
  assert.equal(await repository.getActive('COMPENSATION', '2025-12-31T23:59:59.000Z'), null);
  assert.equal(await repository.activateDue('2026-01-02T00:00:00.000Z'), 1);
  assert.equal((await repository.getActive('COMPENSATION', '2026-01-02T00:00:00.000Z'))?.version, ruleVersion);
  assert.equal(await repository.activateDue('2026-01-02T00:00:00.000Z'), 0);

  await repository.createDraft({ version: futureVersion, ruleType: 'COMPENSATION', value: { capBps: 5000 }, createdBy: `maker-${suffix}`, reason: 'Future rule' });
  await repository.transition(futureVersion, 'VALIDATE', `maker-${suffix}`);
  await repository.transition(futureVersion, 'APPROVE', `checker-${suffix}`);
  await repository.transition(futureVersion, 'SCHEDULE', `checker-${suffix}`, '2026-02-01T00:00:00.000Z');
  assert.equal(await repository.activateDue('2026-01-31T23:59:59.000Z'), 0);
  assert.equal((await repository.list('COMPENSATION')).find((rule) => rule.version === futureVersion)?.state, 'SCHEDULED');

  const audits = await database.query(`SELECT COUNT(*)::int AS count FROM audit_logs WHERE target_id = $1 AND action = 'FINANCIAL_RULE_ACTIVATED'`, [ruleVersion]);
  assert.equal(audits.rows[0].count, 1);
  console.log('PostgreSQL financial rule activation smoke: PASS');
} finally {
  await database.close();
}
