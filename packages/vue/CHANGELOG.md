# @tour-kit/vue

## 0.1.0

### Minor Changes

- 1474852: Initial Vue 3 binding over `@tour-kit/core/engine`.

  `provideTourKit` / `useTour` / `<TourProvider>` give a Vue app the whole engine —
  state, navigation, branching, persistence, routing, audience and frequency,
  cross-tab sync, focus, keyboard and advance-on — with no React installed. The
  package imports only `@tour-kit/core/engine`; `useSpotlight`, `useFocusTrap` and
  `createVueRouterAdapter` are the framework glue. It ships no card: the consumer
  renders their own.

  Private until the v2 licence lands (§3.2).

### Patch Changes

- Updated dependencies [c9293ff]
- Updated dependencies [b032980]
- Updated dependencies [2c065cf]
- Updated dependencies [d9cac78]
- Updated dependencies [dcce333]
- Updated dependencies [d985ec5]
- Updated dependencies [c6953d8]
- Updated dependencies [a68699f]
  - @tour-kit/core@2.1.0
