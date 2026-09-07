# SIREN UA upstream content catalog

Дата аудиту: 2026-09-07

Цей каталог фіксує, що було витягнуто з трьох upstream-репозиторіїв і які частини вже доступні у Dev15. Секрети, production-бази, приватні Apple-ідентифікатори та runtime credentials у каталог не копіюються.

## Джерела

| Репозиторій | Роль | Обсяг локальної копії | Що містить |
|---|---|---:|---|
| `atlastrinity/SirenUA-Website` | web content / landing / referral portal | ~5.1 MB | 19 HTML, 4 CSS, 5 JS, assets, server proxy, web docs |
| `atlastrinity/SirenUA` | iOS client | ~9.2 MB | 398 Swift files, SwiftUI screens, referral, StoreKit, maps, shelters, notifications |
| `atlastrinity/SirenUA-ThreatServer` | backend / API / data processing | ~9.2 MB | 444 Python files, 64 test files, 109 live OpenAPI paths, referral DB/services |

## Що вже імпортовано у Dev15

`public/source-content/` містить весь статичний web-контент Website-репозиторію:

- українські сторінки: home, features, about, investors, privacy, support, terms;
- англійські сторінки: home, features, about, investors, privacy, support, terms;
- referral landing `/ref/` і referral portal;
- modules catalog та web modules catalog;
- `main.css`, `components.css`, `animations.css`, `referral.css`;
- `main.js`, `animations.js`, `particles.js`, `referral.js`, `support.js`;
- app icon та пов’язані статичні assets.

Фактична перевірка: 19/19 HTML, 4/4 CSS і 5/5 JS-файлів Website присутні в `public/source-content/`.

## Website content map

### Презентаційний контент

- головна сторінка SIREN UA;
- можливості та опис системи;
- як працює продукт;
- інформація про компанію;
- інвесторський розділ;
- підтримка та FAQ;
- terms/privacy;
- українська та англійська локалізації.

### Referral content

- referral landing за кодом;
- referral cabinet/admin portal;
- QR-код і referral-link generation;
- дерево користувачів;
- referral users table;
- KPI, earnings, conversion і payout-oriented UI;
- Universal Links configuration через `.well-known/apple-app-site-association`.

### Web architecture content

- interactive modules catalog;
- server/deployment documentation;
- referral ecosystem architecture;
- web portal architecture;
- CI/CD і operations guides;
- tactical visualization and threat-origin documentation.

## iOS content map

### Core app

- SwiftUI application shell;
- region/city/district registries;
- MapKit geometry and map layers;
- threat state, threat types, threat levels and threat formatting;
- shelter search, ranking, routing and safety classification;
- history sessions and historical region events;
- notifications, sound policy and district subscriptions;
- StoreKit Premium access and paywall components.

### Referral subsystem

91 Swift files are dedicated to referral functionality, including:

- `ReferralAPI` and admin API;
- profile, stats, earnings, tree and payout models;
- referral registration and activation;
- referral code validation;
- referral link generation;
- deep-link and Universal Link handling;
- Apple identity persistence through Keychain;
- StoreKit-to-referral activation;
- recursive network tree;
- admin users, commissions, payouts and configuration;
- QR scanner, QR generation and share sheet;
- rank, ambassador, charts and financial metric views.

Canonical iOS referral link:

`https://sirenua.online/ref/{CODE}`

### iOS API contracts

The iOS client references the following backend domains:

- `/api/threats`;
- `/api/history/{region}`;
- `/api/shelters/*`;
- `/api/referral/*`;
- `/api/admin/*`;
- `/api/analytics/*`;
- `/api/gemini/status`;
- `/health` and `/api/health`.

## ThreatServer content map

### Runtime architecture

- FastAPI REST server;
- Telegram/MTProto ingestion and fallback scraper;
- official UkraineAlarm synchronization;
- threat normalization, classification and deduplication;
- trajectory geometry, kinematics, ETA and corridors;
- tactical integrity and target ledger;
- AI analyzer and algorithmic fallback;
- SQLite/Firestore persistence and backups;
- shelter database and spatial search;
- FCM notification dispatch;
- admin analytics, chronology, Palantir and rule learning;
- referral database and commission engine.

### Source volume

- 444 Python files;
- 64 backend test files;
- 24 referral Python modules;
- 52 API Python modules;
- 49 database Python modules;
- 45 Markdown documents;
- 109 routes in the live `openapi.json`.

