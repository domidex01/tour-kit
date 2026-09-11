# @tour-kit/svelte

Headless product tours for Svelte 5, over the framework-agnostic Tour Kit
engine. No React installed, anywhere.

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/state'
  import { createSvelteKitRouterAdapter, provideTourKit } from '@tour-kit/svelte'

  const kit = provideTourKit({
    tours,
    router: createSvelteKitRouterAdapter({
      goto,
      getPathname: () => page.url.pathname,
      onNavigate: afterNavigate,
    }),
    routePersistence: { enabled: true, flowSession: { storage: 'sessionStorage' } },
  })
</script>
```

Anywhere below it:

```svelte
<script lang="ts">
  import { getTour } from '@tour-kit/svelte'

  const tour = getTour()
  const step = $derived(tour.state.currentStep)
</script>
```

`tour.state` is reactive inside `$derived`, `$effect` and templates, and a plain
read elsewhere. You render the card. `createSpotlight()` and the `focusTrap`
action are here for the behaviours; positioning is yours (`@floating-ui/dom` is
a good choice — see `examples/svelte-app`).

## License

Business Source License 1.1 (`BUSL-1.1`) — **free in development, a key in production.**

Use Tour Kit freely for development, evaluation, testing, CI and any other non-production
purpose. Serving it to end users of a deployed application needs a Tour Kit Pro licence key,
from **$9.99 one-time** — [usertourkit.com/pricing](https://usertourkit.com/pricing). Each published version converts to the MIT licence on its
Change Date (2030-09-11). Full terms in [LICENSE.md](./LICENSE.md).

Copyright © 2026 domidex01.

Non-React entry points are covered by the same licence and render no badge.
