# SIREN UA 3D Design System

## Visual language

SIREN UA використовує deep navy / graphite surfaces, cyan information light, amber elevated risk, rose critical state та emerald shelter state. Glass, elevation і glow мають пояснювати статус або ієрархію, а не бути декорацією.

## Spatial Intelligence Core

Єдина нормалізована модель `ThreatSceneModel` подається різним presentation-layer компонентам. Шари: `LIVE_DATA`, `SHELTERS`, `PERSONAL_REGION`, `RISK`, `TRAJECTORY`, `EVENTS`.

`src/components/DeviceExperienceLab.tsx` містить окремі сцени для кожного класу пристрою; `src/data/spatialModel.ts` є shared data contract. `DEMO_SPATIAL_MODEL` — тільки візуальна fixture і завжди має маркування `DEMO DATA`. Hero і device lab отримують той самий `ThreatSceneModel`, що й dedicated safety routes; live trajectory points переносяться з normalized threat payload і не замінюються hardcoded path.

## 3D tokens

- Depth: `xs`, `sm`, `md`, `lg`, `xl` через `translateZ`, тіні та контраст поверхонь.
- Glow: cyan = information/current, amber = elevated risk, rose = critical, emerald = shelter.
- Material: glass = context, opaque dark = system base, emissive/pulse = state change.
- WebGL не є обов’язковим: CSS 3D дає доступний fallback для core prototype. Поки authoritative GeoJSON/TopoJSON та production WebGL renderer не підключені, система не видає CSS-візуалізацію за географічний digital twin.

## Device constellation continuity

У connected path окрема композиція desktop → tablet → smartphone також рендериться з того самого normalized `ThreatSceneModel`: регіон, ризик, freshness, подія та trajectory не мають другого джерела істини. У development/demo path ця композиція залишається візуальною ціллю з постійним маркуванням `DEMO DATA · VISUAL TARGET`.
