# Accessibility for 3D

- Уся критична інформація доступна в semantic DOM/cards, не лише в canvas або CSS layers.
- Ризик має icon + text + color.
- Keyboard focus і `focus-visible` обов’язкові для desktop.
- Touch targets — мінімум 44×44 CSS px.
- `prefers-reduced-motion` переводить досвід у спокійний static mode.
- WebGL failure не блокує зміст: показується 2D/semantic fallback і стан `NOT CONNECTED`, якщо джерело відсутнє.
- Інтерактивні tabs мають `role=tab` та `aria-selected`; device-specific сцени не повинні приховувати стан від screen reader.

