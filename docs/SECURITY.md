# Security Baseline

Before production: server-side authz for every partner/admin route; CSRF protection where cookie auth is used; strict validation; rate limits; secure headers; secret scanning; signed webhook verification with timestamp/replay protection; IDOR, XSS, SQLi, SSRF and privilege-escalation tests; append-only audit records; no card, tax or KYC details in partner UI. Production-like responses now include CSP, same-origin opener/resource policies and a restrictive Permissions-Policy; external integrations must extend `connect-src` deliberately when they are added.

Referral URLs use `SIREN_PUBLIC_ORIGIN` (or the existing `APP_URL`) when configured. A production runtime must not derive public links from the request `Host` header; local host-derived links are limited to development/demo mode. Referral attribution cookies are `HttpOnly`, `SameSite=Lax`, and receive `Secure` in production-like mode.
