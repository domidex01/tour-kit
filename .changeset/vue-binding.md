---
"@tour-kit/vue": minor
---

Initial Vue 3 binding over `@tour-kit/core/engine`.

`provideTourKit` / `useTour` / `<TourProvider>` give a Vue app the whole engine —
state, navigation, branching, persistence, routing, audience and frequency,
cross-tab sync, focus, keyboard and advance-on — with no React installed. The
package imports only `@tour-kit/core/engine`; `useSpotlight`, `useFocusTrap` and
`createVueRouterAdapter` are the framework glue. It ships no card: the consumer
renders their own.

Private until the v2 licence lands (§3.2).
