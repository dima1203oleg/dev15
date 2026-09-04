# Target Architecture

```text
SirenUA App / Identity ─┐
ThreatServer ───────────┼─> Integration gateway ─> SIREN UA Web UI
Payment provider ──────┘          │
                                  ├─> Auth + policy service
                                  ├─> Threat read model (freshness/confidence)
                                  ├─> Referral + rank + QCB engine
                                  ├─> Immutable double-entry ledger
                                  ├─> Payout orchestration + reconciliation
                                  └─> Admin/audit/observability
```

The UI must consume typed server contracts and never calculate authoritative rank, commission, balance or threat status in the browser. Production feature flags fail closed to `NOT_CONNECTED` when a dependency is missing.
