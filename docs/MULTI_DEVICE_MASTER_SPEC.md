# SIREN UA — Multi-Device Spatial Ecosystem

**Статус:** Production Design Specification  
**Пріоритет:** HIGH  
**Основний принцип:** `ONE INTELLIGENCE CORE → MANY DEVICE EXPERIENCES`

Цей документ є канонічним Master-ТЗ Dev15. Він замінює розрізнені device-specific плани як головне джерело вимог. Детальні нотатки в `docs/` можуть залишатися історичними або довідковими, але суперечності вирішуються на користь цього документа.

## 1. Мета

Побудувати SIREN UA як єдину spatial safety platform, що змінює спосіб подачі та взаємодії залежно від пристрою:

| Device class | Природна перевага | Presentation |
| --- | --- | --- |
| Desktop | повний огляд | Spatial Command |
| Laptop | робота й аналіз | Investigation Workspace |
| Smartphone | персональна відповідь | Personal Safety Companion |
| Tablet | взаємодія руками | Touch Spatial Intelligence |
| Foldable | трансформація | Dual State Experience |
| Smart TV | огляд здалеку | Ambient Situation |
| Watch | швидкість | One-Glance Safety |
| Driver display | безпечне керування | Minimal Safety |
| Passenger display | карта й контекст | Travel Safety |
| Kiosk | публічний доступ | Public Safety Terminal |
| Situation Board | довгий огляд | Operations Display |
| AR / Smart Glasses | контекст поверх світу | Spatial Overlay |
| VR / Vision Pro | просторова аналітика | Spatial Command Room |

Не створювати один універсальний responsive component. Спільними є дані, domain logic і семантика; окремими — композиція, навігація, interaction model, motion, privacy та render strategy.

## 2. Архітектура

```text
SIREN INTELLIGENCE CORE
├── authoritative data / realtime
├── normalized ThreatSceneModel
├── risk, confidence, freshness semantics
├── auth / referral / compensation domains
└── SIREN SPATIAL INTELLIGENCE DESIGN SYSTEM
    └── ExperienceResolver(DeviceCapabilities)
        ├── DesktopExperience
        ├── LaptopExperience
        ├── MobileExperience
        ├── TabletExperience
        ├── FoldableExperience
        ├── TVExperience
        ├── WatchExperience
        ├── AutomotiveExperience
        ├── KioskExperience
        ├── SituationBoardExperience
        └── XRExperience
```

### Shared core

- `ThreatDataProvider`, realtime lifecycle, normalization and freshness.
- `ThreatSceneModel`, `RegionState`, `RiskState`, `Trajectory`, `ETA`, `Shelter`, `TimelineEvent` and source confidence.
- One risk/data truth for all devices; no business-rule copies in presentation components.
- Shared auth, referral, compensation, ledger and partner domains.
- Design tokens for color semantics, type, elevation, glass, motion and rendering quality.

### Presentation layer

Each device owns its layout, prioritized widgets, interaction model, motion profile, privacy class and performance tier. `SirenSpatialCore` may share normalized scene primitives, but its visual renderer is device-specific.

## 3. Spatial design system

### Visual language

Premium Ukrainian technology, safety intelligence and spatial computing: deep navy, graphite, cyan, electric blue, amber, orange, semantic red, controlled green, dark glass, layered maps and restrained glow. No military camouflage, cheap cyberpunk, decorative radar or game-like excess.

### Semantics

- Cyan — personal/selected/current.
- Blue — information.
- Yellow — attention.
- Orange — elevated risk.
- Red — critical.
- Green — clear only when confirmed by system semantics.
- Violet — Partner Program; never use threat-red for earnings.

### Spatial layers

```text
TRAJECTORIES
    ↑
EVENTS
    ↑
RISK
    ↑
PERSONAL REGION
    ↑
SHELTERS
    ↑
BASE MAP
```

Not every device shows every layer. Depth explains relationships; it must not invent data.

## 4. Safety and data rules

Every safety surface separates:

