# Integration Map

## ThreatServer

Expected boundary: `GET /api/threats/status`, live events, regions, shelters and eventually WebSocket/SSE. The current Express routes are a temporary client-shaped adapter. `NOT_CONNECTED` is the production-safe state.

## SirenUA identity and app

Expected future boundary: shared identity, subscription status, region preferences, deep links and app download URLs. No credentials or canonical contracts were available, so the current session remains demo-only.

## Payments and payouts

The local production-like boundary now includes signed, provider-scoped subscription and payment webhooks, durable QCB/qualification/commission/ledger processing, payout locking, signed payout settlement, refunds and chargeback adjustments. Provider adapters still must normalize Apple/Google/Web billing, provide real FX/KYC/AML/tax decisions, dispatch payouts and reconcile settlement statements. Until those external contracts and credentials are supplied, money movement remains fail-closed with `NOT_CONNECTED` and no payout is simulated.
