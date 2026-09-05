# Ledger

The production source of truth must be an immutable, double-entry ledger using integer minor currency units. Wallet buckets are projections: pending, held, available, locked for payout, paid, reversed and debt.

Refunds and chargebacks create compensating entries; they never delete history. The current in-memory ledger is a contract prototype only and is not durable.

The domain boundary validates a complete batch before mutating the append-only collections. Commission sets and multi-bucket reversals therefore commit all-or-nothing, and retries are checked against both the idempotency key and transaction id for payload conflicts.
