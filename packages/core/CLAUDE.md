# @tour-kit/core

Framework-agnostic foundation layer. Contains all business logic - UI packages are thin wrappers.

## Key Architectural Decisions

### Barrel Exports
- Entry point (`src/index.ts`) re-exports from `types/`, `context/`, `hooks/`, `utils/`
- This allows tree-shaking while maintaining a clean public API

### Position Engine
- Core ships **RTL/placement helpers only** (`parsePlacement`, `mirrorPlacementForRTL`,
  `getElementRect`, `getViewportDimensions`, `getDocumentDirection`) in `utils/position.ts`.
- Core has **no** `@floating-ui` dependency. Actual collision/floating positioning lives in
  the UI packages (`react`, `announcements`, `hints`, `surveys`, `checklists`), which depend
  on `@floating-ui/react` directly.
- The old hand-rolled `calculatePosition()`/collision engine was removed in Slice 0 (dead,
  barrel-private).

### The CDN build (v2 §1.6)
- `tsup.config.ts` is `defineConfig([main, iife])`. The IIFE
  (`dist/engine/index.global.js`, `window.TourKit`, what `unpkg`/`jsdelivr`
  serve) is its OWN item and must stay that way: adding `'iife'` to the main
  item's `format` would also emit IIFEs of `index` and `schemas`, whose
  externals become a `__require("react")` shim that throws on load.
- `platform: 'browser'` on that item is load-bearing, not cosmetic. esbuild
  defines `process.env.NODE_ENV` itself only under that platform; without it the
  file keeps four `process.env` reads — two guarded, two not (`interpolate`'s
  `warnOnMissing` default parameter, `audience`'s segment warning) — and a
  browser throws `ReferenceError: process is not defined` on the first call.
  The file LOADS either way, so the guard is two cases in
  `engine-iife-dist.test.ts`: a `process.env` grep, and a run inside a `vm`
  realm with no `process`. vitest's jsdom HAS `process`, so a jsdom run is blind
  to this.
- The main item's `clean` is therefore `['!**/*.global.js*']`, not `true` —
  tsup builds array items in parallel and each cleans on its own.

### Storage Adapters
- `createStorageAdapter()` - Factory for custom storage backends
- `createPrefixedStorage()` - Namespaces keys to avoid collisions
- Default uses `localStorage` with JSON serialization via `safeJSONParse()`

### Focus Management
- `useFocusTrap()` - Traps focus within tour cards for accessibility
- `useKeyboardNavigation()` - Arrow keys, Escape, Enter handling
- All hooks respect `prefers-reduced-motion`

## Gotchas

- **TourProvider is a binding, not an engine** (v2 §1.4): it holds one
  `createTourEngine()` behind `createEngineHandle` and one
  `useSyncExternalStore`. The engine is constructed in the first effect or the
  first action, **never in render** — the factory registers every tour with
  `tourRegistry` at construction, so a render-time build logs
  `registered twice` under StrictMode and leaks a dead `WeakRef`. Do not
  memoise an engine in `useState`, and do not make the handle's `release()`
  eager: it flushes pending writes synchronously but defers the `destroy()` by
  one microtask, so React tearing an effect down and re-running it can take it
  back. Without that, the replacement engine re-boots and every restore side
  effect fires twice in dev.
- **`createEngineHandle` is a facade, `createHandle` is the primitive** (v3
  Phase 1): the lifecycle half — lazy `ensure()`, the listener set that
  outlives any one engine, the construction fan-out, the deferred `release()` —
  is `createHandle<E, S>(factory, initial)` and knows nothing about tours;
  `createEngineHandle` is it plus the seventeen tour verbs. Both are on
  `/engine`. A package with its own engine composes `createHandle` rather than
  re-implementing the lifecycle. `EngineLike`'s `flush` is optional, so a
  synchronous engine needs none. `createEngineHandle`'s signature must not
  drift: `src/__tests__/types/engine-handle.test-d.ts` pins it and only
  `pnpm typecheck:types` runs that file — no vitest run reports it.
- **Context null checks**: All context hooks throw if used outside provider - this is intentional
- **SSR**: Hooks handle SSR by checking `typeof window` before accessing DOM APIs
- **Refs over state**: Position-related values use refs to avoid re-render cascades

## Commands

```bash
pnpm --filter @tour-kit/core build
pnpm --filter @tour-kit/core typecheck
pnpm --filter @tour-kit/core test
```

## Related Rules
- `tour-kit/rules/hooks.md` - Hook design patterns
- `tour-kit/rules/accessibility.md` - A11y requirements
