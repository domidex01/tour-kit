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

Not published yet: this package ships under the Tour Kit v2 licence terms,
which are not final. See `LICENSE.md`.
