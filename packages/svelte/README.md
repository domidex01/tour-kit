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

`@tour-kit/svelte` is published under the [Business Source License 1.1](./LICENSE.md).
Development, evaluation, testing, CI and any non-production environment are free
and need no key. **Production use needs a licence key** — a one-time purchase
from $9.99 at [usertourkit.com/pricing](https://usertourkit.com/pricing). Every
version converts to MIT on its Change Date, four years after release.

Without a key the binding still works in full; it layers a small badge in the
corner on non-development hosts. Pass the key to remove it:

```svelte
<script lang="ts">
  import { provideTourKit } from '@tour-kit/svelte'
  import { PUBLIC_TOUR_KIT_LICENSE_KEY } from '$env/static/public'

  const tour = provideTourKit({
    tours,
    license: { licenseKey: PUBLIC_TOUR_KIT_LICENSE_KEY },
  })
</script>
```

The key is read once, at mount, like every other option this binding takes — so
pass it from static config (`$env/static/public`) rather than from something
fetched at runtime. On a development host it is never sent anywhere, so local
work never consumes one of its activation slots.
