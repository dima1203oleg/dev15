# Integration Map

## ThreatServer

Expected boundary: `GET /api/threats/status`, live events, regions, shelters and eventually WebSocket/SSE. The current Express routes are a temporary client-shaped adapter. `NOT_CONNECTED` is the production-safe state.

## SirenUA identity and app

Expected future boundary: shared identity, subscription status, region preferences, deep links and app download URLs. No credentials or canonical contracts were available, so the current session remains demo-only.

## Payments and payouts

Expected future boundary: recipient verification, KYC/AML, payout creation, provider webhook and reconciliation. Current in-memory payout settlement is allowed only in development/demo mode and is explicitly blocked in production.
