# Payout Engine

```text
Available → request → identity/KYC/tax/sanctions/fraud → lock → provider
→ signed webhook → idempotent processor → ledger settlement → reconciliation
```

No real provider is configured. Production payout creation returns `PAYOUT_PROVIDER_NOT_CONNECTED`; demo settlement is available only outside production and must remain visibly labelled.

Payout eligibility requires a usable, non-expired FX snapshot. The snapshot's provider, version, quote time and expiry must be persisted with the request so the USD-equivalent minimum can be reconstructed later.

The provider boundary includes recipient creation/verification, fee quote, payout status/cancel, signed webhook handling and reconciliation. The disconnected adapter fails each operation explicitly; it never returns a zero-fee or synthetic payout result.