`ПІДТВЕРДЖЕНО` · `ОЦІНКА` · `ПРОГНОЗ` · `НЕВІДОМО`.

Every live surface shows freshness: `LIVE`, update age, `DATA STALE` or `NOT CONNECTED`. Cached/offline state must never look live.

Production is **REAL DATA ONLY**:

- no fake threats, trajectories, ETA, risk, shelters, availability, users or payouts;
- no hardcoded live path or statistics in frontend;
- if an authoritative source is absent, render `NOT CONNECTED`;
- synthetic scenarios are allowed only in visibly labelled `DEMO DATA` mode;
- critical state hides marketing, Partner Program and decorative effects.

ETA is a range with confidence, calculation time and source. A forecast must never be presented as a guaranteed route.

## 5. Device requirements

### P0 — Desktop, Smartphone, Tablet

- **Desktop:** Spatial Command; 3D Ukraine overview, multi-event context, trajectories, timeline, layers, fullscreen and partner dashboard.
- **Smartphone:** Personal Safety Companion; personal region → risk → freshness → relevant threat → direction → ETA → shelter. Maximum 3–4 spatial layers and bottom sheets instead of hover tooltips.
- **Tablet:** Touch Spatial Intelligence; portrait vertical feed and landscape map-first 65/35 workspace. Controlled layer separation, pinch, swipe, region sheet, event focus, timeline sync, shelter split view and presentation mode.

These three experiences exist locally as review/presentation shells and remain the first production priority; they are not production-certified until the authoritative data, identity and persistence integrations are supplied.

### P1 — Laptop, Foldable, TV, Situation Board

- **Laptop:** investigation workspace with map/context split, lower GPU load and productivity-first event/history tools.
- **Foldable:** folded smartphone mode and unfolded compact tablet mode; preserve region, event, layers, timeline and live/history state across hinge changes; never place critical content on the hinge.
- **TV:** ambient, remote-control-first national display readable from 3–5 metres; no private earnings, dense tables or small controls. Support pairing by QR/code and a critical Alert Display Mode.
- **Situation Board:** long-running national/operations display with reconnect, stale-state handling, WebGL recovery, OLED-safe movement and 72-hour soak target.

### P2 — Watch, Automotive, Kiosk

- **Watch:** one-glance region/risk/direction/ETA card, complication-ready, minimal actions, optional haptic semantics; no full Ukraine map.
- **Automotive:** separate Driver Mode and Passenger Mode. Driver is voice-first, minimal and safe while moving; no dense 3D, typing, referrals, payouts or complex settings. Passenger can show more map/context/shelter detail.
- **Kiosk:** public safety terminal, no default login or financial data, automatic reset, restricted settings, public map/status/verified shelter information and download QR.

### P3 — AR, VR, spatial computing

- **AR / Smart Glasses:** minimal contextual overlay for region, risk, direction and verified shelter guidance; never place an unverified threat over a building.
- **VR / Vision Pro:** Window, Volume and Immersive modes around a central spatial Ukraine model with timeline, sources, events and region focus.
- XR must be comfortable: no sudden camera teleport, flash, aggressive motion or sound-only safety signal.

## 6. Capability resolution

`ExperienceResolver` must use viewport, pointer type, hover capability, orientation, WebGL/WebGPU availability, device memory, DPR, reduced-motion and input type. User-Agent alone is insufficient.

Recommended rendering profiles:

| Tier | Use | Policy |
| --- | --- | --- |
| ULTRA | high-end desktop/XR | richer geometry and selective post-processing |
| HIGH | modern laptop/iPad Pro | full spatial depth, bounded effects |
| MEDIUM | smartphone/standard tablet | fewer layers, lower blur and DPR |
| LOW | old device/weak TV | reduced transparency, shadows and update rate |
| STATIC | unsupported/reduced motion | SVG/2D/2.5D with feature parity |

3D is lazy-loaded. Semantic DOM content appears before the heavy renderer. DPR, draw calls, transparency, texture memory and long-session memory are budgeted per device.

## 7. Privacy classes and continuity

