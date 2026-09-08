---
"@tour-kit/svelte": minor
---

Initial Svelte 5 binding over `@tour-kit/core/engine`.

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
