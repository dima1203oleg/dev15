# Threat Scene Architecture

## Pipeline

`ThreatServer → adapter/normalization → ThreatSceneModel → device renderer → semantic DOM summary`.

Renderer не повинен читати сирий API response. Для майбутньої інтеграції потрібні нормалізовані `RegionState`, `ThreatEventModel`, `TrajectoryModel`, `RiskState`, `ShelterModel` та `TimelineEvent`.

## Safety contract

- `CONFIRMED`, `ESTIMATED`, `PREDICTED`, `UNVERIFIED`, `UNKNOWN` показуються текстом і не кодуються лише кольором.
- ETA — діапазон та оцінка, не гарантований маршрут.
- Відсутній endpoint означає `NOT CONNECTED`, а не fixture у production.
- Стан має `lastUpdated`; stale state не можна показувати як live.

## Future primitives

Архітектура готує `SpatialScene`, `LayerStack`, `ThreatNode`, `Trajectory`, `RiskVolume`, `RegionMesh` для WebXR, AR glasses та VR room без прив’язки до конкретного vendor SDK.

