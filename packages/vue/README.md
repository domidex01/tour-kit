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

Not published yet: this package ships under the Tour Kit v2 licence terms,
which are not final. See `LICENSE.md`.
