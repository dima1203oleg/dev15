# Threat Integration

## Required event contract

Each event needs category, location, direction, trajectory, status, confidence, detected/updated timestamps, source and freshness. ETA is always a range and must be presented as an estimate.

## Current state

Reference ThreatServer was not reachable during audit. Dev15 therefore exposes a safe `NOT_CONNECTED` production state. Development uses explicitly labelled `DEMO_DATA`; those fixtures are not authoritative and must not be used for operational decisions.

## Next step

Replace the adapter with the verified ThreatServer contract, validate signatures/auth, add freshness thresholds, reconnect/backoff, WebSocket/SSE where supported, and retain the official-source disclaimer.
