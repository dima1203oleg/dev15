# SIREN UA — Design Suggestions & UX Observations

*Note: In accordance with `DESIGN_LOCKED = TRUE` and the Master Specification, these suggestions are recorded for future roadmap consideration only. The current production design remains strictly intact.*

---

## 1. 3D WebGL / Canvas Hardware Acceleration
- **Current Behavior**: Canvas instances render using standard WebGL context with fixed DPR.
- **Suggested Enhancement**: Dynamically scale DPR between `1.0` (on mobile / battery saver mode) and `window.devicePixelRatio` (on high-power desktop GPUs) to save mobile battery while preserving visual fidelity.
- **Estimated Impact**: ~25% reduction in mobile GPU heat during prolonged background monitoring.

---

## 2. Threat Vector Altitude Shading
- **Current Behavior**: Trajectory curves use uniform neon cyan / red gradients.
- **Suggested Enhancement**: Add subtle volumetric altitude markers (e.g. 500m vs 12,000m) to help distinguish between low-altitude Shahed-136 cruise trajectories and high-altitude ballistic arcs.
- **Estimated Impact**: Higher military-grade clarity for defense analysts and civilian users.

---

## 3. High-Contrast Monochrome Accessibility Mode
- **Current Behavior**: 2-tone palette (Clean Light Mode and Deep Slate Dark Mode).
- **Suggested Enhancement**: Introduce an optional WCAG AAA High-Contrast monochrome filter for users with visual impairments.
