/**
 * SIREN UA Unified Data Envelope & Cache Contracts
 * 
 * Standard envelope for all domain models across HOME, NETWORK, FINANCE, PROFILE.
 * Guarantees zero unverified "LIVE" flags and provides transparent status tracking.
 */

export type DataState = 
  | 'LOADING'
  | 'LIVE'
  | 'CACHED'
  | 'STALE'
  | 'DEMO'
  | 'NOT_CONNECTED'
  | 'ERROR';

export interface DataEnvelope<T> {
  data: T | null;
  state: DataState;
  source?: string;
  updatedAt?: string;
  error?: string;
  latencyMs?: number;
  isRealData?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  source: string;
  fetchedAt: string;
  expiresAt: string;
  mode: 'LIVE' | 'DEMO' | 'CACHED' | 'STALE' | 'NOT_CONNECTED';
  schemaVersion: string;
}
