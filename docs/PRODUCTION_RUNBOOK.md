# SIREN UA Dev20 — Production Runbook

## What is production-ready in this repository

- The UI is a Vite production build with code-split dashboard surfaces.
- The home surface matches the approved SIREN UA light/dark visual direction: hero, Ukraine spatial visual, feature cards, financial summary and device ecosystem.
- The public pricing surface exposes the `$1/month` target and 30-day trial policy; the trial CTA calls the canonical `/api/subscription/trial` boundary and never activates a client-only subscription.
- The WebGL demo is lazy-loaded and has a static visual fallback.
- The shelters experience is available as a standalone searchable section and as a contextual modal action; demo/unknown shelter records remain explicitly labelled.
- API adapters normalize Dev15 responses and preserve explicit `LIVE`, `DEMO_DATA`, `STALE`, `NOT_CONNECTED` and `ERROR` states.
- Contract tests cover referral rules, QCB/cap calculations, threat shapes, shelter safety and data-state boundaries.

## Build and verify

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm preview --host 127.0.0.1 --port 4173
```

`pnpm check` runs TypeScript validation, contract tests and the production Vite build.

For the local Dev15 ↔ Dev20 integration boundary, run:

```bash
pnpm test:integration
```

This checks threat, partner, ledger, payout and readiness payload shapes. A
local `DEMO_DATA` source and `/api/ready` `503 not_ready` are reported as safe
non-production states, not promoted to live claims.

## Runtime configuration

Set `VITE_API_BASE_URL` to the authenticated API origin in a deployed environment. If the API is same-origin, leave it empty and route `/api/*` through the production reverse proxy.

For the referral cabinet, configure the repository/environment secret `SIRENUA_REFERRAL_APPLE_USER_ID` and expose it to the build as `VITE_REFERRAL_APPLE_USER_ID`. This must be the Sign in with Apple subject stored by ThreatServer; do not commit it or use an email address as a substitute.

The Vite development proxy (`SIREN_DEV_PROXY_TARGET`) is development-only and must not be used as a production integration boundary.

Store links remain empty until official App Store / Google Play URLs are available. The UI intentionally shows a preparation state instead of inventing a download destination.

## Required production boundary

Before enabling live claims, the deployment must provide:

- authenticated Dev15/ThreatServer routes;
- realtime threat ingest and freshness timestamps;
- shelter registry and routing source;
- identity/authentication service;
- subscription, ledger, FX, KYC and payout providers for partner features;
- HTTPS, CORS, CSP and server-side authorization.

Dev15 `/api/ready` must return `200` with the required integrations connected. A `503 not_ready` response is an expected safe state, not a release success.

## Release gates

1. `pnpm check` passes.
2. Production artifact opens through `vite preview` or the deployed host.
3. Home, pricing, partner, finance, analytics, profile, about, shelters and guide surfaces are reachable.
4. WebGL demo initializes; static fallback remains usable when WebGL is unavailable.
5. Mobile 390×844 and tablet 1024×1366 have no horizontal overflow.
6. Console has no runtime errors on the tested surfaces.
7. Live provider responses are verified before promoting any state to `LIVE`.
8. If a provider is absent, the UI remains explicitly `DEMO` or `NOT_CONNECTED` and never presents cached/demo data as live.

## Current local integration

For the checked-in local integration:

```bash
# Dev15
PORT=3100 NODE_ENV=development \
SIREN_DATA_MODE=DEMO_DATA \
SIREN_FINANCIAL_MODE=DEMO_DATA \
pnpm dev

# Dev20
SIREN_DEV_PROXY_TARGET=http://127.0.0.1:3100 \
pnpm exec vite --port 3003 --host 0.0.0.0
```

This local profile is intentionally `DEMO_DATA`. It validates the cross-repository contracts and UI behavior; it is not evidence that external threat, billing, KYC, FX or payout providers are connected.
