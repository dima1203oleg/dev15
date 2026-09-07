# Аудит джерел даних (Data Source Audit)

Цей документ описує походження, сервіси та життєвий цикл даних для кожного інформаційного блоку у додатку SIREN UA. Всі дані інкапсульовані у `DataEnvelope<T>` для відстеження їхньої актуальності (LIVE, CACHED, STALE, ERROR).

## 1. Головний екран (Home / Map)
- **Карта загроз (3D WebGL / SVG)**
  - **Джерело**: `threatServerService.ts`
  - **Дані**: `ThreatSceneModel` (радари, траєкторії БпЛА/Ракет, укриття)
  - **Fallback**: структурований `NOT_CONNECTED` baseline; cached payload використовується тільки за валідним TTL і позначається як `CACHED/STALE`.

- **Регіональні статуси (Тривоги)**
  - **Джерело**: API регіональних статусів; `ukraineMapData.ts` та localStorage — лише географічний/DEMO baseline.
  - **Дані**: Масив `RegionData` (статус тривоги, активні загрози).

## 2. Мережа (Network / Affiliate)
- **Агрегована статистика (Активні L1, L2, Конверсія)**
  - **Джерело**: `networkService.ts` (`fetchNetworkSummary`)
  - **Дані**: `NetworkSummary`
  - **Fallback**: локальний набір повертається тільки як `DEMO`; production API failure повертає `NOT_CONNECTED` без числового fallback.

- **Дерево партнерів та список**
  - **Джерело**: `networkService.ts` (`fetchNetworkNodes`)
  - **Дані**: Масив `NetworkNode`
  - **Fallback**: локальний набір повертається тільки як `DEMO`; production API failure не підміняється списком партнерів.

- **Прогрес Рангу**
  - **Джерело**: Розраховується динамічно через `referralEngine.ts` на основі `summary.qualifiedL1`.
  - **Дані**: `RankTier`, прогрес-бар %.

## 3. Фінанси (Finance)
- **Баланс та метрики**
  - **Джерело**: `financialService.ts` (`fetchFinancialSummary`)
  - **Дані**: `PartnerFinancialSummary` (availableBalance, pendingBalance, lifetimePaid)
  - **Fallback**: локальний summary повертається тільки як `DEMO`; при недоступному finance API баланс і ledger позначаються як `NOT_CONNECTED`.

- **Історія транзакцій (Ledger)**
  - **Джерело**: `financialService.ts` (`fetchLedger`)
  - **Дані**: Масив `LedgerTransaction`
  - **Fallback**: CACHED з `CacheManager`.

- **Життєвий цикл виплат (State Machine)**
  - **Джерело**: `financialService.ts` (`executeWithdrawal`)
  - **Дані**: production запит передається до payout provider API; локальний шлях створює лише явно позначену `DEMO`-заявку `REQUESTED` і не змінює баланс, ledger або статус `PAID`.

## 4. Загальна інфраструктура
- **Кешування**: `CacheManager.ts` з TTL (Time-to-Live) та валідацією версії.
- **Стан (Freshness)**: Відстежується через компонент `DataFreshnessIndicator`, що базується на полі `state` у `DataEnvelope`.

## 5. Production safety rules

- `LIVE` дозволено лише після успішної відповіді відповідного API та базової перевірки payload.
- `DEMO` використовується лише для локальної демонстрації та завжди має видимий маркер.
- `NOT_CONNECTED` не має права показувати demo/cache фінансові значення, live threat paths або підтверджену shelter availability.
- Відсутня інтеграція має бути видимою як `API не підключено`, `Дані недоступні` або `DEMO`, а не замаскована під production state.
