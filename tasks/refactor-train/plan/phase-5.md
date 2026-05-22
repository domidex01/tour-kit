# Phase 5: TourProvider Navigation Extraction

**Risk:** High.
**Estimated effort:** 14-18 hours.
**Primary package:** `core`.
**Goal:** Extract the two navigation orchestrators from `TourProvider` while preserving behavior.

---

## Current State

Verified against the source tree on 2026-05-21:

- `packages/core/src/context/tour-provider.tsx` has 1802 lines.
- It has 5 provider-local `noExcessiveCognitiveComplexity` ignores:
  - reducer at line 253
  - flow restore effect around line 671
  - `navigateToStep` around line 888
  - `handleBranchTarget` around line 1059
  - `prev` around line 1365
- This phase extracts only:
  - `navigateToStep`
  - `handleBranchTarget`
- The realistic target is **5 provider ignores down to 3**, not 6 down to 2.

Reducer, flow restore, and `prev` stay in provider for this phase.

---

## Extraction Boundary

Create an internal folder:

```text
packages/core/src/lib/tour-engine/
├── context.ts
├── navigate-to-step.ts
├── handle-branch-target.ts
└── __tests__/
    ├── navigate-to-step.test.ts
    └── handle-branch-target.test.ts
```

Do not export these from `@tour-kit/core`'s public barrel. They are implementation details.

---

## Required Type Movement

`TourAction` and `TourReducerState` currently live inside `tour-provider.tsx`. Extracted modules should not import provider implementation code.

Move these types to an internal type file, for example:

```text
packages/core/src/types/tour-reducer.ts
```

Export only types from there:

```ts
export type TourAction = ...
export interface TourReducerState extends TourState { ... }
```

Then import those types back into the provider and engine files. Keep reducer functions in provider unless extraction forces otherwise.

---

## TourEngineContext Shape

Use refs/getters for values that must stay fresh across async navigation:

```ts
export interface TourEngineContext {
  getState: () => TourReducerState
  getCurrentTour: () => Tour | null
  getData: () => Record<string, unknown>
  getStepIdMap: () => Map<string, number>

  dispatch: React.Dispatch<TourAction>
  router?: RouterAdapter
  autoNavigate: boolean
  abortControllerRef: React.RefObject<AbortController | null>

  onNavigationRequired?: (route: string, stepId: string) => void
  onStepError?: (err: TourRouteError) => void

  completeTour: () => void
  skipTour: () => void
  setData: (key: string, value: unknown) => void

  tourKitContext: TourKitContextValue | null
  maxHiddenChain: number
}
```

Adjust after cataloging actual closure reads. Do not pass a snapshot where the original code read through a ref or current React state. Use getters for derived values and refs for mutable ref identities.

Provider wiring should build a stable `engineContextRef`:

```ts
const engineContextRef = React.useRef<TourEngineContext>(/* initial complete object */)

React.useEffect(() => {
  engineContextRef.current = buildEngineContext(...)
})
```

Thin wrappers then call:

```ts
const navigateToStep = React.useCallback(
  (stepIndex: number) => navigateToStepImpl(engineContextRef.current, stepIndex),
  []
)
```

Only use an empty dependency array if every read goes through `engineContextRef.current`. Otherwise list the real dependencies.

---

## Implementation Order

### 1. Catalog Closure Reads

Before moving code, make a checklist of every identifier read by:

- `navigateToStep`
- `handleBranchTarget`

Classify each as:

- state getter
- derived getter
- ref
- dispatch
- router/config
- callback
- pure helper import

This catalog is the review map. Include it in the PR description.

### 2. Move Reducer Types

Move `TourAction` and `TourReducerState` type declarations out of the provider. Keep runtime reducer helpers in place.

Run:

```bash
pnpm --filter @tour-kit/core typecheck
```

### 3. Extract `handleBranchTarget` First

`handleBranchTarget` has the broadest branch matrix, but it can initially call `ctx.navigateToStep` if needed. During the first extraction, include a `navigateToStep` callback in context:

