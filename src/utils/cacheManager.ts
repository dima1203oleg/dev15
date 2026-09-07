/**
 * SIREN UA Structured Cache Manager
 * 
 * Safely stores and retrieves cache entries with TTL, metadata, schema version,
 * and origin tracking. Never returns raw stored objects as 'LIVE'.
 */

import { CacheEntry, DataState } from '../types/dataEnvelope';

const CURRENT_SCHEMA_VERSION = '2.4.0';

export class CacheManager {
  /**
   * Saves a data payload into structured localStorage with TTL and metadata
   */
  public static set<T>(key: string, data: T, ttlSeconds: number = 300, source: string = 'LOCAL_STORAGE'): void {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      const entry: CacheEntry<T> = {
        data,
        source,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        mode: 'CACHED',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded or disabled in iframe
    }
  }

  /**
   * Retrieves a structured cache entry and evaluates whether it is fresh (CACHED) or expired (STALE)
   */
  public static get<T>(key: string): { data: T | null; state: DataState; fetchedAt?: string; source?: string } {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return { data: null, state: 'NOT_CONNECTED' };
      }

      const entry: CacheEntry<T> = JSON.parse(raw);
      
      // Verify schema version
      if (entry.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return { data: null, state: 'NOT_CONNECTED' };
      }

      const now = new Date().getTime();
      const expires = new Date(entry.expiresAt).getTime();
      const isExpired = now > expires;

      return {
        data: entry.data,
        state: isExpired ? 'STALE' : 'CACHED',
        fetchedAt: entry.fetchedAt,
        source: entry.source,
      };
    } catch {
      return { data: null, state: 'NOT_CONNECTED' };
    }
  }

  /**
   * Clears specific cache key or all sirenua cache entries
   */
  public static clear(key?: string): void {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sirenua_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }
  }
}
