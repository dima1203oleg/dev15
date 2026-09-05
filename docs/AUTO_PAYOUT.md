# Auto-payout

`GET`/`PUT /api/partner/auto-payout` persist a partner's automatic payout preference in PostgreSQL. Supported modes are `THRESHOLD` and `MONTHLY`; money thresholds are integer minor units and the update writes an immutable audit record.

The policy is intent, not a payout. A worker may execute it only after the same minimum, FX snapshot, KYC, compliance, fraud, verified payout-method, provider-quote and ledger-lock gates used by on-demand payouts. The current Dev15 checkout has no real payout provider, so the API reports `execution.provider = NOT_CONNECTED` and never creates a payout request, locks funds or simulates settlement.

When a provider is connected, the policy must be evaluated through an idempotent scheduled worker. Provider dispatch, signed webhook settlement and reconciliation remain the only paths allowed to move a request from `PAYOUT_HELD` to `PAID` or restore it to `AVAILABLE`.
