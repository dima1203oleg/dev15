# API Status

The current Express routes are prototype contracts, not a stable public API. `GET /api/health` reports the configured capability boundary; `GET /api/ready` returns `503` until all required production dependencies are connected. Threat routes expose `DEMO_DATA` in development and `NOT_CONNECTED` in production without a verified ThreatServer. Partner and admin routes are demo/in-memory until auth, database and authorization are implemented.

All `/api/*` responses are marked `Cache-Control: no-store` because safety and financial state must not be served from an intermediary cache. Admin validation routes fail closed outside explicitly enabled demo mode until production authentication and authorization are installed.
