# Compensation Engine

```text
Payment → qualification → fraud → rank → QCB → calculation → HALF_UP rounding
→ 50% cap validation → commission → hold → ledger
```

All rates are basis points. QCB is a versioned qualified commission base. The transaction-level aggregate of rank, campaign, ambassador and contract allocations must be `<= 5000` bps. A failed cap creates no commission ledger entry.
