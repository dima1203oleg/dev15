# Tablet Accessibility

The spatial deck is not the only source of meaning. Status, confidence, direction, ETA, freshness and shelter information are also rendered as semantic DOM text and buttons.

## Requirements implemented

- Keyboard-accessible buttons, sliders and navigation.
- `aria-label`, `aria-pressed`, `aria-current` and dialog semantics for spatial controls.
- Risk is expressed with text and icon as well as color.
- Touch targets use a minimum 44px interaction height.
- Reduced-motion media preference is respected by the global motion policy.
- `NOT CONNECTED`, `DEMO DATA` and freshness are visible states rather than silent failures.

The remaining live map accessibility work depends on receiving authoritative region geometry and event schemas; each mesh will need a corresponding region/event list entry.

