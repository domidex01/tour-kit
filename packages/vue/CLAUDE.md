# @tour-kit/vue

The Vue 3 binding over `@tour-kit/core/engine`. Headless: no card, no overlay,
no `@floating-ui/*`. The consumer renders their own card — see
`examples/vue-app`.

## The rules the shape depends on

1. **Nothing constructs an engine in `setup()`.** `createEngineHandle` builds on
   the first *verb*, and every kit member except `state` is `ensure()` in
   disguise — `setOptions` and `setTours` included. Only `getState()` and
   `subscribe()` are safe during setup.
2. **Therefore `watch`, never `watchEffect`.** `watchEffect` (and
   `watch(..., { immediate: true })`) runs its callback synchronously inside
   `setup()`, which under Nuxt means registry writes, four storage adapters and
   a `BroadcastChannel` **on the server**. The two watchers in
   `provide-tour-kit.ts` are non-immediate on purpose; the mount hook does the
   first push. `use-focus-trap.ts` is the one legitimate `immediate: true` —
   `capture()` reads `document.activeElement` and constructs nothing.
3. **`release()`, never `destroy()`.** `onScopeDispose` calls `release()`, which
   flushes synchronously and defers the destroy by a microtask, so a teardown
   immediately followed by a re-`ensure()` takes the same engine back.
4. **Every attach returns a detach, and every detach runs on unmount.** They are
   collected in one array in `provideTourKit`.
5. **Never import `@tour-kit/core` bare.** The bare specifier pulls React into
   the `.d.ts` chain. `src/__tests__/no-react-in-dist.test.ts` enforces it on
   both the built files and the source.
6. **`shallowRef`, never `ref`, for the snapshot and for any `DOMRect`.** A deep
   `ref` proxies the `stepVisitCount` Map and the `tour` object, and every
   downstream `Object.is` breaks against the proxy.
7. **State machines live in core; this package holds bridges.** `useSpotlight`
   is a `shallowRef` over `createSpotlight()`, and `useTour` a `shallowRef` over
   the engine handle — the same bridge twice. If a composable here grows fields
   and transitions of its own, that logic belongs in `@tour-kit/core/engine`
   where the Svelte binding and the React hook can share it. §1.5 shipped the
   spotlight machine three times before §1.5f pushed it down.

## Gotchas

- **A child's `onMounted` fires BEFORE the provider's.** `onMounted(() => tour.start())`
  in a page component therefore lands before the provider's own boot. The
  handle's lazy `ensure()` is what makes that work — do not "fix" it by
  constructing earlier.
- **The barrel does `export * from '@tour-kit/core/engine'`, deliberately.**
  `/engine` is already the curated React-free surface; a hand-picked subset
  would need its own alignment test and would still be wrong the day `/engine`
  grows.
- **`Escape` maps to `skip()`, not `stop()`**, and a skip persists.
- **The card owns `deactivate()`, not the binding.** `useFocusTrap`'s `enabled`
  gate only decides whether `activate()` does anything — same as the React hook.
  Restoring focus when the tour ends is the card's effect cleanup.
- **`it.skipIf(!distExists())` gates on the `dist/` DIRECTORY, not the files.**
  Gating on the files turns a wrong path into a silent skip — the suite reports
  green with the guards disarmed. `no-react-in-dist.test.ts` asserts the three
  entry files exist as its first case for exactly that reason.
- **Tests read core from `dist`.** That is the claim under test: the *published*
  `/engine` subpath is sufficient. Run through turbo (`turbo run test
  --filter=@tour-kit/vue`) so core builds first; do not add a source alias, which
  would also drag core's `src/**` into this package's coverage denominator.
- **`private: true` until the v2 licence lands (§3.2).**

## Commands

```bash
turbo run test --filter=@tour-kit/vue
pnpm --filter @tour-kit/vue build
pnpm --filter @tour-kit/vue typecheck
```
