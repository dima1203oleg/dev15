# THREAT INTEGRATION & PRODUCTION READINESS SPECIFICATION

## 1. Threat Telemetry Pipeline
- **Authoritative Provider**: external ThreatServer integration is not present in this checkout; configure and verify it before production.
- **Protocol**: Real-time REST & Server-Sent Events / WebSockets.
- **Failover Status**: If external server is disconnected, UI renders `DATA UNAVAILABLE` with instructions to consult official Civil Defense authorities.
- **Data Attributes**:
  - Radar object type: Shahed-136, Cruise Missile (X-101/Kalibr), Ballistic (Iskander-M), Tactical Aviation.
  - Calculated speed (km/h) and heading vector (degrees).
  - Estimated Time of Arrival (ETA) expressed strictly as interval ranges (e.g., 10–15 min).
  - District risk levels (Normal, Elevated, High, Critical).

## 2. Production Readiness Assessment
- **Status**: BLOCKED — this repository is a prototype and does not contain the external ThreatServer, identity, billing, KYC/AML or payout adapters.
- **Implemented locally**: explicit `DEMO_DATA` / `NOT_CONNECTED` threat boundary, typed financial primitives, immutable in-memory demo projection, cap validation and local acceptance tests.
- **Not proven by this repository**: connected production identity/RBAC deployment, signed payment-provider ingestion, real payout-provider dispatch/reconciliation deployment, KYC/AML, tax handling, authoritative geography and real-time provider stability. PostgreSQL migrations/probe, authenticated partner read projections and the signed durable payout settlement webhook boundary are implemented and locally verified.
- **Release rule**: do not enable real money movement or operational threat claims until the missing integrations are supplied and staging/security tests pass.
