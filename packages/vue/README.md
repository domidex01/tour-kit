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

## License

Business Source License 1.1 (`BUSL-1.1`) — **free in development, a key in production.**

Use Tour Kit freely for development, evaluation, testing, CI and any other non-production
purpose. Serving it to end users of a deployed application needs a Tour Kit Pro licence key,
from **$9.99 one-time** — [usertourkit.com/pricing](https://usertourkit.com/pricing). Each published version converts to the MIT licence on its
Change Date (2030-09-11). Full terms in [LICENSE.md](./LICENSE.md).

Copyright © 2026 domidex01.

Non-React entry points are covered by the same licence and render no badge.
