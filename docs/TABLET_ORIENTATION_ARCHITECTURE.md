# Tablet Orientation Architecture

Orientation is a presentation concern, not a second data model.

## Portrait

Uses a vertical flow, context below the spatial deck and a fixed bottom navigation bar. The layout is designed for one-handed access and touch targets of at least 44 CSS pixels.

## Landscape

Uses a slim side rail, a two-column map/context workspace and a horizontal timeline. The map remains the primary surface and the context panel can be compact, standard or expanded.

## State preservation

Changing orientation only updates `TabletSceneState.orientation`. It does not reset `selectedRegion`, `selectedEvent`, `activeLayers`, `timelinePosition`, `liveMode` or the selected layer. If new live data arrives while the user is inspecting history, the history position remains stable until the user returns to LIVE.

The CSS keeps tablet mode active for coarse-pointer/tablet widths in the current web shell; future capability detection can refine this without changing the presentation components.

