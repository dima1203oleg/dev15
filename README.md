# SIREN UA · Dev15

Multi-device spatial product experience and prototype platform for SIREN UA.

The canonical product direction is [`docs/MULTI_DEVICE_MASTER_SPEC.md`](docs/MULTI_DEVICE_MASTER_SPEC.md): one normalized intelligence core with device-specific Desktop, Laptop, Smartphone, Tablet, Foldable, TV, Watch, Automotive, Kiosk, Situation Board and XR presentation layers.

The backend financial boundary is documented in [`docs/PARTNER_PLATFORM_MASTER_SPEC.md`](docs/PARTNER_PLATFORM_MASTER_SPEC.md). It is intentionally explicit about the current `NOT_CONNECTED` payment/FX/KYC/payout adapters.

## Run locally

```bash
npm install
npm run dev
```

The development server intentionally uses labelled `DEMO_DATA`. It is not authoritative threat information.

Desktop review shell: `http://127.0.0.1:3000/desktop`.

Smartphone review shell: `http://127.0.0.1:3000/mobile`.

Tablet review shell: `http://127.0.0.1:3000/tablet`.

TV review shell: `http://127.0.0.1:3000/tv`.

Desktop architecture and viewport acceptance: [`docs/DESKTOP_EXPERIENCE.md`](docs/DESKTOP_EXPERIENCE.md).

## Verify

```bash
npm run lint
npm run build
npm run test:financial
npm run test:e2e
npm run test:performance
npm audit --omit=dev
```

PostgreSQL-backed boundaries require an explicit `DATABASE_URL`; in an isolated PostgreSQL test database also run `npm run db:migrate`, `npm run test:postgres-subscription`, `npm run test:postgres-qualified-payment`, `npm run test:postgres-repository` and `npm run test:postgres-http`.

`npm run test:e2e` starts the app in an explicit `NOT_CONNECTED` boundary and covers health/readiness contracts, public shells, mobile and desktop interactions, axe checks, golden screenshots, and critical-content timing. `npm run test:performance` enforces the main JavaScript/CSS bundle budgets after a production build.

See [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) for the exact blockers before production use.
