# IMMUTABLE LEDGER SPECIFICATION — SIREN UA 2026

## 1. Core Principles
1. **Never mutate balances directly**: `partner.balance` does not exist as a primary column. It is computed as a materialized projection of immutable ledger accounts.
2. **Double-Entry Bookkeeping**: Every financial transaction consists of balanced debits and credits:
   $$\sum \text{Debits} = \sum \text{Credits}$$
3. **Precision**: All financial amounts are integer minor units (e.g., UAH kopecks: 100 UAH = 10,000 minor units; USD cents: $100 = 10,000 minor units). Rates are stored in basis points (500 bps = 5.00%).
4. **Rounding Policy**: Standard `HALF_UP` with secondary cap compliance normalization.

## 2. Ledger Accounts Schema
- `COMPANY_REVENUE_ACCOUNT` (Asset / Platform Equity)
- `PLATFORM_FEES_ACCOUNT` (Expense)
- `PARTNER_PENDING_PAYABLE` (Liability)
- `PARTNER_AVAILABLE_PAYABLE` (Liability)
- `PARTNER_LOCKED_PAYOUT_ACCOUNT` (Escrow Liability)
- `PAYOUT_DISBURSEMENT_ACCOUNT` (Asset / Cash Gateway)
- `REVERSAL_RECOVERY_ACCOUNT` (Receivable)

## 3. Wallet States
- `PENDING`: Commission recorded but in 14-day refund hold.
- `HELD`: Flagged for risk or compliance review.
- `AVAILABLE`: Vested and eligible for payout request.
- `LOCKED_FOR_PAYOUT`: Frozen in transit to PSP.
- `PAID`: Successfully settled to partner bank account.
- `REVERSED`: Compensating reversal transaction posted.
- `DEBT`: Negative balance due to post-payout chargeback (recovered on next earnings).
