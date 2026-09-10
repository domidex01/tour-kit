# @tour-kit/svelte

## 0.1.1

### Patch Changes

- Updated dependencies [e70e310]
- Updated dependencies [9d1cba1]
- Updated dependencies [978338b]
  - @tour-kit/core@3.0.0

## 0.1.0

### Minor Changes

- a9efc89: Initial Svelte 5 binding over `@tour-kit/core/engine`.

  `provideTourKit` / `getTour` give a SvelteKit app the whole engine — state,
  navigation, branching, persistence, routing, audience and frequency, cross-tab
  sync, focus, keyboard and advance-on — with no React installed. The package
  imports only `@tour-kit/core/engine`; `createSpotlight`, the `focusTrap` action
  and `createSvelteKitRouterAdapter` are the framework glue. It ships no
  component: the consumer renders their own card.

  `tour.state` is a `createSubscriber` getter (`svelte/reactivity`), so it is
  reactive inside `$derived` / `$effect` / a template and a plain read elsewhere.
  Requires `svelte >= 5.7`.

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