| Class | Devices | Default data |
| --- | --- | --- |
| PRIVATE | phone, personal laptop | personal region and authenticated context |
| SHARED | tablet, TV | public/selected context; no private finance by default |
| PUBLIC | kiosk, situation board | anonymous public safety data only |
| RESTRICTED | watch, driver display | minimum glanceable safety state |

Cross-device continuity may sync saved areas, preferences, active layers and notification preferences when policy permits. It does not sync camera angle. TV pairing is QR/code → phone confirmation → revocable scoped device token.

## 8. Partner and financial domain

Partner experiences are P0 on desktop, laptop, smartphone and tablet. TV, watch, car and XR do not show financial information by default.

Ranks: Starter 5%, Bronze 10%, Silver 15%, Gold 20%, Platinum 25%. Compensation is limited to L1/L2, uses qualified active paid L1 for rank, versioned QCB/rate/rounding policies, an immutable double-entry ledger, idempotent payouts and a hard transaction cap of 50%. Presentation must never become the source of financial truth.

## 9. Routes and feature flags

Use a route only when it represents a real experience or platform shell. Current review shells:

`/desktop` · `/mobile` · `/tablet` · `/tv`

Future candidates: `/display`, `/kiosk`, `/partner` and platform-native shells where the current stack requires them. Gate unfinished surfaces with feature flags such as `desktop_spatial_v2`, `tablet_spatial_v2`, `tv_mode`, `kiosk_mode` and `xr_preview`.

## 10. Delivery phases

1. **Audit:** current Dev15, source repositories, contracts, risks and blockers.
2. **Shared core:** normalized model, realtime, freshness, capability resolver, tokens and spatial primitives.
3. **P0:** Desktop → Smartphone → Tablet.
4. **P1:** Laptop → Foldable → TV → Situation Board/Kiosk foundation.
5. **P2:** Watch → Automotive → Kiosk hardening.
6. **P3:** AR/VR/Vision/spatial command room.
7. **Continuity:** pairing, device tokens and preference sync.
8. **Production hardening:** security, accessibility, performance, E2E, visual regression and soak tests.

Do not implement all platforms simultaneously. Do not advance a lower-priority demo while P0 data reliability, auth, realtime or stale detection is broken.

## 11. Quality gates

Every phase must run lint, type-check, unit/integration tests, build, smoke and relevant E2E/accessibility/performance checks. Visual regression must cover desktop, smartphone, tablet portrait/landscape, foldable states, TV, kiosk and situation board. Long-running targets: tablet 2h, desktop 4h, TV 24h+, Situation Board 72h.

Definition of production-ready:

- authoritative ThreatServer and identity/payment integrations verified;
- no fake live state or fake financial state;
- migrations and ledger invariants validated;
- security review, accessibility and performance gates pass;
- device-specific visual/interaction tests pass;
- staging smoke and long-session checks pass;
- exact remaining blockers documented if any gate is unavailable.

## 12. Current Dev15 status

- **Implemented:** shared spatial model, Desktop, Smartphone and Tablet presentation layers, labelled demo/not-connected states, responsive tablet portrait/landscape QA, core production-hardening documentation.
- **Available review shells:** `/desktop`, `/mobile`, `/tablet`, `/tv`.
- **Blocked / unverified:** authoritative ThreatServer, SirenUA identity/app contracts, real geographic mesh source, production database, payout provider and full CI/E2E/soak infrastructure because the referenced repositories/integrations are not currently accessible in this workspace.
- **Current release status:** `BLOCKED`, not `PRODUCTION READY`.

## 13. 3D Visual System — Live Spatial Digital Twin

Цей розділ є єдиним джерелом вимог для 3D-візуальної частини всіх presentation layers.

### 13.1 Core objective

SIREN UA має показувати не звичайну карту з маркерами, а `SIREN UA LIVE SPATIAL DIGITAL TWIN`: нормалізовану просторову модель України, у якій географія, області, персональна зона, ризик, події, траєкторії, укриття, джерела, freshness і час пов’язані між собою.