```ts
navigateToStep: (stepIndex: number) => Promise<boolean>
```

After `navigateToStep` is extracted, replace that field with a direct import or keep the callback if it makes recursion easier. Prefer the least noisy diff.

Cover these branches:

- `null` target clears transitioning
- `complete` and `skip`
- `restart`
- cross-tour branch with missing target tour
- cross-tour branch with named step
- `BranchWait` with `then`
- target resolves to current index
- loop detection
- target step `when` returns false and next visible step exists
- target step `when` returns false and no visible step exists
- successful target navigation tracks step view and calls `onStepChange`

### 4. Extract `navigateToStep`

Move route and hidden-step traversal after `handleBranchTarget` is stable.

Cover these branches:

- no current tour
- visible step without route
- visible step with `autoNavigate: false`
- `routeChangeStrategy: 'manual'`
- `routeChangeStrategy: 'prompt'`
- auto route success
- router returns `false`
- `waitForStepTarget` throws `TourRouteError`
- abort signal is set
- hidden step without branch advances to next index
- hidden step branch terminates
- hidden chain exceeds `maxHiddenChain`

### 5. Remove Provider Complexity Ignores

Remove only the ignores attached to the extracted provider callbacks.

Expected after this phase:

```bash
rg -n "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx
```

shows reducer, flow restore, and `prev` only.

If the new extracted files need complexity ignores, the extraction did not go far enough. Split helper branches inside the engine files before merging.

---

## Tests

Add direct engine tests under `packages/core/src/lib/tour-engine/__tests__`.

Keep existing provider tests unchanged unless a test is asserting implementation details rather than behavior. The key existing suites are:

- `packages/core/src/__tests__/context/tour-provider-hidden.test.tsx`
- `packages/core/src/__tests__/context/branching.test.tsx`
- `packages/core/src/__tests__/context/tour-provider-flow-session.test.tsx`
- `packages/core/src/__tests__/context/tour-provider.test.tsx`
- `packages/core/src/context/__tests__/test-bridge.test.tsx`

The extracted tests should use a fake `TourEngineContext` and assert dispatch/callback calls. Existing provider tests then verify React wiring.

---

## Cut Point

Phase 5's 14-18h budget in [`big-plan.md`](./big-plan.md) covers both the single-PR shape and the 5a/5b split — the split changes review surface, not total effort.

**Default:** ship as a single PR if `handleBranchTarget` + tests land under ~8 hours and `navigateToStep` looks tractable from there.

**Split when:** `handleBranchTarget` extraction plus its tests is passing and total elapsed time is already over 8 hours, or when `navigateToStep`'s closure catalog (step 1) exposes more refs/getters than the engine context comfortably holds.

- **Phase 5a:** reducer type move, `TourEngineContext`, `handleBranchTarget` extraction, tests.
- **Phase 5b:** `navigateToStep` extraction, tests, final provider cleanup.

If the split is taken, each PR must be independently revertible (see Rollback). Do not carry a half-extracted provider across multiple work sessions.

---

## Manual Smoke Check

After automated tests pass, run the dashboard example and exercise:

```bash
pnpm --filter dashboard-next dev
```

If that filter is wrong, inspect `examples/dashboard-next/package.json` and use its actual package name.

Smoke flows:

- hidden step in the middle of a tour
- route step with `routeChangeStrategy: 'auto'`
- route step with `routeChangeStrategy: 'manual'`
- branch to another tour
- branch wait with `then`
- loop-detection path

---

## Validation Gates

```bash
wc -l packages/core/src/context/tour-provider.tsx
rg -n "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/core typecheck
pnpm --filter @tour-kit/react test
pnpm typecheck
pnpm build
pnpm lint
```

Expected:

- provider LOC is materially lower
- provider complexity ignores are <= 3
- engine files have no new complexity ignores
- existing provider tests pass
- new engine tests pass

---

## Rollback

Rollback is `git revert <merge-commit-sha>`.

If this ships as 5a/5b, each PR must be independently revertible. Do not leave provider wrappers depending on dead internal engine files.
