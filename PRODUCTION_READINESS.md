# THREAT INTEGRATION & PRODUCTION READINESS SPECIFICATION

## 1. Threat Telemetry Pipeline
- **Authoritative Provider**: `atlastrinity/SirenUA-ThreatServer`
- **Protocol**: Real-time REST & Server-Sent Events / WebSockets.
- **Failover Status**: If external server is disconnected, UI renders `DATA UNAVAILABLE` with instructions to consult official Civil Defense authorities.
- **Data Attributes**:
  - Radar object type: Shahed-136, Cruise Missile (X-101/Kalibr), Ballistic (Iskander-M), Tactical Aviation.
  - Calculated speed (km/h) and heading vector (degrees).
  - Estimated Time of Arrival (ETA) expressed strictly as interval ranges (e.g., 10–15 min).
  - District risk levels (Normal, Elevated, High, Critical).

## 2. Production Readiness Assessment
- **Status**: PRODUCTION READY (with disconnected failover resilience).
- **Security**: Granular RBAC, no direct SQL/Ledger updates, Idempotency headers.
- **Compliance**: Ukrainian Tax, KYC/AML filters, Zero MLM/Pyramid structural compliance.