## Complete live API route groups

### Public/live product APIs

- `GET /health`
- `GET /api/health`
- `GET /api/threats`
- `GET /api/history/{region}`
- `GET /api/shelters`
- `GET /api/shelters/by_region`
- `GET /api/shelters/regions`
- `GET /api/shelters/search`
- `GET /api/analytics/stats`
- `GET /api/analytics/groups`
- `GET /api/analytics/heatmap`
- `GET /api/analytics/lifecycle/{region}`
- `GET /api/analytics/paired-events`
- `GET /api/analytics/patterns`
- `GET /api/analytics/predictions`
- `GET /api/analytics/rules`
- `GET /api/analytics/telemetry/{region}`
- `GET /api/gemini/status`
- `GET /api/sources/status`

### Referral APIs

- `POST /api/referral/register`
- `POST /api/referral/link`
- `PUT /api/referral/profile`
- `POST /api/referral/profile`
- `POST /api/referral/activate`
- `GET /api/referral/me`
- `GET /api/referral/stats`
- `GET /api/referral/tree`
- `GET /api/referral/earnings`
- `POST /api/referral/payout/request`
- `GET /api/referral/code/{code}/validate`
- `GET /api/referral/user/{identifier}`

### Admin referral APIs

- `GET /api/admin/referral/analytics`
- `GET /api/admin/referral/commissions`
- `GET, PUT /api/admin/referral/config`
- `GET /api/admin/referral/overview`
- `GET /api/admin/referral/payouts`
- `POST /api/admin/referral/payout/{payout_id}/approve`
- `POST /api/admin/referral/payout/{payout_id}/reject`
- `GET /api/admin/referral/tree/{identifier}`
- `GET, DELETE /api/admin/referral/user/{identifier}`
- `PUT /api/admin/referral/user/{user_id}/adjust-balance`
- `PUT /api/admin/referral/user/{user_id}/block`
- `GET /api/admin/referral/users`

### Admin and operational APIs

The server also exposes admin groups for dashboard stats, chronology, errors, database backup/restore, Firestore operations, deployment webhooks, ngrok, Palantir, analytics intelligence, learning rules, system controls and threat scenarios. These routes must remain admin-gated and must not be exposed as public partner data.

## Referral database model extracted from ThreatServer

The backend referral subsystem defines five core SQLite tables:

1. `referral_users` — Apple identity, code, display name, referrer, subscription and balances.
2. `referral_tree` — adjacency list plus materialized path, depth, children and network size.
3. `referral_transactions` — StoreKit transaction identity, product, amount, status and hash.
4. `referral_commissions` — beneficiary, source user, level, rate, amount and status.
5. `referral_payouts` — payout amount, method, status, timestamps and admin notes.

## Dev15 integration status

### Connected and verified

- profile identity via `/api/referral/me`;
- real referral code;
- referral stats;
- referral tree;
- earnings history;
- real rank calculation from qualified L1 data;
- real shelter and threat APIs;
- canonical referral URL;
- local Vite proxy;
- production CORS;
- LIVE/STALE/NOT_CONNECTED semantics.

### Available upstream and next integration candidates

These routes exist upstream and should be wired through dedicated adapters rather than treated as missing:

- `/api/referral/profile` for profile update;
- `/api/referral/link` for applying a referral code;
- `/api/referral/register` for registration;
- `/api/referral/activate` for verified subscription activation;
- `/api/referral/payout/request` for payout request flow;
- `/api/analytics/*` for threat analytics;
- `/api/admin/referral/*` for protected admin cabinet.

### Not present in the current live contract

These legacy paths are not part of the current ThreatServer OpenAPI contract and return 404:

- `/api/partner/*`;
- `/api/profile/me`;
- `/api/kyc/status`;
- `/api/auth/security`;
- `/api/subscription/trial`.

Dev15 must continue to show these capabilities as unavailable until a real contract is added. No financial or identity data should be fabricated in their place.

## Source-of-truth rule

The repositories are complementary:

- Website is the source for public web content and referral portal presentation.
- iOS is the source for mobile interaction patterns, StoreKit, referral UX and client models.
- ThreatServer is the source for live API contracts, threat data, shelters, referral data and backend business rules.

Dev15 should import content and contracts from these sources, but should not copy secrets, private databases, generated runtime state or admin-only operations into the public frontend bundle.
