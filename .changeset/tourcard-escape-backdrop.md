---
"@tour-kit/react": patch
---

`TourCard` now dismisses on Escape by default (`closeOnEscape`, standard dialog
convention) — wiring only Escape so arrow/Enter navigation is still opt-in via
`useKeyboardNavigation`. `TourOverlay` also keeps a stable backdrop dim: the dim
is produced by the spotlight cutout's box-shadow, so for target-less (centered)
steps — or a transient frame before the target rect resolves — the overlay now
falls back to dimming itself instead of going fully transparent.
