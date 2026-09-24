# @tour-kit/vue

## 1.0.1

### Patch Changes

- 9d0be69: Fix step lifecycle hooks on autoStart, and stop the core dep drift that hid the original fix (#154)

  **core:** an `autoStart` boot is a cold start, so it now carries the same step
  contract as `start()` — the landing step's `onBeforeShow` is asked (a `false`
  veto leaves the tour dormant, nothing dispatched) and then `onEnter`. Before,
  an autoStart tour fired `onEnter` while silently skipping `onBeforeShow`, so
  the hook "worked in core" yet never fired for the most common declarative
  path. `flow`/`route` restores are unchanged: they resume mid-tour, where a
  veto would strand the user.

  **react / hints / vue / svelte:** the `@tour-kit/core` dependency now publishes
  as a caret range (`^3.0.0`) instead of an exact pin. `@tour-kit/react@2.0.0`
  exact-pinned a nested `core@1.0.7`, so consumers who updated `@tour-kit/core`
  to get a fix were still running the stale nested copy inside the provider —
  exactly the "fixed in core, still not invoked by TourProvider" report. With a
  range, `npm update @tour-kit/core` reaches the provider.

- Updated dependencies [9d0be69]
  - @tour-kit/core@3.0.1
  - @tour-kit/license@1.4.1

## 1.0.0

### Major Changes

- 3c13df3: feat(vue,svelte): the licence gate, and the first public release under BUSL-1.1

  `@tour-kit/vue` and `@tour-kit/svelte` have been `private: true` since §1.5,
  waiting on the licence. This lands it and publishes them — at 1.0.0, because a
  first release at 0.1.0 says "not ready" about code that has been under test for
  three phases.

  Both now start the licence gate from their provider's mount hook. Production use
  needs a key; development, evaluation, testing and CI do not, exactly as the
  BUSL-1.1 Additional Use Grant says. Without a key the binding still works in
  full and layers the same corner badge every other package layers:

  ```ts
  provideTourKit({ tours, license: { licenseKey: KEY } });
  ```

  The gate is a **dependency**, not an optional peer. An opt-in gate is no gate:
  a consumer who skips the install would simply not be gated.

  For that to work without React, `@tour-kit/license` grew a framework-free half.
  `startLicenseGate()`, `mountWatermark()` and `warnUnlicensed()` are now exported
  from `@tour-kit/license/headless`, and `react`/`react-dom` became **optional**
  peers — installing `@tour-kit/vue` no longer warns about a React peer it will
  never load.

  The badge itself moved out of `<LicenseWatermark>` into `lib/watermark-dom.ts`,
  and the two React components are bindings over it now. There is one badge
  implementation in the repo rather than one per framework, which is the same call
  `createSpotlight` settled for the spotlight — the markup, the UTM parameters,
  the accessible label and the click telemetry only exist once. Its one-per-page
  rule is a count now instead of an owner election; the election only existed
  because a React portal needs some component to own it.

  Two fixes in `@tour-kit/license` reach React consumers as well:

  - React-bearing prop types moved to `types/react.ts`. tsup rolls every type
    module both entries reach into one shared declaration chunk that
    `headless.d.ts` imports, so `LicenseGateProps`' `React.ReactNode` was
    travelling into the React-free door with nothing to resolve it — a Vue or
    Svelte app on `skipLibCheck: false` with no `@types/react` got `TS2503:
Cannot find namespace 'React'` from inside `node_modules`. The names are
    unchanged and still exported from the root barrel.
  - `<LicenseGate>` and `startLicenseGate()` now share one `gateSignalsFor()`
    rather than each deriving the same four rules, so a new bypass `renderKey`
    cannot land on one binding and leave the other badging paying customers.

  `@tour-kit/license` also ships its `LICENSE.md` now — it declares `SEE LICENSE
IN LICENSE.md` and the file was not in `files`, which was survivable while it
  was an internal React-only dependency and is not now that two public packages
  redistribute it.

  Everything else is unchanged for React consumers: 241 tests in the licence
  package and every Pro package's licence-integration suite pass untouched.

### Patch Changes

- Updated dependencies [f62631b]
- Updated dependencies [e70e310]
- Updated dependencies [9d1cba1]
- Updated dependencies [978338b]
- Updated dependencies [1a6e295]
- Updated dependencies [3c13df3]
  - @tour-kit/core@3.0.0
  - @tour-kit/license@1.4.0

## 0.1.0

### Minor Changes

- 1474852: Initial Vue 3 binding over `@tour-kit/core/engine`.

  `provideTourKit` / `useTour` / `<TourProvider>` give a Vue app the whole engine —
  state, navigation, branching, persistence, routing, audience and frequency,
  cross-tab sync, focus, keyboard and advance-on — with no React installed. The
  package imports only `@tour-kit/core/engine`; `useSpotlight`, `useFocusTrap` and
  `createVueRouterAdapter` are the framework glue. It ships no card: the consumer
  renders their own.

  Private until the v2 licence lands (§3.2).

### Patch Changes

- Updated dependencies [c9293ff]
- Updated dependencies [b032980]
- Updated dependencies [2c065cf]
- Updated dependencies [d9cac78]
- Updated dependencies [dcce333]
- Updated dependencies [d985ec5]
- Updated dependencies [c6953d8]
- Updated dependencies [a68699f]
  - @tour-kit/core@2.1.0
