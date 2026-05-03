---
"@tour-kit/core": minor
---

Add SSR-safe `useReducedMotion()` hook (Comeau pattern). Defaults to `true` server-side and on the first client render, then flips to the actual `matchMedia('(prefers-reduced-motion: reduce)')` value after the first effect. Designed for animation classes that must default to "no animation" during SSR/first paint to avoid a one-frame motion flash for users who have requested reduced motion. The existing `usePrefersReducedMotion()` hook (defaults to `false`) is preserved for backward compatibility.
