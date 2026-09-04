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
- [ ] Persistent database, migrations and transactional outbox.
- [ ] Real identity/authentication, server-side RBAC and MFA for finance admins.
- [ ] Signed payment/payout webhooks, KYC/AML/tax and provider reconciliation.
- [ ] Authoritative ThreatServer, geography and real-time resilience.
- [ ] Full CI, security, accessibility, E2E, performance and soak evidence.
