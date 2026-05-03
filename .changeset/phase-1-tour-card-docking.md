---
"@tour-kit/react": patch
---

Add a 150ms docking transition to `<TourCard>` so placement flips (e.g. `bottom` → `top` when the target scrolls near the viewport edge) tween smoothly instead of snapping. The transition class `transition-[transform,top,left] duration-150 ease-out` is applied to the floating element (the same element Floating UI positions via inline `transform`). The class is gated by `useReducedMotion()` from `@tour-kit/core` — users who prefer reduced motion get instant placement updates with no animation.
