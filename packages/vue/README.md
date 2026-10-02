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

[MIT](./LICENSE). Free for any use, including production, with no licence key and
no badge.

1.0.x was published under BUSL-1.1 and layered an "Unlicensed" badge in production
without a key. 1.1 and later are MIT: `npm update` removes it. The `license` prop is
still accepted so 1.0.x code compiles, but it is ignored; you can delete it.

