# Financial administration boundary

Financial rules are versioned records with `version`, `reason`, `createdBy`, `approvedBy`, and `effectiveFrom`. The valid lifecycle is:

```text
DRAFT → VALIDATED → APPROVED → SCHEDULED → ACTIVE
```

Activation requires a valid effective date and maker-checker approval by a different administrator. Historical commission snapshots and ledger transactions retain the rule version that produced them; changing a later rule cannot rewrite past money.

The production-like server now exposes an authenticated PostgreSQL-backed rule configuration boundary at `/api/admin/financial-rules`. A maker can create a `DRAFT`, then validate it; a different checker must approve it before it can be scheduled with an explicit `effectiveFrom`. Each transition writes an audit record in the same transaction. The endpoint does not edit balances and remains unavailable when the database or identity boundary is not connected. Demo admin controls remain development-only and financial providers are still `NOT_CONNECTED` outside the labelled demo boundary.
