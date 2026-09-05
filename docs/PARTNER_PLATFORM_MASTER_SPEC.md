# SIREN UA — Partner Platform 4.0

Backend / financial logic specification for subscription, referral, wallet and payout automation.

## Production boundary

The current Dev15 app exposes a clearly labelled in-memory demo projection. It does not have a production database, billing provider, FX provider, KYC/AML provider or payout provider configured. Therefore the server returns `NOT_CONNECTED` / `PAYOUT_PROVIDER_NOT_CONNECTED` instead of moving money. Demo fixtures are never authoritative financial data.

## Domain modules

The implementation boundary is `src/domain/partnerPlatform.ts`. It is framework-independent so the same rules can run in API handlers, workers and tests:

- trial and subscription lifecycle;
- referral attribution lock and two-level chain resolution;
- qualified payment and versioned QCB calculation;
- rank resolution and grace policy;
- commission snapshots and 50% allocation cap;
- integer minor-unit money and deterministic `HALF_UP` rounding;
- immutable double-entry ledger and wallet bucket projection;
- FX snapshot and equivalent-USD minimum payout validation;
- payout provider contract and safe not-connected adapter;
- auto-payout gates, fraud score, quality status and notification scheduling;
- achievements, privacy-safe leaderboard and Ambassador status.

## Financial invariants

1. Trial users may be attributed but generate no commission and do not count toward rank.
2. Only qualified active paid personal L1 users affect rank. L2 never affects rank.
3. Financial depth is exactly L1 and L2; no L3+ compensation.
4. Commission is calculated from transaction QCB, not a frontend plan label or nominal `$1`.
5. Total allocation must be `<= 5000` basis points before ledger creation. Rounded allocations are normalized deterministically and cannot exceed the rounded cap.
6. Money never uses binary floating point. Values are integer minor units and percentage multiplication uses `bigint`.
7. Historical commission snapshots contain QCB, policy/rule versions, rank, rate, raw and rounded amounts, cap result and timestamp.
8. Ledger is append-only and double-entry balanced. Wallet buckets are projections, never the financial source of truth.
9. Refunds create reversals. Chargebacks after payout create debt; old ledger history is never silently rewritten.
10. Minimum payout defaults to USD 10 equivalent using an expiring FX snapshot. No UAH threshold is hardcoded.
11. Provider fee, FX fee and withholding are shown before confirmation and are borne by the partner according to policy.
12. Auto-payout is allowed only after KYC, payout-method, compliance and fraud gates pass.
13. Auto-payout cadence is explicit: `THRESHOLD` requires the available threshold; `MONTHLY` requires a scheduler-provided due signal. It must never run merely because a balance happens to be above threshold.
14. Payout minimum policy is explicit: gross-minimum checks compare the requested amount; net-minimum checks require a provider fee quote and compare the deterministic post-fee amount. No net minimum is inferred without a quote.
15. Duplicate payment, commission, payout and webhook deliveries must be idempotent. A duplicate payment id with a changed normalized payload is an explicit idempotency conflict, not a successful retry.
16. Rank, achievements, Ambassador status and leaderboard position are separate entities. Achievements do not change compensation by default.

## Core lifecycle

```text
REGISTERED → TRIAL_ACTIVE → PAYMENT_VERIFIED → QUALIFIED_PAYMENT
  → RANK_SNAPSHOT → QCB → CAP → ROUND → COMMISSION_SNAPSHOT
  → DOUBLE_ENTRY_LEDGER → HOLD → AVAILABLE
  → KYC / COMPLIANCE / FRAUD → PAYOUT_PROVIDER → SIGNED_WEBHOOK
  → RECONCILIATION → PAID
```

Exceptions become explicit states: `TRIAL_EXPIRED`, `PAYMENT_FAILED`, `HELD_FOR_REVIEW`, `REVERSED`, `DEBT`, `PAYOUT_HELD`, `PAYOUT_FAILED` or `NOT_CONNECTED`.

## Rules and configuration

Financial rules are versioned and follow `DRAFT → VALIDATED → APPROVED → SCHEDULED → ACTIVE`. Each version stores creator, checker, effective time and reason. Rates are 500/1000/1500/2000/2500 bps for Starter/Bronze/Silver/Gold/Platinum. Grace is separate from subscription grace: at most two cycles per rank in a rolling 180 days, then a 90-day cooldown by default.

## Provider boundaries

Subscription adapters normalize Apple, Google and Web billing into verified payments. `PayoutProvider` must implement recipient verification, fee quote, payout creation, status, cancellation, signed webhook handling and reconciliation. No provider credentials may reach the browser. Until an adapter is configured, requests fail safely without locking or settling funds.

## Required production persistence

The in-memory implementation is a domain/test boundary, not a production store. Before launch, persist users, subscriptions, attributions, payments, qualified payments, commission snapshots/events, rank snapshots/events, ledger transactions/lines, wallet projections, payouts/attempts, FX snapshots, KYC/fraud/quality cases, achievements, leaderboards, notifications, webhook events, idempotency records, rule versions and immutable audit logs. Add database transactions/constraints for ledger balance and idempotency keys.

## Acceptance command

```bash
npm run test:financial
```

The suite covers trial exclusion, attribution after trial, rank thresholds, QCB deductions, L1/L2 and cap, rounding, ledger idempotency/projection, FX minimum, KYC/fraud auto-payout gates, achievements, privacy-safe Top-100 and Ambassador status. Real provider, KYC, FX and database integration tests remain staging gates.
