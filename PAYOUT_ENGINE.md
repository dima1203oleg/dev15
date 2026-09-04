# AUTOMATIC PAYOUT ENGINE SPECIFICATION — SIREN UA 2026

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
1. **Minimum Payout**: 500 UAH / $20 USD.
2. **KYC Status**: Must be `VERIFIED` or tier-exempt.
3. **Tax Compliance**: Taxpayer identification recorded and verified.
4. **Fraud & Sanctions**: Fraud score < 60, Sanctions screen = `CLEAR`.
5. **Idempotency Key**: Required on all submission requests.
