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

## Licence

[MIT](./LICENSE). Free for any use, including production, with no licence key and
no badge.

1.0.x was published under BUSL-1.1 and layered an "Unlicensed" badge in production
without a key. 1.1 and later are MIT: `npm update` removes it. The `license` option is
still accepted so 1.0.x code compiles, but it is ignored; you can delete it.

