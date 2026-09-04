# INTEGRATION CONTRACTS — SIREN UA ECOSYSTEM

## 1. SirenUA-ThreatServer Integration Contract
- **Base Path**: `/api/threats/v1`
- **Authoritative Source**: ThreatServer engine.
- **Endpoints**:
  - `GET /api/threats/status`: Health check, stream status, and global alert active count.
  - `GET /api/threats/live`: Active threats array (lat, lon, vector_deg, speed_kmh, trajectory_points, risk_level, confidence, status, updated_at).
  - `GET /api/threats/regions`: Regional alerts map (oblast, raion, hromada status, shelter count).
  - `GET /api/threats/timeline`: Event chronology log with verified/estimated tags.
- **Confidence Taxonomy**:
  - `CONFIRMED`: Multiple radar/visual verifications.
  - `ESTIMATED`: Trajectory computed from speed & bearing.
  - `PREDICTED`: Algorithmic potential threat cone.
  - `UNVERIFIED`: Single unverified radar signature.
  - `UNKNOWN`: Incomplete telemetry.
- **Fallback Policy**:
  - If ThreatServer is offline or unconfigured: return state `NOT CONNECTED` / `DATA UNAVAILABLE`.
  - Zero synthetic data generation in production. Interactive sandbox simulator explicitly watermarked as `DEMO`.

## 2. SirenUA Mobile App Deep-Link Contract
- **Custom Scheme**: `sirenua://ref/{referral_code}`
- **Universal Links**: `https://sirenua.com/join/{referral_code}`
- **Fallback**: Google Play / Apple App Store with deferred attribution cookie / token pass-through.

## 3. Payment Service Provider (PSP) Contract
- **Abstraction Interface**: `createRecipient()`, `verifyRecipient()`, `calculateFee()`, `createPayout()`, `getPayout()`, `cancelPayout()`, `handleWebhook()`, `reconcile()`.
- **Supported Adapters**: Monobank P2P / IBAN, LiqPay, SEPA IBAN, Stripe Connect.
- **Idempotency**: All payout calls require header `Idempotency-Key: uuid-v4`.
