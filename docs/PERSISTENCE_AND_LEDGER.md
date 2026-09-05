# Persistence and ledger contract

`db/001_partner_platform.sql` is the durable PostgreSQL contract for the partner platform. It is not executed in Dev15 because the repository has no configured production database or migration runner.

The schema stores money in integer minor units, separates subscription/payment/qualification/commission records, and models payout requests independently from provider attempts. `ledger_transactions` and `ledger_lines` are append-only: update/delete triggers reject mutation, while a deferred constraint trigger requires every transaction to have one currency and equal debit/credit totals.

Wallet values are read from the `wallet_projections` view. A payout lock and settlement are compensating ledger moves; an API handler must never set a balance column directly. `idempotency_records` and provider-scoped `webhook_events` protect retry paths, while `audit_logs` and `financial_rule_versions` preserve the explanation and rule version for every administrative change.

Before enabling the migration in production, run it through the selected migration tool against an isolated staging database and add application-level transaction tests for concurrent payout locks, webhook retries, refund reversals and reconciliation mismatches.
