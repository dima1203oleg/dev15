# TARGET ARCHITECTURE & PRODUCTION READINESS — SIREN UA 2026

## 1. System Ecosystem Topology
```
                     ATLAS TRINITY ECOSYSTEM
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
    MOBILE APPLICATION                       WEB PLATFORM
  (atlastrinity/SirenUA)              (atlastrinity/SirenUA-Website)
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                       IDENTITY LAYER
                               │
                    THREAT SERVER / RADAR
               (atlastrinity/SirenUA-ThreatServer)
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
- [x] Strict 2-Level Referral Tree (L1 + L2 only; L3+ strictly non-commissionable).
- [x] L2 unlocked immediately at Starter (5% L1 + 5% L2).
- [x] Absolute 50% QCB Hard Cap validation on all financial routes.
- [x] Minor currency units & Basis points calculations with standard HALF_UP rounding.
- [x] Double-Entry Immutable Ledger preventing direct balance mutations.
- [x] Official Civil Defense disclaimer and distinct CONFIRMED / ESTIMATED confidence markers.
- [x] Grace period engine preserving rank for 14 days with cooldown limits.
- [x] Payout lifecycle FSM with KYC, AML/Sanctions screening, and Idempotency keys.
