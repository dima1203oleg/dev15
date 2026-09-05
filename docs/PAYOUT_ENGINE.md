# Payout Engine

```text
Available → request → identity/KYC/tax/sanctions/fraud → lock → provider
→ signed webhook → idempotent processor → ledger settlement → reconciliation
```

No real provider is configured. Production payout creation returns `PAYOUT_PROVIDER_NOT_CONNECTED`; demo settlement is available only outside production and must remain visibly labelled.

Payout eligibility requires a usable, non-expired FX snapshot. The snapshot's provider, version, quote time and expiry must be persisted with the request so the USD-equivalent minimum can be reconstructed later.

The provider boundary includes recipient creation/verification, fee quote, payout status/cancel, signed webhook handling and reconciliation. The disconnected adapter fails each operation explicitly; it never returns a zero-fee or synthetic payout result.

`PayoutOrchestrator` is the in-memory provider-agnostic execution boundary used by tests. `PayoutRepository` adds the durable PostgreSQL boundary: it locks the partner row, validates a stored FX snapshot and the requested-gross minimum, verifies the payout method, records provider/FX/withholding fees, moves `AVAILABLE → LOCKED_FOR_PAYOUT` and writes an outbox event atomically. `settle` accepts only a signature-verified normalized provider result and moves the lock to `PAID` or back to `AVAILABLE` through immutable ledger lines; duplicate webhook events are ignored. The HTTP payout creation route remains fail-closed until a real provider, KYC/AML, FX and authenticated production deployment are configured.
