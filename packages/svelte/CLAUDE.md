# @tour-kit/svelte

The Svelte 5 binding over `@tour-kit/core/engine`. Headless: no component, no
overlay, no `@floating-ui/*`. The consumer renders their own card — see
`examples/svelte-app`.

## The rules the shape depends on

1. **Nothing constructs an engine in a component `<script>`.** `createEngineHandle`
   builds on the first *verb*, and every kit member except `state` is `ensure()`
   in disguise — `setOptions` and `setTours` included. `createSubscriber`'s
   `start` is lazy, so `get state()` is safe there and on the server.
2. **`setContext` must run during initialisation**, and a `<script>` IS
   initialisation, so `provideTourKit` satisfies that by construction.
3. **`onMount`, not `onDestroy`, owns the teardown.** `onMount` does not run on
   the server and the function it returns runs on unmount; `onDestroy` is the
   one lifecycle hook that ALSO runs inside a server-rendered component.
4. **`release()`, never `destroy()`.** It flushes synchronously and defers the
   destroy by a microtask, so a teardown immediately followed by a re-`ensure()`
   takes the same engine back.
5. **Never import `@tour-kit/core` bare.** The bare specifier pulls React into
   the `.d.ts` chain. `src/__tests__/no-react-in-dist.test.ts` enforces it on
   both the built files and the source, with a positive control.
6. **Options are read ONCE**, because a `<script>` runs once. `setOptions` and
   `setTours` are the escape hatch; there is no Vue-style watcher here, and
   inventing reactivity the framework does not have would be the wrong shape.

## Gotchas

- **`resolve.conditions: ['browser']` in `vitest.config.ts` is MANDATORY.**
  Without it Svelte 5 resolves its server build under vitest and every
  lifecycle call throws `lifecycle_function_unavailable` — the whole provider
  suite fails at once and reads like a broken binding rather than a config line.
- **`svelte-kit sync` before `svelte-check`.** `$app/state`, `$app/navigation`
  and `.svelte-kit/tsconfig.json` do not exist until sync has generated them,
  and turbo's `typecheck` only `dependsOn: ["^build"]`. The example's
  `typecheck` script runs both.
- **The package never imports `$app/*`.** Those modules do not resolve outside a
  SvelteKit app, which is why `createSvelteKitRouterAdapter` takes `goto`,
  `getPathname` and `onNavigate` as arguments — and why the tests can pass three
  `vi.fn()`s. It calls `onNavigate` synchronously inside the factory because
  `afterNavigate` must be called during component initialisation.
- **A child's `onMount` fires BEFORE the parent's.** The handle's lazy
  `ensure()` is what makes `onMount(() => tour.start())` in a page work.
- **The `focusTrap` action's `destroy` deactivates before releasing.** For an
  action, node destruction IS the card unmounting, and in React that is exactly
  where `deactivate()` runs. `release()` alone strands focus on `<body>`.
- **`Escape` maps to `skip()`, not `stop()`**, and a skip persists.
- **Tests read core from `dist`.** That is the claim under test: the *published*
  `/engine` subpath is sufficient. Run through turbo so core builds first; do not
  add a source alias. The same applies to the example app — after changing this
  package's source, rebuild it before running e2e, or the browser gets the old
  bundle.
- **`private: true` until the v2 licence lands (§3.2).**

## Commands

```bash
turbo run test --filter=@tour-kit/svelte
pnpm --filter @tour-kit/svelte build
pnpm --filter @tour-kit/svelte typecheck
```
