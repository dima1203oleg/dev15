# Compensation Engine

```text
Payment → qualification → fraud → rank → QCB → calculation → HALF_UP rounding
→ 50% cap validation → commission → hold → ledger
```

All rates are basis points. QCB is a versioned qualified commission base. The transaction-level aggregate of rank, campaign, ambassador and contract allocations must be `<= 5000` bps. A failed cap creates no commission ledger entry.

Qualification also requires `subscriptionState = PREMIUM_ACTIVE`; trial, failed, cancelled, refunded, test and inactive subscription states cannot create a rank increment or commission, regardless of the payment event label.

Payment qualification is idempotent. A refund or chargeback posts a compensating ledger move and removes the payment's qualified direct-L1 count exactly once; rank is then re-evaluated through the threshold/grace boundary. No historical commission record is deleted.
