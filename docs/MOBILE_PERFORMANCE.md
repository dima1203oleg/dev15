# Mobile Performance

- Portrait-first, landscape map focus підтримано.
- Немає horizontal overflow на `390×844` та `844×390`.
- Mobile використовує спрощені шари, CSS 3D та короткий motion profile.
- Safe-area padding підготовлено через `env(safe-area-inset-top/bottom)`.
- `prefers-reduced-motion` успадковує глобальний static behavior.
- Для майбутнього WebGL: LOW/MEDIUM tiers, clamped DPR, pause in background, 2.5D/SVG fallback.

Фактичні FPS, memory та battery профілі потребують device lab/staging і ще не можуть бути оголошені production-показниками.

