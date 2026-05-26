---
"@tour-kit/hints": patch
---

Hint hotspot buttons now declare `aria-haspopup="dialog"` (all variants) so
screen-reader users know activating the hotspot opens a popup, and `<Hint>`
wires `aria-controls` from the hotspot to its popover (plus the matching `id` on
the popover) so the trigger↔popup relationship is exposed. `aria-expanded`
continues to reflect open state.
