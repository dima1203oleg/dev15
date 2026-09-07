# Upstream SIREN UA repositories

Ця гілка інтеграції підготовлена на основі приватних upstream-репозиторіїв:

| Repository | Snapshot | Роль |
| --- | --- | --- |
| `atlastrinity/SirenUA-Website` | `c7e637a` | Статичний веб-контент, локалізації, довідкові та партнерські сторінки |
| `atlastrinity/SirenUA` | `d8eeb3a` | Нативний iOS-клієнт Swift/MapKit |
| `atlastrinity/SirenUA-ThreatServer` | `bf6d4fc` | Backend, realtime threat processing, history, analytics та admin API |

## Що додано до Dev15

Вміст `SirenUA-Website` доступний у deployable static namespace:

`/source-content/index.html`

Він зберігає upstream-сторінки та їхні assets окремо від React application shell. Посилання на нього додано у footer основного сайту.

Swift/iOS та Python/ThreatServer не копіюються у browser bundle: вони використовують інші runtime, secrets, deployment та data-access boundaries. Їхні API-контракти інтегруються через normalized frontend services, а не через дублювання backend-коду.

## Production safety

Основний React-додаток продовжує дотримуватися `REAL DATA ONLY`: upstream-статичний контент не є live threat feed, не підміняє realtime API та не змінює wallet/financial truth.
