# Rank Engine

| Rank | Qualified active paid personal L1 | Rate |
|---|---:|---:|
| Starter | 1–9 | 5% |
| Bronze | 10–29 | 10% |
| Silver | 30–74 | 15% |
| Gold | 75–199 | 20% |
| Platinum | 200+ | 25% |

Only qualified active paid personal L1 count toward rank. L2, clicks, installs, free, refunded, fraudulent and inactive users do not. A threshold loss transitions `ACTIVE → BELOW_THRESHOLD → GRACE`; while in `GRACE`, the current rank/rate is frozen according to the versioned policy. After the configured grace-cycle limit, the lower resolved rank is applied.

When a previously qualified payment is refunded or charged back, its direct-L1 qualification is decremented once and the same rank evaluation boundary is applied. Repeated provider/reversal delivery is idempotent.
