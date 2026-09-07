# SIREN UA — API Migration & Compatibility Plan

This document formalizes the API evolution strategy and compatibility guarantees between **SirenUA-Website**, **SirenUA (Client)**, and **SirenUA-ThreatServer**.

> Status note: the frontend contracts and truthful `LIVE/DEMO/NOT_CONNECTED` handling are implemented. The endpoint labels below describe the required production contract; they do not claim that a backend/provider is reachable in the current local environment.

> Dev15 integration note: during local development Dev20 dual-reads the verified
> canonical routes `/api/threats/*`, `/api/partner/dashboard`,
> `/api/partner/network`, `/api/partner/ledger` and `/api/partner/payouts`.
> `DEMO_DATA` is retained as `DEMO`; only an authoritative upstream source may
> produce `LIVE`.

---

## 1. Non-Breaking API Principles (API Lock)

1. **Strict Additive Changes**: Existing endpoints, HTTP methods, and required request/response fields are NEVER removed or changed in type.
2. **Dual-Read / Dual-Write**: When extending data contracts (e.g., adding threat coordinates or confidence ratings), new properties are added as optional or nullable with backwards-compatible defaults.
3. **Explicit Versioning**: All new high-level aggregations are routed under `/api/v1/*` or `/api/v2/*` with fallback adapters.

---

## 2. Endpoint Catalog & Backward Compatibility Matrix

| Endpoint | Method | Consumers | Status | Compatibility Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/threats/live` | `GET` | Web, Mobile, Desktop | **Active** | Additive fields (`confidence`, `updatedAt`, `source`) added without removing `isAlarm` boolean. |
| `/api/v1/threats/regions` | `GET` | Web Map, Threat Visualizer | **Active** | ISO-3166-2 and Ukrainian oblast names maintained strictly. |
| `/api/v1/threats/spatial` | `GET` | 3D Radar, Orbital Twin | **Active** | Returns array of vector trajectories with fallback coordinates if radar is degraded. |
| `/api/v1/alerts/feed` | `GET` | Newsfeed, Notification center | **Active** | Chronological timeline items with ISO timestamps. |
| `/api/v1/system/status` | `GET` | Health Probe, Header Status | **Active** | Returns `uptimeSeconds`, `activeIngestSources`, and `latencyMs`. |
| `/api/v1/partner/summary` | `GET` | Partner Cabinet, 3D Stack | **Active** | Ledger balances (`availableBalance`, `pendingBalance`, `qualifiedL1`) strictly adhere to Section 8 rules. |
| `/api/v1/shelters/search` | `GET` | Shelter Finder, Regional Inspector | **Active** | Proximity search with `latitude`, `longitude`, `radiusKm`. |

---

## 3. Migration Phasing & Rollback Safeguards

```
Phase 1: Contract Validation (Current)
  • Contract test suite in src/tests/contract.test.ts verifies all schemas.
  • Fallback adapters handle offline or stale connections seamlessly.

Phase 2: Additive Deployment
  • Deploy new fields to SirenUA-ThreatServer.
  • Older mobile and web clients ignore unknown fields without crashing.

Phase 3: Client Adoption
  • SirenUA-Website and mobile apps leverage enriched metadata (e.g. ETA, Radar Confidence).
  • Zero downtime migration.
```
