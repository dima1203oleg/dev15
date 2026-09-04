# Payout Engine

```text
Available → request → identity/KYC/tax/sanctions/fraud → lock → provider
→ signed webhook → idempotent processor → ledger settlement → reconciliation
```

No real provider is configured. Production payout creation returns `PAYOUT_PROVIDER_NOT_CONNECTED`; demo settlement is available only outside production and must remain visibly labelled.
