# API Status

The current Express routes are prototype contracts, not a stable public API. `GET /api/health` reports the configured capability boundary; `GET /api/ready` returns `503` until all required production dependencies are connected. When `DATABASE_URL` is set, readiness also requires a successful bounded database probe; configuration alone is not treated as connectivity. Threat payload routes (`live`, `regions`, `shelters`) return `503 NOT_CONNECTED` when the authoritative source is absent; they never represent unavailable data as an empty live result. Threat routes expose `DEMO_DATA` only in development and `NOT_CONNECTED` in production without a verified ThreatServer. Authenticated partner read routes can use the PostgreSQL projection when identity and database are connected; financial writes and provider lifecycle remain disabled until their adapters are wired.

All `/api/*` responses are marked `Cache-Control: no-store` because safety and financial state must not be served from an intermediary cache. Every response carries a bounded `X-Request-Id`; valid caller IDs are echoed and invalid/missing IDs are replaced with a server-generated ID for log correlation. Admin validation routes fail closed outside explicitly enabled demo mode until production authentication and authorization are installed.

Unknown `/api/*` routes return a JSON `404` (`API_NOT_FOUND`) instead of the SPA document. The listening port is configured with `PORT` and defaults to `3000`; invalid values fail startup.

Referral links use `GET /r/:referralCode`. In the development financial demo this validates the code, increments the demo click projection, sets a short-lived HttpOnly attribution cookie and redirects to the SPA. When identity/database are not connected, the route returns `503 REFERRAL_ATTRIBUTION_NOT_CONNECTED`; it never claims that a production click was tracked.

`GET /api/partner/referral-link` is the authenticated partner-link boundary. Development financial demo returns the seeded demo link; production-like mode reads the partner from PostgreSQL after OIDC authorization and returns `503` until identity, attribution storage and database are connected.

`GET /api/auth/session` uses the OIDC/JWKS verifier when identity is configured in a production-like runtime. It returns only the verified subject, email and allowlisted roles from a valid bearer token; demo mode is explicitly marked `DEMO_ONLY`. It never accepts a browser-supplied role or partner balance.

`GET /api/subscription` reads the latest durable subscription for the verified user. `POST /api/subscription/trial` starts one 30-calendar-day `PREMIUM_MONTHLY` trial only for an existing authenticated user; it schedules idempotent T−7/T−3/T−1 in-app reminders and does not start billing or create commission. Both routes fail closed until identity and PostgreSQL are connected.

`POST /api/partner/share` accepts a bounded `campaign` and optional `content`, then returns a canonical server-generated referral URL with UTM parameters. In the demo it records an append-only audit event; in production it remains unavailable until authenticated identity and durable campaign/attribution storage are connected. The referral redirect preserves only validated UTM fields in the landing URL and an HttpOnly context cookie so a future signup flow can attach the campaign without trusting browser state.

`GET /api/partner/network?limit=20&offset=0` returns aggregate counts plus bounded, privacy-safe L1/L2 pages. `limit` is capped server-side at 50; the browser never needs to receive an unbounded referral tree. `hasMore` indicates whether another page is available.

The durable read model is implemented in `src/server/postgresPartnerRepository.ts` and reads wallet balances only from `wallet_projections`. Dashboard, network, ledger and payout-history reads use this boundary when the production prerequisites are present; payout creation still fails closed until a verified provider adapter and transactional write orchestration are supplied.

`GET /api/partner/payouts` returns payout history with masked destinations only (for example `•••• 6789`); full payout instruments must remain server-side and provider-scoped.

`GET /api/admin/financial-rules` and `POST /api/admin/financial-rules` plus `/validate`, `/approve` and `/schedule` expose the authenticated maker/checker rule lifecycle. They require PostgreSQL + OIDC roles and never mutate wallet balances; each transition is audited transactionally.

The built-server demo contract is covered by `npm run test:demo-api`: it checks the referral URL, bounded network response, privacy stripping and attribution cookie/redirect.
