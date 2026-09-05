# Persistence and ledger contract

`db/001_partner_platform.sql` is the durable PostgreSQL contract for the partner platform. `npm run db:migrate` now applies numbered SQL files transactionally and records them in `schema_migrations`; it requires an explicit `DATABASE_URL` and never falls back to the in-memory demo.

The schema stores money in integer minor units, separates subscription/payment/qualification/commission records, and models payout requests independently from provider attempts. `ledger_transactions` and `ledger_lines` are append-only: update/delete triggers reject mutation, while a deferred constraint trigger requires every transaction to have one currency and equal debit/credit totals.

Wallet values are read from the `wallet_projections` view. A payout lock and settlement are compensating ledger moves; an API handler must never set a balance column directly. `idempotency_records` and provider-scoped `webhook_events` protect retry paths, while `audit_logs` and `financial_rule_versions` preserve the explanation and rule version for every administrative change.

The domain `TransactionalOutbox` mirrors `event_outbox`: producers enqueue payment, payout, refund, rank, and notification events transactionally, workers retry un-published events, and a published event is immutable. The in-memory implementation is acceptance-tested; production must persist the same contract in the database transaction that changes the aggregate.

The web server performs a bounded `SELECT 1` probe when `DATABASE_URL` is present. A configured URL with an unreachable database reports `ERROR` in `/api/ready` and cannot be treated as a healthy dependency. `PostgresPartnerRepository` now provides a read-only projection boundary for authenticated dashboard, wallet, privacy-safe L1/L2 network and rank views. The current partner HTTP routes still remain disabled until identity/authentication, request authorization and write-side transactional orchestration are supplied; the repository is not a substitute for those guards.

Before enabling the migration in production, run it against an isolated staging database and add application-level transaction tests for concurrent payout locks, webhook retries, refund reversals and reconciliation mismatches.
