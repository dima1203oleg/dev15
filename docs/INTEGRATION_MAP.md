# Integration Map

## ThreatServer

Expected boundary: `GET /api/threats/status`, live events, regions, shelters and eventually WebSocket/SSE. The current Express routes are a temporary client-shaped adapter. `NOT_CONNECTED` is the production-safe state.

## SirenUA identity and app

Expected future boundary: shared identity, subscription status, region preferences, deep links and app download URLs. No credentials or canonical contracts were available, so the current session remains demo-only.

## Payments and payouts

Expected future boundary: recipient verification, KYC/AML, payout creation, provider webhook and reconciliation. The current implementation has no settlement path: it returns `PAYOUT_PROVIDER_NOT_CONNECTED` and never simulates a paid payout.
