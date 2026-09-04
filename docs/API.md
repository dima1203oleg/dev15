# API Status

The current Express routes are prototype contracts, not a stable public API. `GET /api/health` reports the configured capability boundary. Threat routes expose `DEMO_DATA` in development and `NOT_CONNECTED` in production without a verified ThreatServer. Partner and admin routes are demo/in-memory until auth, database and authorization are implemented.