Wow-effect має виникати від зрозумілої структури даних: focus на області → elevation → relevant event → confirmed/estimated/predicted trajectory → confidence corridor → time reconstruction → повернення до LIVE. Не використовувати screen shake, вибухи, постійний хаотичний glow або military-game стилізацію.

### 13.2 Geometry pipeline

```text
GeoJSON / TopoJSON
  → normalization
  → simplification
  → triangulation
  → region meshes
  → selectable spatial layers
  → adaptive GPU renderer
```

Кожна область — окремий selectable mesh із `regionId`, geometry, state, risk, selected/personal flags, `updatedAt` та confidence. PNG/JPEG silhouette не є джерелом географічної істини. До появи доступного authoritative geometry source використовується позначений 2D/2.5D fallback, а не вигадана мапа.

### 13.3 Layer architecture

Підтримати шари `BASE`, `ADMINISTRATIVE`, `INFRASTRUCTURE`, `PERSONAL_REGION`, `SHELTERS`, `RISK`, `EVENTS`, `TRAJECTORIES` і `TEMPORAL`. Compact view показує лише потрібну підмножину; `EXPLODED` view контрольовано розділяє шари по spatial axis і потім плавно recomposes їх.

`SirenSpatialCore` споживає лише normalized `ThreatSceneModel`. Raw API parsing, risk calculation, ETA calculation і business logic не можуть жити всередині mesh/presentation components.

### 13.4 Semantic trajectories

Trajectory має розділяти observed/estimated/predicted path, direction, confidence, `updatedAt` і status. Confirmed = solid/stable; estimated = lighter/transparent; predicted = dashed/fading із `Confidence Corridor`. Поточна позиція показується лише за наявності підтвердженого поля. Spatial arc height — лише visual separation, не altitude.

Event node має marker, status ring, category, timestamp і короткий DOM label. Новий event отримує один-два controlled pulses і переходить у stable state. За високої щільності застосовуються relevance, priority та clustering.

### 13.5 Camera, time and safety states

Camera modes: `NATIONAL`, `REGION`, `DISTRICT`, `EVENT_FOCUS`, `EXPLODED`, `TIMELINE`, `FULLSCREEN`. Camera має bounded orbit/zoom/pan, 30–45° perspective target і smooth transitions 500–900ms. Timeline має синхронізувати карту, risk, events і trajectories; history завжди має видимий badge і кнопку `ДО LIVE`.

При `STALE`, `ERROR` або `NOT CONNECTED` live styling вимикається. Critical state піднімає лише relevant region/event/trajectory/status; весь екран не стає червоним. Safety data, ETA, freshness, source і accessibility залишаються semantic DOM поруч із canvas.

### 13.6 Rendering and fallback

Профілі: `ULTRA`, `HIGH`, `MEDIUM`, `LOW`, `STATIC`. Знижувати якість у порядку particles → reflections → complex shadows → volumetrics → DPR; останніми зберігати geometry, risk, events, trajectories і labels. Використовувати lazy loading, adaptive DPR, render-on-demand, shared materials, batching/instancing і compressed assets.

WebGL2 — baseline; WebGPU — progressive enhancement. При недоступному WebGL показувати 2D/2.5D safety mode з тією самою інформацією. Critical HTML/status має бути видимим до завантаження важкого 3D engine.

### 13.7 3D acceptance gates

- separate region meshes from authoritative geometry;
- compact/exploded layer interaction and recomposition;
- region/event focus and semantic DOM equivalent;
- confirmed/estimated/predicted visual distinction and confidence corridor;
- timeline history/live reconstruction;
- stale/offline/NOT CONNECTED and WebGL fallback;
- reduced motion, keyboard, screen reader and color-independent semantics;
- 1366×768, 1440×900, 1920×1080, 4K and ultrawide visual regression;
- FPS/GPU/memory profiling and 30-minute, 2-hour and 4-hour long-session checks;
- no fake live paths, positions, ETA, risk, shelter availability or accuracy claims.
