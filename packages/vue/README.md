# @tour-kit/vue

Headless product tours for Vue 3, over the framework-agnostic Tour Kit engine.
No React installed, anywhere.

```ts
// App.vue
import { createVueRouterAdapter, provideTourKit } from '@tour-kit/vue'
import { useRouter } from 'vue-router'

const kit = provideTourKit({
  tours,
  router: createVueRouterAdapter(useRouter()),
  routePersistence: { enabled: true, flowSession: { storage: 'sessionStorage' } },
})

kit.start('onboarding')
```

Anywhere below it:

```ts
import { useTour } from '@tour-kit/vue'

const tour = useTour()
tour.state.value.currentStep   // reactive; new identity per transition
tour.next()                    // the thirteen verbs, stable identity
```

You render the card. `useSpotlight()` and `useFocusTrap()` are here for the
behaviours; positioning is yours (`@floating-ui/dom` is a good choice — see
`examples/vue-app`).

## Licence

`@tour-kit/vue` is published under the [Business Source License 1.1](./LICENSE.md).
Development, evaluation, testing, CI and any non-production environment are free
and need no key. **Production use needs a licence key** — a one-time purchase
from $9.99 at [usertourkit.com/pricing](https://usertourkit.com/pricing). Every
version converts to MIT on its Change Date, four years after release.

Without a key the binding still works in full; it layers a small badge in the
corner on non-development hosts. Pass the key to remove it:

```vue
<TourProvider
  :tours="tours"
  :license="{ licenseKey: import.meta.env.VITE_TOUR_KIT_LICENSE_KEY }"
>
```

The key is read once, on mount. On a development host it is never sent
anywhere, so local work never consumes one of its activation slots.
