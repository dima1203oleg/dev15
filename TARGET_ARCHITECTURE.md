# TARGET ARCHITECTURE & PRODUCTION READINESS — SIREN UA 2026

## 1. System Ecosystem Topology
```
                     ATLAS TRINITY ECOSYSTEM
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
    MOBILE APPLICATION                       WEB PLATFORM
  (mobile client: access required)    (dima1203oleg/Dev15)
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                       IDENTITY LAYER
                               │
                    THREAT SERVER / RADAR
               (authoritative ThreatServer: access required)
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                Map       Threat Data    Shelters
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                    PARTNER REVENUE ENGINE
                 (2-Level L1+L2 / 5–25% Ranks)
                               │
                     IMMUTABLE LEDGER
                 (Zero-Sum Double-Entry FSM)
                               │
                    AUTOMATIC PAYOUTS
                 (KYC / Tax / PSP Gateway)
```

## 2. Production Hardening Checklist
- [x] Domain primitives: strict L1/L2, rank thresholds, QCB, 50% cap, minor units, HALF_UP rounding.
- [x] Domain/test ledger: append-only balanced transactions and wallet projection.
- [x] Explicit `DEMO_DATA` / `NOT_CONNECTED` threat and financial boundaries.
- [x] PostgreSQL transactional outbox and write-side payment/payout repository wiring for verified events.
- [x] PostgreSQL connection probe, idempotent migration runner and immutable-ledger contract in `db/001_partner_platform.sql` / `db/002_partner_campaign_links.sql`.
- [x] Authenticated PostgreSQL partner read projection for dashboard, network, ledger and payout history.
- [ ] Real identity/authentication, server-side RBAC and MFA for finance admins.
- [x] Signed payment/payout webhook boundaries with replay/idempotency protection.
- [ ] Provider-specific billing normalization, KYC/AML/tax and settlement reconciliation deployment.
- [ ] Authoritative ThreatServer, geography and real-time resilience.
- [ ] Full CI, security, accessibility, E2E, performance and soak evidence.
