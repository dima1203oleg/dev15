# Deployment

Development: `npm run dev` (explicit development mode; demo fixtures are allowed unless `SIREN_*_MODE=NOT_CONNECTED`). Any other `NODE_ENV` is treated as production-like and cannot serve synthetic fixtures.

Production build: `npm run build`.

Production server: `NODE_ENV=production npm start`. Configure a verified ThreatServer and payment provider before enabling those capabilities. Never place production secrets in `.env.example`, client bundles or demo fixtures.
