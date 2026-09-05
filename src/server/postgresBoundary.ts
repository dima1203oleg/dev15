import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export type DatabaseRuntimeStatus = 'NOT_CONFIGURED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface PostgresBoundary {
  readonly configured: boolean;
  readonly status: () => DatabaseRuntimeStatus;
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
  withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T>;
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
    const unavailable = async () => {
      throw new Error('DATABASE_NOT_CONFIGURED');
    };
    return {
      configured: false,
      status: () => 'NOT_CONFIGURED',
      query: unavailable,
      withTransaction: unavailable,
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
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
      return pool.query<T>(text, values);
    },
    async withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
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
