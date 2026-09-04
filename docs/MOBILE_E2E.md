# Mobile E2E Coverage

Перевірено локально через browser smoke:

- `/mobile` portrait `390×844`;
- головна сторінка на mobile автоматично показує Personal Spatial Mode;
- landscape `844×390` без горизонтального overflow;
- bottom sheet: PEEK → HALF → FULL → close;
- Alert Focus через `Деталі`;
- bottom navigation: Карта, Хронологія, Укриття, Партнер, Профіль;
- `NOT CONNECTED` / `DEMO DATA` labels;
- console warnings/errors відсутні.

Ще потрібні staging-тести для реальних SSE/WebSocket, reconnect, offline/online, native share, auth, payout та physical-device performance.

