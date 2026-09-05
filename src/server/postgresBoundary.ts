import { Pool } from 'pg';

export type DatabaseRuntimeStatus = 'NOT_CONFIGURED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface PostgresBoundary {
  readonly configured: boolean;
  readonly status: () => DatabaseRuntimeStatus;
  probe(): Promise<DatabaseRuntimeStatus>;
  close(): Promise<void>;
}

/**
 * Connection health is deliberately separate from the migration/schema
 * contract. A present DATABASE_URL is configuration, not proof that the app
 * can reach the database. Production readiness must use the probe result.
 */
export function createPostgresBoundary(environment: NodeJS.ProcessEnv = process.env): PostgresBoundary {
  const connectionString = (environment.DATABASE_URL ?? '').trim();
  if (!connectionString) {
    return {
      configured: false,
      status: () => 'NOT_CONFIGURED',
      async probe() { return 'NOT_CONFIGURED'; },
      async close() {}
    };
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 30_000,
    application_name: 'siren-ua-web'
  });
  let currentStatus: DatabaseRuntimeStatus = 'CONNECTING';

  return {
    configured: true,
    status: () => currentStatus,
    async probe() {
      currentStatus = 'CONNECTING';
      try {
        await pool.query('SELECT 1');
        currentStatus = 'CONNECTED';
      } catch {
        currentStatus = 'ERROR';
      }
      return currentStatus;
    },
    async close() {
      await pool.end();
    }
  };
}
