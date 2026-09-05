# Production Readiness

## Current verdict: BLOCKED

Build and local smoke pass, but production gates are not met. Blocking items: reference repositories/URLs inaccessible, ThreatServer not connected, no deployed identity/RBAC configuration, no payment provider/KYC/AML, no production payout orchestration, no staging integration/security pipeline, and no staging smoke evidence. PostgreSQL schema/migrations, connection probe, append-only rank history, durable trial lifecycle, transactional qualified-payment/commission/ledger boundary and authenticated partner read projection are locally verified. Local type, financial, browser, accessibility, performance and dependency checks are present and passing.

The site is a strong visual/product prototype with explicit safety boundaries. The Partner Platform 4.0 domain primitives are covered by local acceptance tests, but this is not a production operational threat or payout platform yet: all real payment, FX, KYC/AML, database and provider adapters remain blocked until connected and independently verified. Synthetic fixtures are now limited to `NODE_ENV=development`; staging/production-like runtimes fail closed even when a demo-like mode is supplied.
