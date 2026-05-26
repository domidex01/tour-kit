---
"@tour-kit/core": patch
"@tour-kit/media": patch
---

Fix SSR hydration mismatch in reduced-motion detection.

`@tour-kit/core`'s `useMediaQuery` (and the `usePrefersReducedMotion` /
`useReducedMotion` hooks built on it) now use `useSyncExternalStore` with a
server snapshot of `false`, so the first client render always matches the
server markup before flipping to the real `matchMedia` value after hydration.

`@tour-kit/media`'s `usePrefersReducedMotion` no longer reads `matchMedia` in a
`useState` initializer (which returned `false` on the server but `true` on the
client for reduced-motion users, causing a hydration mismatch in `TourMedia`
and `MediaHeadless`). It now delegates to core's SSR-safe `useReducedMotion`,
matching `MediaSlot`.
