# Mobile 3D Architecture

`MobileSpatialMap` використовує Personal Region Stack із чотирьох semantic layers: trajectory, risk, personal region, shelters/base. На смартфоні видно максимум 3–4 шари; active layer змінюється через swipe up/down або tap context.

CSS 3D є lightweight presentation layer. Він може бути замінений на WebGL/2.5D renderer без зміни `ThreatSceneModel`. Якщо data mode `NOT_CONNECTED`, core показує стан очікування і не створює fake threat.

