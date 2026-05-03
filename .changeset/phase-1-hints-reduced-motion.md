---
"@tour-kit/hints": patch
---

`<HintHotspot>` now reads `useReducedMotion()` from `@tour-kit/core` and skips the `animate-tour-pulse` cva variant under reduce mode (defense-in-depth on top of the existing `@media (prefers-reduced-motion: reduce)` keyframe wrapper). Re-exports `useReducedMotion` from the package for ergonomic in-package access.
