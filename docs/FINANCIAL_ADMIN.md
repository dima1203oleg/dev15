# Financial administration boundary

Financial rules are versioned records with `version`, `reason`, `createdBy`, `approvedBy`, and `effectiveFrom`. The valid lifecycle is:

```text
DRAFT → VALIDATED → APPROVED → SCHEDULED → ACTIVE
```

Activation requires a valid effective date and maker-checker approval by a different administrator. Historical commission snapshots and ledger transactions retain the rule version that produced them; changing a later rule cannot rewrite past money.

The current Dev15 server does not expose an authenticated production admin writer. Its demo admin controls remain development-only and financial providers are `NOT_CONNECTED` outside the labelled demo boundary.
