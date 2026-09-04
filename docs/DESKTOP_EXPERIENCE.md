# SIREN UA Desktop Experience

## Current implementation

Окремий route `/desktop` відкриває `SIREN SPATIAL COMMAND DESKTOP` без mobile/tablet/TV shell. На homepage той самий desktop renderer доступний у вкладці «Комп’ютер».

У desktop stage реалізовано:

- `MARKETING` → `INTELLIGENCE` → `ALERT_FOCUS` transitions;
- left context panel: personal area, regional focus, map layer switches;
- central `3D UKRAINE CORE` presentation with controlled CSS spatial layers;
- right intelligence panel: situation, event count, confidence, freshness, ETA;
- region focus for national / Kyiv / east sector;
- layer toggles with `aria-pressed`;
- event timeline scrubber with reconstruction state and `Повернутися в LIVE`;
- 2D fallback state and explicit `NOT CONNECTED` behavior;
- fullscreen action and shortcuts `F`, `L`, `T`, `R`, `Esc`.

## Viewport acceptance

Перевірено без горизонтального overflow: `1366×768`, `1440×900`, `1920×1080`. Timeline повністю видима на першому екрані. Бокові panels мають власний scroll, щоб не виштовхувати timeline за viewport.

## Geometry blocker

У доступному Dev15 немає GeoJSON/TopoJSON або готового region mesh. Поточний core навмисно не імітує реальну карту України fake silhouette-ом. Для production geometry потрібен authoritative geographic asset: `GeoJSON/TopoJSON → optimized geometry → RegionMesh`, з полями `regionId`, `riskState`, `alertState`, `updatedAt`, `confidence`, `selected`, `personalRegion`.

## Production gates still open

ThreatServer, identity, durable event store, authoritative geography, WebGL/R3F renderer, real-time normalization, screenshot regression runner та performance profiler ще не підключені. До цього моменту всі локальні сцени з fixture мають маркування `DEMO DATA` і не є live safety data.

