# Tablet Performance

## Rendering tiers

The current implementation keeps the spatial deck CSS/DOM based, which provides the 2.5D fallback for unavailable WebGL. The renderer is ready to map to shared `SpatialScene` primitives when real geometry becomes available.

- High: full layer depth and controlled transitions.
- Medium: reduced blur/shadow and fewer simultaneous layers.
- Low: simplified 2.5D surfaces.
- Static: reduced motion or unsupported rendering capability.

The deck clamps zoom, limits six major layers and avoids an always-running particle system. Background tabs should pause any future canvas loop and refresh data on return.

## Acceptance targets

- No horizontal overflow at target tablet widths.
- Initial HTML and status readable before any heavy renderer initializes.
- 45–60 FPS target on supported tablets; interaction clarity takes priority over cosmetic effects.
- No stale threat state is shown as LIVE; every state carries freshness or an unavailable label.

