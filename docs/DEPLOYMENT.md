# Deployment

Development: `npm run dev` (explicit development mode; demo fixtures allowed).

Production build: `npm run build`.

Production server: `NODE_ENV=production npm start`. Configure a verified ThreatServer and payment provider before enabling those capabilities. Never place production secrets in `.env.example`, client bundles or demo fixtures.
