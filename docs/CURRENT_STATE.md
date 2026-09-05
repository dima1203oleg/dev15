# SIREN UA · Current State

Date: 2026-09-05

## Dev15

- Status: **WORKING / PARTIAL**
- Stack: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Express 5, tsx, esbuild.
- Package manager: `bun.lock` is present; npm lockfile is tracked for the verified npm scripts and browser test dependencies.
- UI: public single-page experience with header, alert ticker, 3D responsive showcase, threat map, feature cards, download section, partner and admin modals.
- API: Express in-memory demo endpoints for threat data and partner projections; financial domain rules live in a pure typed module. Production financial routes return `NOT_CONNECTED` until durable integrations exist.
- Auth: demo session only; no shared SirenUA identity integration verified.
- Database: missing. In-memory arrays/maps are not a production source of truth.
- CI/CD, migrations, observability and external payment provider: missing/unverified.
- Partner Platform 4.0: exact minor-unit/QCB/cap/rank/ledger/FX/payout-gate primitives and acceptance suite exist; database, billing, KYC/AML, FX and payout adapters remain unconnected.
- Production data guard: enabled. Bundled fixtures are only served in development or with explicit `SIREN_DATA_MODE=DEMO`.
- Browser safety gate: Playwright covers 11 production-boundary tests, including mobile/desktop interaction flows, public partner/admin dialogs, nine public-route axe scans, golden screenshots, stale-feed clearing, and critical-content timing in explicit `NOT_CONNECTED` mode.
- Performance gate: production main bundle is 399.2 KiB JavaScript and 173.6 KiB CSS, within the 450/200 KiB budgets; spatial routes are split into lazy chunks.
- Dependency security: `npm audit --omit=dev` passes with zero reported vulnerabilities after the Express 5 upgrade.

## Verification

- `npm run build`: PASS.
- `npm run lint`: PASS.
- `npm run test:financial`: PASS.
- `npm run test:e2e`: PASS (11 tests).
- `npm run test:performance`: PASS.
- `npm audit --omit=dev`: PASS.
- Production HTTP smoke: PASS locally.
- `git lfs`: unavailable in the local environment; no LFS files were detected.

## Important truth boundary

The current visual map and partner flows are a product prototype. They are not authoritative threat telemetry, real authentication, or real money movement.
