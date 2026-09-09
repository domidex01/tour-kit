---
"@tour-kit/hints": minor
---

`@tour-kit/hints/engine` — the React-free subpath.

The hints state machine, its frequency persistence, `createHintsHandle` and `getHotspotPosition`, with no `react`, `react/jsx-runtime`, `@tour-kit/media`, `@floating-ui/react` or `@radix-ui/react-slot` anywhere in the runtime or `.d.ts` closure. A Vue, Svelte or vanilla app can now run hints with none of them installed and render the dot and the tooltip itself:

```ts
import { createHintsEngine, getHotspotPosition } from '@tour-kit/hints/engine'
```

The engine is inert until `boot()` — the constructor reads no `window`, no storage and no clock — so it is safe to construct on the server. `react` and `react-dom` are optional peers now, so no package manager will auto-install them.

`HintsProvider`, `useHint`, `useHints`, `HintsContextValue` and every component are unchanged; `HintsProvider` is a binding over the engine internally.

**One behaviour change, and it is a fix:** `autoShow` hints now honour persisted frequency state on first mount. A persisted dismissal or an exhausted `times` count suppresses the auto-show, and the auto-show's view is no longer overwritten by hydration. Previously the hydrate effect ran *after* the child's auto-show effect, so a `once` hint the user had already dismissed could re-appear on the next page load. Note that a suppressed auto-show still emits `analytics.hintShown` — that is unchanged.

Two notes for non-React consumers: `"headless"` in this package means *unstyled React* (`@tour-kit/hints/headless`); `/engine` is the React-free one. And `@tour-kit/hints` still hard-depends on `@tour-kit/media`, which lists React as a required peer, so React lands in `node_modules` even though nothing `/engine` imports reaches it.
