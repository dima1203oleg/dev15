import { apiUrl } from '../config/runtime';
import { DataState } from '../types/dataEnvelope';

export type JsonObject = Record<string, unknown>;

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Preserve an explicit server data state instead of promoting a valid-looking
 * error/degraded payload to LIVE. Providers may use either `status`,
 * `dataMode`, or `mode`; an unknown status keeps the endpoint's normal LIVE
 * fallback after schema validation.
 */
export function inferDataState(value: unknown, fallback: DataState = 'LIVE'): DataState {
  if (!isJsonObject(value)) return fallback;
  const raw = [value.status, value.dataMode, value.mode].find((item): item is string => typeof item === 'string');
  switch (raw) {
    case 'DEMO':
    case 'DEMO_DATA':
      return 'DEMO';
    case 'LIVE':
      return 'LIVE';
    case 'CACHED':
      return 'CACHED';
    case 'STALE':
      return 'STALE';
    case 'NOT_CONNECTED':
      return 'NOT_CONNECTED';
    case 'ERROR':
      return 'ERROR';
    default:
      return fallback;
  }
}

/** Accept both a plain API payload and the common `{ data: payload }` envelope. */
export function unwrapApiData<T>(value: unknown): T {
  if (isJsonObject(value) && 'data' in value) {
    return value.data as T;
  }
  return value as T;
}

export async function getJson<T>(path: string, timeoutMs = 2500): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return unwrapApiData<T>(await response.json());
}

/**
 * Read the first compatible endpoint that returns JSON successfully.
 * This keeps the presentation layer compatible with the canonical Dev15
 * `/api/...` boundary while preserving support for the older `/api/v1/...`
 * contracts during migration.
 */
export async function getJsonFromPaths<T>(paths: string[], timeoutMs = 2500): Promise<T> {
  let lastError: unknown = new Error('No API paths configured');

  for (const path of paths) {
    try {
      return await getJson<T>(path, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed');
}

export async function postJson<T>(path: string, body: unknown, timeoutMs = 5000): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return unwrapApiData<T>(await response.json());
}

/**
 * Write to the first compatible mutation route during API migration.
 * A fallback is allowed only for an explicit missing route (404/405). A
 * timeout, network error or provider 5xx is never retried against another
 * path because the upstream may have accepted the mutation already.
 */
export async function postJsonFromPaths<T>(paths: string[], body: unknown, timeoutMs = 5000): Promise<T> {
  let lastMissingRoute: Error | null = null;

  for (const path of paths) {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status === 404 || response.status === 405) {
      lastMissingRoute = new Error(`API route unavailable: ${response.status} ${path}`);
      continue;
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return unwrapApiData<T>(await response.json());
  }

  throw lastMissingRoute || new Error('No compatible API mutation path configured');
}
