import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) {
  console.error('DATABASE_URL is required. No migration was executed.');
  process.exitCode = 1;
} else {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
    application_name: 'siren-ua-migrator'
  });
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dbDirectory = path.resolve(process.cwd(), 'db');
    const migrationFiles = (await readdir(dbDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const file of migrationFiles) {
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (alreadyApplied.rowCount) continue;
      const sql = await readFile(path.join(dbDirectory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log('PostgreSQL migrations: PASS');
  } finally {
    client?.release();
    await pool.end();
  }
}
