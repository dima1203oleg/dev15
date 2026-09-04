# SIREN UA Tablet Experience

## Product role

Tablet is the Touch Spatial Intelligence surface between the desktop overview and the smartphone personal companion. It uses a large touch screen to let a user inspect the same normalized threat model through a spatial deck.

## Compositions

- **Portrait:** vertical spatial feed — personal status, interactive deck, context, timeline and bottom navigation.
- **Landscape:** map-first workspace — slim side rail, map deck at roughly 65%, context panel at roughly 35%, and a synchronized bottom timeline.

The tablet renderer is a separate presentation layer in `src/components/TabletExperience.tsx`. It shares domain data with other surfaces but does not reuse their layout.

## Modes

`OVERVIEW`, `EVENTS`, `TIMELINE`, `SHELTERS`, `PARTNER`, `PROFILE`, `PRESENTATION` and `ALERT_FOCUS` are explicit tablet modes. Critical states hide secondary partner/marketing emphasis and prioritize risk, event context and shelters.

## Data safety

The scene uses `ThreatSceneModel`. `DEMO DATA` is always labelled and is never presented as an operational feed. `NOT CONNECTED` renders a clear unavailable state and a 2.5D/fallback message. Real geographic boundaries and live ThreatServer contracts remain integration blockers until their source repositories/API are available.

