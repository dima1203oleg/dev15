# AUTOMATIC PAYOUT ENGINE SPECIFICATION — SIREN UA 2026

## Current implementation status

The provider boundary and validation primitives exist in `src/domain/partnerPlatform.ts`. No real provider is configured in Dev15. The HTTP server therefore never locks, dispatches or settles a payout and returns `PAYOUT_PROVIDER_NOT_CONNECTED`.

## 1. Payout Lifecycle FSM
```
[AVAILABLE BALANCE]
       ↓
[REQUESTED] (Partner triggers payout in Dashboard)
       ↓
[VALIDATING] (Min amount, KYC status, Tax ID, Sanctions/AML check, Fraud Score)
       ↓
[LOCKED] (Ledger posts credit to PARTNER_AVAILABLE and debit to PARTNER_LOCKED)
       ↓
[PSP_DISPATCH] (Provider adapter: Monobank / LiqPay / SEPA / Stripe)
       ↓
[WEBHOOK_WAIT] (Idempotent async webhook processing)
       ├──> [PAID / SETTLED] (Ledger settles to PAYOUT_DISBURSEMENT_ACCOUNT)
       └──> [FAILED / REVERSED] (Compensating entry releases funds back to AVAILABLE)
```

## 2. Payout Validation Guardrails
1. **Minimum Payout**: equivalent to USD 10, calculated with a configured FX snapshot. No UAH amount is hardcoded.
2. **KYC Status**: Must be `VERIFIED` or tier-exempt.
3. **Tax Compliance**: Taxpayer identification recorded and verified.
4. **Fraud & Sanctions**: provider policy must return an allowed status; review/block states stop payout.
5. **Idempotency Key**: Required on all submission requests and webhook processing.
