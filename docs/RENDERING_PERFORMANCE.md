# Rendering Performance

## Quality tiers

- `ULTRA` — desktop high-end GPU, повний spatial core.
- `HIGH` — laptop, менша depth та кількість ефектів.
- `MEDIUM` — tablet, touch-first core.
- `LOW` — mobile, 3–4 шари та спрощені тіні.
- `STATIC` — reduced motion, low power або WebGL failure.

У поточному прототипі core реалізовано через lightweight CSS 3D без важкого canvas. Наступний крок для реальної геометрії — lazy-loaded GeoJSON/TopoJSON та окремий WebGL renderer із 2D fallback.

## Gates

Initial HTML/CTA < 1.5s, interactive < 2.5s, LCP < 2.5s, CLS < 0.1, INP < 200ms — цілі для staging-профілювання. Live data не кешується як свіжа без timestamp validation.

