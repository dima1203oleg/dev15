# GAP ANALYSIS & SECURITY AUDIT

This is a gap analysis, not a production certification. Only the local repository and its tests are evidence; the three external repositories named in older documents were not available in this checkout.

## 1. Gap Analysis Matrix
| Capability | Requirement | Status | Resolution |
|---|---|---|---|
| Situational Threat Map | Trajectory vectors, ETA intervals, district risk | PARTIAL / DEMO | UI fixtures and safe disconnected state; authoritative ThreatServer unavailable |
| Data Freshness & Transparency | Distinct CONFIRMED/ESTIMATED badges, official warning | PARTIAL | UI semantics exist; authoritative freshness contract unavailable |
| 2-Level Referral Architecture | Strictly L1 + L2 (L3+ = 0%) | DOMAIN TESTED | Pure typed engine and acceptance tests; no production persistence |
| Partner Ranks (5%–25%) | Starter 5%, Bronze 10%, Silver 15%, Gold 20%, Platinum 25% | DOMAIN TESTED | Pure rank engine; no production account service |
| L2 Unlocked on Starter | Starter 5% earns 5% L1 + 5% L2 | DOMAIN TESTED | Uniform rate rule covered by domain tests |
| 50% QCB Hard Cap | Max combined transaction allocation ≤ 5000 bps | DOMAIN TESTED | Pre-cap and post-rounding normalization covered |
| Grace Period Engine | 2 cycles per 180 days, 90 days cooldown | PARTIAL | Policy types exist; durable rank worker/persistence missing |
| Immutable Ledger | Double-entry bookkeeping, no direct balance mutations | DOMAIN TESTED | In-memory append-only ledger; production DB constraints missing |
| Automatic Payout Pipeline | KYC/Tax verification, balance locking, provider abstraction | NOT CONNECTED | Provider/KYC/FX absent; HTTP path does not simulate settlement |
| Admin Control Center | 360 Partner view, Ranks, Ledger, Payouts, Fraud, Cap audit | DEMO UI | No production authz or durable admin audit |

## 2. Security Audit & Hardening
- **Zero Direct Ledger Edits**: Database schema prohibits UPDATE on financial ledgers. Compensating transactions only.
- **Idempotency Protection**: In-memory / cache deduplication table for webhooks and payment triggers.
- **Anti-Fraud Protections**:
  - Self-referral detection (device hash, IP matching, payment instrument fingerprint).
  - Velocity checks on rank thresholds (9->10, 29->30, 74->75, 199->200).
- **RBAC**: not enforced by this Express demo server; must be supplied by the identity/auth integration before production.
