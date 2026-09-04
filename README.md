# SIREN UA · Dev15

Multi-device spatial product experience and prototype platform for SIREN UA.

The canonical product direction is [`docs/MULTI_DEVICE_MASTER_SPEC.md`](docs/MULTI_DEVICE_MASTER_SPEC.md): one normalized intelligence core with device-specific Desktop, Laptop, Smartphone, Tablet, Foldable, TV, Watch, Automotive, Kiosk, Situation Board and XR presentation layers.

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
```

See [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) for the exact blockers before production use.
