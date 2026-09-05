# Compensation Engine

```text
Payment → qualification → fraud → rank → QCB → calculation → HALF_UP rounding
→ 50% cap validation → commission → hold → ledger
```

All rates are basis points. QCB is a versioned qualified commission base. The transaction-level aggregate of rank, campaign, ambassador and contract allocations must be `<= 5000` bps. A failed cap creates no commission ledger entry.

Qualification also requires `subscriptionState = PREMIUM_ACTIVE`; trial, failed, cancelled, refunded, test and inactive subscription states cannot create a rank increment or commission, regardless of the payment event label.

Payment qualification is idempotent. `QualifiedPaymentRepository.process` is the durable post-verification boundary: it locks the attribution and partner rows, checks the latest `PREMIUM_ACTIVE` subscription/rank context, writes the qualified payment, rank projection, commission snapshots, balanced ledger transactions and outbox events in one transaction. A duplicate idempotency key returns the original result; a changed payload is an explicit conflict. If the cap fails, the paid qualification/rank evidence is retained but no commission or commission ledger entry is created. A refund or chargeback must later post a compensating ledger move and remove the payment's qualified direct-L1 count exactly once; no historical commission record is deleted.
