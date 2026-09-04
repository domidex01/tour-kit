---
'@tour-kit/core': minor
---

Add `createTourEngine()` — run a tour with no React.

```js
import { createTourEngine } from '@tour-kit/core/engine'

const engine = createTourEngine({ tours })
await engine.boot()
engine.subscribe(() => render(engine.getState()))
await engine.start('onboarding')
```

The previous release added `@tour-kit/core/engine` as a types-and-predicates
door and said, in so many words, that it was "not yet framework-agnostic tour
support, and should not be announced as such". **This is the release that flips
that sentence.** The subpath now carries a working engine — state, navigation,
branching, `when` conditions, hidden steps, persistence, route restore and
cross-tab sync — with no React, no DOM and no bundler required. It runs in
Node, in a Vue or Svelte component, or behind a `<script>` tag.

**Nothing moved and nothing changed for existing users.** `<TourProvider>`
behaves exactly as before; this release is additive. Internally the engine moved
out from under React behind a port that already existed, and the provider became
a second adapter for it — 1 431 lines down to 755, with the twenty `useEffect`s
and seventeen `useRef`s reduced accordingly. The whole React test suite passes
unmodified, which is the evidence for "no behaviour change": the provider's own
tests were the oracle and were never edited.

### The API

`createTourEngine(options)` returns an object with `start`, `next`, `prev`,
`goTo`, `goToStep`, `startTour`, `triggerBranchAction`, `skip`, `complete`,
`stop`, `reset`, `setData`, `setTours`, `boot`, `subscribe`, `getState` and
`destroy`. Options: `tours`, `router`, `routePersistence`, `persistence`,
`autoNavigate`, `storage`, `analytics`, `onTourPaused`, `onNavigationRequired`,
`onStepError`.

Three contracts worth knowing if you are writing a binding:

- **`getState()` is reference-stable between transitions.** It returns the
  existing `TourCallbackContext`, cached, so it satisfies React's
  `useSyncExternalStore` directly. A dispatch the reducer returns unchanged
  produces no new snapshot and does not notify.
- **The constructor is inert.** No storage, no `window`, no `BroadcastChannel`
  until you call `boot()`, so the factory is safe to run during SSR.
  `validateTour()` still throws synchronously from it.
- **`destroy()` is terminal, not a pause.** It aborts in-flight work, closes the
  channel, flushes the throttled save, unregisters, and leaves every method a
  no-op. Under React 18 StrictMode, create and destroy the engine inside the
  same effect.

`resolveBootStart()` is exported too: the pure restore-precedence rule
(flow session > route state > autostart) as a function you can test as a truth
table instead of inferring from effect ordering.

### Bundle sizes

`@tour-kit/core/engine`'s worst-case import closure goes from 8.1 KB to 15.3 KB
gzipped — that difference is the engine itself. A type-only consumer still ships
zero: the barrel is re-exports-only with `sideEffects: false`, so a bundler
takes only what you import.

The main `@tour-kit/core` entry grows 446 bytes (20.8 KB → 21.3 KB gzipped).
That is the cost of the code moving out of one big file into modules, not the
new engine riding along — a test asserts `createTourEngine` stays out of the
main entry's import closure, so a React consumer does not pay for the
plain-JavaScript adapter.

Still internal, and deliberately: the `TourEngineContext` port, the storage and
broadcast factories, and the implementations behind them. They are the seam two
adapters share, not a consumer API, and the upcoming React-binding work will
decide which parts a binding actually needs.
