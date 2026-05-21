# Phase 5 — TourProvider split (the L-effort refactor)

**Duration:** Days 13–18 (~10.5 hours, potentially split across 2 PRs)
**Depends on:** none technically, but recommended to land after Phase 1–4 so reviewer fatigue is lowest going into the hardest review of the train.
**Blocks:** none
**Risk Level:** HIGH — `packages/core/src/context/tour-provider.tsx` is the single most load-bearing file in the SDK. The extraction is a **pure refactor** (no behaviour change) but the cognitive load on the reviewer is real, and a subtle regression in branch/route navigation cascades to every consumer.
**Stack:** typescript, react, react-context

---

## Objective

Resolve the [MED] candidate from [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) titled *"`TourProvider` is 1802 lines with 6 `noExcessiveCognitiveComplexity` ignores"*.

Today, `packages/core/src/context/tour-provider.tsx` carries six separate `biome-ignore lint/complexity/noExcessiveCognitiveComplexity` escape hatches, including two orchestrators that are each >100 lines:

| Function           | Lines       | Cognitive load drivers                                                                  |
| ------------------ | ----------- | --------------------------------------------------------------------------------------- |
| `tourReducer`      | 253–334     | 11-arm switch, gated by tests separately — leave it alone                                |
| flow-restore effect| 671–890     | Restore orchestrator with route + wait + cancellation guards — leave it for now         |
| **`navigateToStep`** | **887–998** | **Hidden-step traversal + route navigation in one orchestrator** — EXTRACT             |
| **`handleBranchTarget`** | **1054–1246** | **Branch navigation with `null` / special / cross-tour / wait / index / when-filtered paths** — EXTRACT |
| `prev` callback    | 1365–…      | Step-direction handling with loop detection — leave it for now                         |
| `AdvanceOnEffect`  | 1799–…      | DOM-event listener orchestrator — leave it for now                                     |

This phase **extracts `navigateToStep` and `handleBranchTarget`** into module-level pure functions that close over `dispatch`/`router`/callbacks via a single typed `TourEngineContext` argument. The provider keeps the React-bound wiring (`useCallback` closures, refs, the flow-restore effect) but the cognitive complexity of the two orchestrators moves out, and 4 of the 6 biome ignores can be dropped.

The other 4 biome-ignore sites are deliberately **out of scope** for this phase — they earn their own follow-up issues. The two extracted functions are the highest-leverage targets: they have the most logic, the most parameters, and they are the only two that are **mutually recursive** (which is the strongest signal that they form a self-contained subsystem).

---

## What Success Looks Like

1. **`packages/core/src/context/tour-provider.tsx` shrinks from 1802 to ≤ ~1500 LOC.** Verified by `wc -l`.
2. **Four of the six `biome-ignore lint/complexity/noExcessiveCognitiveComplexity` comments are gone** (the two for `navigateToStep` and `handleBranchTarget`, plus two implied — the reducer and `prev` callback stay, but the navigation-orchestrator ignores at lines 888 and 1059 disappear). Verified by `grep -c "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx` returning **≤ 2**.
3. **New file `packages/core/src/lib/navigate-to-step.ts`** exports `navigateToStep(ctx: TourEngineContext, stepIndex: number): Promise<boolean>` as a module-level pure function. Verified by file existence + import.
4. **New file `packages/core/src/lib/handle-branch-target.ts`** exports `handleBranchTarget(ctx: TourEngineContext, target: BranchTarget, branchContext: BranchContext, actionId?: string): Promise<void>`. Verified by file existence + import.
5. **New file `packages/core/src/lib/tour-engine-context.ts`** declares the `TourEngineContext` type that bundles every closure variable both functions read. Verified by `grep -n "export interface TourEngineContext" packages/core/src/lib/tour-engine-context.ts`.
6. **The provider's `useCallback` wrappers are now thin** — typically a 3–6 line `useCallback` that builds the `TourEngineContext` from the current closure scope and calls the extracted function. The provider's `navigateToStep` and `handleBranchTarget` callbacks look like:
   ```ts
   const navigateToStep = React.useCallback(
     async (stepIndex: number) => navigateToStepImpl(engineContext.current, stepIndex),
     [/* the deps that affect engineContext.current */]
   )
   ```
7. **Every existing test in `packages/core/src/context/__tests__/`** passes without modification. Verified by `pnpm --filter @tour-kit/core test`.
8. **New direct unit tests** for the extracted functions exist in `packages/core/src/lib/__tests__/navigate-to-step.test.ts` and `packages/core/src/lib/__tests__/handle-branch-target.test.ts`. Each function gets at least 5 tests covering its decision branches (hidden traversal, route navigation, manual strategy, prompt strategy, abort signal; special targets, cross-tour, wait, when-filtered, loop detection). Verified by file existence + green test runs.
9. **`pnpm size-limit` is flat.** The extraction is net-neutral on bundle size — same code, different file. Tree-shaking may expose new dead branches but the production bundle should be byte-equivalent.
10. **`examples/dashboard-next`** still works end-to-end — branches, hidden steps, route changes — confirmed by running the dev server and exercising the existing flows.

---

## What Failure Looks Like (and what to do)

- **The extracted function reads a `useRef` value whose `.current` was implicit-captured by the original closure.** React closures capture refs by identity, not by `.current` value at closure-creation time — so reading `ref.current` inside the callback reads the *current* `.current`. **The extraction must preserve this** by passing the ref *object* in `TourEngineContext`, not the `.current` value. Verify: every ref read inside the extracted body uses `ctx.someRef.current`, never `ctx.someRefValue`.
- **The extracted function depends on a closure-captured callback (`completeTour`, `skipTour`) that was itself defined via `useCallback` with deps that include the extracted function** (mutual recursion). This creates a circular dep in the React render graph: `completeTour` deps include `currentTour`/`state`/`data`/`tourKitContext`/`clear`/`persistTerminalTours`/`markSkipped` — none of which include `handleBranchTarget`. **Verified clean.** But if a future refactor accidentally introduces such a cycle, React's exhaustive-deps lint will catch it.
- **Mutual recursion breaks because `handleBranchTarget` calls itself for `BranchWait`'s `then` field.** The extracted function recursive-calls `handleBranchTarget(ctx, target.then, branchContext, actionId)` — which is fine because it's a module-level function. Same for `navigateToStep` calling `handleBranchTarget` indirectly through `BranchWait → then → resolve to index → navigateToStep`. The chain works as long as `ctx` is passed through every recursion.
- **A reviewer can't tell whether a closure variable became stale during recursion.** `TourEngineContext` is built from a `useRef` (`engineContextRef`) that's updated on every render via `useEffect(() => { engineContextRef.current = buildEngineContext(...) })`. This means `ctx` inside the extracted function is **always the latest** — refs are stable identity, `.current` reads latest. **Document this explicitly in the JSDoc on `TourEngineContext`** so reviewers don't worry about stale closures.
- **Tests fail because they spy on `navigateToStep` as a method on the provider hook return value, and the extraction changes whether the call goes through the provider's callback wrapper.** The provider callback still exists — it's just thin now. Tests that asserted call counts should still pass. If they assert on the *implementation* (e.g. checking a particular dispatch is fired), they likely still pass because the extracted function dispatches the same actions.
- **A circular import emerges.** `tour-engine-context.ts` will import types from `tour-provider.tsx` (e.g. `TourReducerState`). To avoid circularity, **all types that the engine context needs must live outside `tour-provider.tsx`** — promote them to `packages/core/src/types/` if they don't already live there. The reducer state is already in `packages/core/src/types/tour-reducer.ts` (verify); the action union is in the same file. If `TourEngineContext` needs to import `TourAction`, that's a type-only import, which is fine.
- **The extracted function throws differently than the original because of error-context loss.** The original `navigateToStep` throws `TourValidationError` with a specific message. The extracted version must throw the *same* error class with the *same* message. Test by asserting `expect(...).rejects.toThrow(TourValidationError)` and `expect(...).rejects.toMatchObject({ code: 'HIDDEN_STEP_LOOP' })`.
- **Phase 5 grows beyond a single PR.** Cut-point: §5.2 (extract `handleBranchTarget`) is the safer extraction and can ship alone. If §5.3 (`navigateToStep`) blows the time budget, ship the branch-target extraction as **Phase 5a** and split `navigateToStep` into **Phase 5b**. The `TourEngineContext` type can be added in 5a and reused in 5b — no API churn.

---

## Files Touched

### Added

| Path                                                            | Purpose                                                                 | LOC (approx) |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------ |
| `packages/core/src/lib/tour-engine-context.ts`                  | NEW — declares `TourEngineContext` interface bundling every closure read | 60 (mostly types + JSDoc) |
| `packages/core/src/lib/navigate-to-step.ts`                     | NEW — pure function form of `navigateToStep`                            | ~110         |
| `packages/core/src/lib/handle-branch-target.ts`                 | NEW — pure function form of `handleBranchTarget`                        | ~200         |
| `packages/core/src/lib/__tests__/navigate-to-step.test.ts`      | NEW — direct unit tests for the extracted function                      | ~120         |
| `packages/core/src/lib/__tests__/handle-branch-target.test.ts`  | NEW — direct unit tests for the extracted function                      | ~180         |

### Modified

| Path                                                            | Change                                                                              | Δ LOC (approx) |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `packages/core/src/context/tour-provider.tsx`                   | Delete `navigateToStep` body (lines 887–998), replace with `useCallback` calling `navigateToStepImpl`. Delete `handleBranchTarget` body (lines 1054–1246), replace with `useCallback` calling `handleBranchTargetImpl`. Add `engineContextRef` + maintenance effect. Drop 2–4 `biome-ignore` ignores. | −300 / +50     |

### Net delta

- **Provider file:** ~−250 LOC (from 1802 to ~1550)
- **New lib files:** ~+370 LOC (production) + ~+300 LOC (tests)
- **Total production code:** ~+120 LOC (slight growth from explicit type declarations + JSDoc), but **6 → 2 biome-ignore comments** and **two orchestrators are now testable in isolation**

---

## Step-by-Step Implementation

### Step 1 — Catalogue every closure-captured variable in both functions (1.5 h)

Read `tour-provider.tsx` lines 887–998 (`navigateToStep`) and 1054–1246 (`handleBranchTarget`). For every identifier referenced inside the bodies, classify it as one of:

| Class                  | Examples                                                                          | Goes into `TourEngineContext` as…                                  |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **State (readonly)**   | `currentTour`, `state`, `state.currentStep`, `state.currentStepIndex`, `state.stepVisitCount`, `state.tours`, `data` | A read-only snapshot — but since refs read latest .current, prefer passing `getState: () => TourReducerState` |
| **Refs**               | `completedTourIdRef`, `skippedTourIdRef`, `abortControllerRef`                    | The ref object itself — `ref: React.RefObject<X>`                   |
| **Reducer dispatch**   | `dispatch`                                                                        | `dispatch: React.Dispatch<TourAction>`                              |
| **Router adapter**     | `router`                                                                          | `router: RouterAdapter | null`                                      |
| **Props**              | `autoNavigate`, `onNavigationRequired`, `onStepError`, `MAX_HIDDEN_CHAIN`         | Direct fields on `TourEngineContext`                                |
| **Memoized values**    | `stepIdMap`                                                                       | A getter `getStepIdMap: () => Map<string, number>` to always read latest |
| **Parent contexts**    | `tourKitContext`                                                                  | Direct field (may be null)                                          |
| **Helpers (already pure)** | `isNavigationNeeded`, `buildCallbackContext`, `isSpecialTarget`, `isBranchToTour`, `isBranchWait`, `resolveTargetToIndex`, `isLoopDetected`, `evaluateStepWhen`, `findNextVisibleStepIndex`, `waitForStepTarget`, `advancePastHiddenStep` | Imported by the extracted files directly — NOT in `TourEngineContext` |
| **Other callbacks**    | `completeTour`, `skipTour`                                                        | Pass via `TourEngineContext` because they're React-bound — but careful: they close over the same state. Prefer making them thin wrappers around extracted functions if possible. For Phase 5, keep them in the context as `() => void` callbacks. |
| **Sibling extracted function** | `navigateToStep` (referenced from `handleBranchTarget`)                  | Recursive call to module-level function with `ctx` re-passed         |

**Output:** a written catalogue (in this file or a scratch file) listing each variable. Treat as a TODO checklist during §5.2 and §5.3.

### Step 2 — Define `TourEngineContext` (1 h)

**`packages/core/src/lib/tour-engine-context.ts`** (new file):

```ts
import type * as React from 'react'
import type { BranchTarget, BranchContext, BranchResolver, Tour, TourAction, TourReducerState, RouterAdapter, TourCallbackContext, TourKitContextValue, AdvancePastHiddenStep } from '../types'

/**
 * Bundle of every closure variable read by the navigation orchestrators
 * (`navigateToStep`, `handleBranchTarget`).
 *
 * **Read latest, never snapshot:** all stateful fields are passed as either
 * refs (for React-managed mutable state) or getters (for derived/memoized
 * values that need to follow React renders). This guarantees the extracted
 * functions never operate on a stale snapshot of provider state.
 *
 * The provider maintains a `useRef<TourEngineContext>` that is updated on
 * every render via a `useEffect(() => { engineContextRef.current = build(...) })`.
 * The extracted functions take `ctx: TourEngineContext` as their first arg —
 * the provider's `useCallback` wrappers pass `engineContextRef.current` so the
 * extracted code reads through to the latest provider state.
 */
export interface TourEngineContext {
  // === Reducer state access (latest via getter to avoid snapshot staleness) ===
  /** Returns the current reducer state snapshot. */
  getState: () => TourReducerState
  /** Reducer dispatch. Stable identity per `useReducer`. */
  dispatch: React.Dispatch<TourAction>

  // === External user data === ('data' on the provider, passed through callbacks)
  getData: () => unknown

  // === Refs (stable identity, .current reads latest) ===
  completedTourIdRef: React.RefObject<string | null>
  skippedTourIdRef: React.RefObject<string | null>
  abortControllerRef: React.RefObject<AbortController | null>

  // === Memoized derived state ===
  getStepIdMap: () => Map<string, number>
  /** The currently active tour (derived from state.tourId + state.tours). */
  getCurrentTour: () => Tour | null

  // === Router ===
  router: RouterAdapter | null
  autoNavigate: boolean

  // === Provider callback props ===
  onNavigationRequired?: (route: string, stepId: string) => void
  onStepError?: (error: Error) => void

  // === Sibling callbacks (React-bound — built in provider scope) ===
  /** Terminal-state callback that fires onComplete and dispatches COMPLETE_TOUR. */
  completeTour: () => void
  /** Terminal-state callback that fires onSkip and dispatches SKIP_TOUR. */
  skipTour: () => void

  // === Parent context (may be null) ===
  tourKitContext: TourKitContextValue | null

  // === Configuration constants ===
  /** Max iterations for hidden-step chain traversal before declaring a loop. */
  maxHiddenChain: number

  // === Helpers (passed because they may close over provider scope) ===
  /** Walk past a hidden step and return the next index or 'terminate'. */
  advancePastHiddenStep: AdvancePastHiddenStep
  /** Build a TourCallbackContext from the current state snapshot. */
  buildCallbackContext: (state: TourReducerState, tour: Tour, data: unknown) => TourCallbackContext
}
```

(The exact list above depends on what the catalog in §1 finds. Adjust accordingly. Some of these may simplify — e.g. `getData` may be obviated by passing `data` directly if it never changes during a navigation cycle.)

### Step 3 — Extract `handleBranchTarget` first (3 h)

`handleBranchTarget` is the better extraction to do first because:

- It has more branches (null, special, cross-tour, wait, index resolve), so testing it in isolation surfaces the most bugs early.
- Its only sibling-call is `navigateToStep`, which is still in the provider at this stage — meaning the first extraction's `ctx` needs a `navigateToStep` field that the provider supplies as `() => navigateToStepProviderCallback(...)`.
- After `navigateToStep` is also extracted in §5.3, the `ctx.navigateToStep` field can change from "provider callback" to "module-level recursive call" — but both shapes work the same way.

**`packages/core/src/lib/handle-branch-target.ts`** (new file):

```ts
import type { BranchContext, BranchTarget, TourReducerState } from '../types'
import { isBranchToTour, isBranchWait, isSpecialTarget } from '../types/branch'
import { isLoopDetected } from '../utils/loop-detection'
import { resolveTargetToIndex } from '../utils/branch-resolver'
import { evaluateStepWhen, findNextVisibleStepIndex } from '../utils/step-visibility'
import { logger } from '../utils/logger'
import type { TourEngineContext } from './tour-engine-context'

/**
 * Resolve a branch target and either navigate to the resolved step or fire
 * a terminal action (complete/skip/restart/cross-tour).
 *
 * Pure-ish: closes over no provider-scope state — every dependency arrives
 * via `ctx`. The only side effects are reducer dispatches and parent-context
 * callback invocations, both of which are reachable via `ctx`.
 *
 * Mutually recursive with `navigateToStep` through `BranchWait`'s `then` field
 * and through the "when-filtered" branch that calls `navigateToStep` to
 * advance to the next visible step. Both recursions pass the same `ctx`
 * forward, so the latest provider state is always observable.
 */
export async function handleBranchTarget(
  ctx: TourEngineContext,
  target: BranchTarget,
  branchContext: BranchContext,
  actionId?: string
): Promise<void> {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!currentTour || !state.currentStep) return

  const currentStepId = state.currentStep.id

  // null - stay on current step
  if (target === null) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  // Special targets
  if (isSpecialTarget(target)) {
    switch (target) {
      case 'complete':
        ctx.completeTour()
        return
      case 'skip':
        ctx.skipTour()
        return
      case 'restart': {
        ctx.dispatch({ type: 'CLEAR_VISIT_TRACKING' })
        ctx.dispatch({ type: 'GO_TO_STEP', stepIndex: 0 })
        const firstStep = currentTour.steps[0]
        if (firstStep) {
          ctx.dispatch({
            type: 'TRACK_STEP_VISIT',
            stepId: firstStep.id,
            previousStepId: currentStepId,
          })
          ctx.tourKitContext?.onStepView?.(currentTour.id, firstStep.id, 0)
        }
        return
      }
      case 'next':
      case 'prev':
        // Resolve to index and continue
        break
    }
  }

  // BranchToTour - cross-tour navigation
  if (isBranchToTour(target)) {
    const toTour = state.tours.get(target.tour)
    if (!toTour) {
      logger.warn(`Branch target tour "${target.tour}" not found`)
      ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
      return
    }
    ctx.tourKitContext?.onTourBranch?.(currentTour.id, target.tour, currentStepId)
    currentTour.onTourBranch?.(target.tour, currentStepId)

    ctx.dispatch({ type: 'STOP_TOUR' })

    let newStepIndex = 0
    if (target.step !== undefined) {
      if (typeof target.step === 'number') {
        newStepIndex = target.step
      } else {
        const newTourStepMap = new Map<string, number>()
        toTour.steps.forEach((s, i) => newTourStepMap.set(s.id, i))
        newStepIndex = newTourStepMap.get(target.step) ?? 0
      }
    }

    ctx.completedTourIdRef.current = null
    ctx.skippedTourIdRef.current = null

    ctx.dispatch({ type: 'START_TOUR', tourId: target.tour, stepIndex: newStepIndex })
    ctx.tourKitContext?.onTourStart?.(target.tour)
    toTour.onStart?.({ ...state, tour: toTour, data: ctx.getData() })
    return
  }

  // BranchWait - delay before proceeding
  if (isBranchWait(target)) {
    await new Promise((resolve) => setTimeout(resolve, target.wait))
    if (target.then) {
      await handleBranchTarget(ctx, target.then, branchContext, actionId)
    }
    return
  }

  // Resolve target to index
  const stepIdMap = ctx.getStepIdMap()
  const targetIndex = resolveTargetToIndex(
    target,
    state.currentStepIndex,
    stepIdMap,
    currentTour.steps.length
  )

  if (targetIndex === null || targetIndex === state.currentStepIndex) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  // Check for loop detection
  const targetStep = currentTour.steps[targetIndex]
  if (targetStep && isLoopDetected(targetStep.id, state.stepVisitCount)) {
    logger.warn(
      `Loop detected: step "${targetStep.id}" visited too many times. Stopping navigation.`
    )
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  // Apply when filter to the target step
  const data = ctx.getData()
  const context = ctx.buildCallbackContext(state, currentTour, data)
  const stepContext = { ...context, currentStepIndex: targetIndex, currentStep: targetStep ?? null }

  if (targetStep) {
    const shouldShow = await evaluateStepWhen(targetStep, stepContext)
    if (!shouldShow) {
      const direction = targetIndex > state.currentStepIndex ? 1 : -1
      const visibleIndex = await findNextVisibleStepIndex(
        targetIndex + direction,
        direction as 1 | -1,
        currentTour.steps,
        context
      )

      if (visibleIndex === -1) {
        ctx.completeTour()
        return
      }

      const navigated = await ctx.navigateToStep(visibleIndex)
      if (!navigated) {
        ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }
      const step = currentTour.steps[visibleIndex]
      if (step) {
        ctx.dispatch({
          type: 'TRACK_STEP_VISIT',
          stepId: step.id,
          previousStepId: currentStepId,
        })
        ctx.tourKitContext?.onStepView?.(currentTour.id, step.id, visibleIndex)
        currentTour.onStepChange?.(step, visibleIndex, { ...state, tour: currentTour, data })
      }
      return
    }
  }

  // Navigate to target step
  const navigated = await ctx.navigateToStep(targetIndex)
  if (!navigated) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }
  if (targetStep) {
    ctx.dispatch({
      type: 'TRACK_STEP_VISIT',
      stepId: targetStep.id,
      previousStepId: currentStepId,
    })
    ctx.tourKitContext?.onStepView?.(currentTour.id, targetStep.id, targetIndex)
    currentTour.onStepChange?.(targetStep, targetIndex, { ...state, tour: currentTour, data })
  }
}
```

Note `TourEngineContext` now needs a `navigateToStep: (index: number) => Promise<boolean>` field — add it to the interface in §5.2.

**Update the provider:**

```tsx
import { handleBranchTarget as handleBranchTargetImpl } from '../lib/handle-branch-target'

// Inside TourProvider:
const handleBranchTarget = React.useCallback(
  async (target: BranchTarget, branchContext: BranchContext, actionId?: string) => {
    if (!engineContextRef.current) return
    await handleBranchTargetImpl(engineContextRef.current, target, branchContext, actionId)
  },
  []  // empty deps — engineContextRef.current always reads latest
)
```

The empty deps array works because `engineContextRef` is a stable ref whose `.current` always points to the latest engine context (built by the maintenance effect described in §5.5).

### Step 4 — Add direct unit tests for `handleBranchTarget` (1.5 h)

**`packages/core/src/lib/__tests__/handle-branch-target.test.ts`** (new file):

Test the extracted function in isolation. Build a fake `TourEngineContext` per test:

```ts
import { describe, it, expect, vi } from 'vitest'
import { handleBranchTarget } from '../handle-branch-target'
import type { TourEngineContext } from '../tour-engine-context'

function makeCtx(overrides: Partial<TourEngineContext> = {}): TourEngineContext {
  // Build a stub with every field; tests override the relevant slice.
  return {
    getState: () => ({ /* base state */ }) as any,
    dispatch: vi.fn(),
    getData: () => undefined,
    completedTourIdRef: { current: null },
    skippedTourIdRef: { current: null },
    abortControllerRef: { current: null },
    getStepIdMap: () => new Map(),
    getCurrentTour: () => null,
    router: null,
    autoNavigate: true,
    onNavigationRequired: undefined,
    onStepError: undefined,
    completeTour: vi.fn(),
    skipTour: vi.fn(),
    tourKitContext: null,
    maxHiddenChain: 10,
    advancePastHiddenStep: vi.fn(),
    buildCallbackContext: vi.fn(),
    navigateToStep: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('handleBranchTarget', () => {
  it('target=null sets transitioning false and returns', async () => {
    const ctx = makeCtx({
      getCurrentTour: () => ({ id: 't1', steps: [{ id: 's1' }] }) as any,
      getState: () => ({ currentStep: { id: 's1' }, currentStepIndex: 0, tours: new Map(), stepVisitCount: new Map() }) as any,
    })
    await handleBranchTarget(ctx, null, {} as any)
    expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'SET_TRANSITIONING', isTransitioning: false })
  })

  it('special target "complete" calls completeTour', async () => {
    const ctx = makeCtx({
      getCurrentTour: () => ({ id: 't1', steps: [{ id: 's1' }] }) as any,
      getState: () => ({ currentStep: { id: 's1' }, currentStepIndex: 0, tours: new Map(), stepVisitCount: new Map() }) as any,
    })
    await handleBranchTarget(ctx, 'complete', {} as any)
    expect(ctx.completeTour).toHaveBeenCalledTimes(1)
  })

  it('special target "restart" clears visit tracking and goes to step 0', async () => { /* ... */ })

  it('BranchToTour stops current tour and starts target tour', async () => { /* ... */ })

  it('BranchToTour with missing target tour warns and does nothing', async () => { /* ... */ })

  it('BranchWait delays then recursively calls handleBranchTarget for then', async () => { /* ... */ })

  it('loop detection triggers warn + transition cleanup', async () => { /* ... */ })

  it('when-filter false advances to next visible step', async () => { /* ... */ })

  it('navigateToStep failure aborts the navigation chain', async () => {
    const ctx = makeCtx({
      navigateToStep: vi.fn().mockResolvedValue(false),
      // ... etc
    })
    // ... assert dispatch was called with SET_TRANSITIONING false
  })
})
```

Each test focuses on one decision branch. The total should be ~9 tests covering every `if`/`switch` arm in the extracted function.

### Step 5 — Add the `engineContextRef` maintenance effect to the provider (30 min)

**`packages/core/src/context/tour-provider.tsx`** — add near the top of the provider body (after `useReducer` but before any callbacks that reference `engineContextRef.current`):

```tsx
import type { TourEngineContext } from '../lib/tour-engine-context'

const engineContextRef = React.useRef<TourEngineContext>(null)

// Maintenance effect: rebuild the engine context object on every render so
// the extracted nav functions always read latest provider scope. The ref is
// stable; the .current value is replaced on each commit.
React.useEffect(() => {
  engineContextRef.current = {
    getState: () => state,  // capturing latest state via closure
    dispatch,
    getData: () => data,
    completedTourIdRef,
    skippedTourIdRef,
    abortControllerRef,
    getStepIdMap: () => stepIdMap,
    getCurrentTour: () => currentTour,
    router,
    autoNavigate,
    onNavigationRequired,
    onStepError,
    completeTour,
    skipTour,
    tourKitContext,
    maxHiddenChain: MAX_HIDDEN_CHAIN,
    advancePastHiddenStep,
    buildCallbackContext,
    navigateToStep,
  }
})
// No deps array — runs every render; this is intentional because the engine
// context bundles many closure variables and missing one would cause stale-read
// bugs. The cost is one allocation per render, which is negligible.
```

**Subtle point:** `navigateToStep` is a `useCallback` that *itself* reads `engineContextRef.current.navigateToStep`. This is a circular reference at the *type* level, but not at runtime because the ref points to whatever was assigned last commit. To break the chicken-and-egg, set the field to a stub on first render:

```tsx
// Initial assignment with stub navigateToStep — replaced on first effect run.
engineContextRef.current ??= /* an initial bare-bones context with all stubs */
```

A cleaner approach: declare `navigateToStep` and `handleBranchTarget` as `useRef<...>` instead of `useCallback`, then the maintenance effect assigns them after `useCallback` runs. **Choose whichever pattern is least invasive to the existing provider** — read the file before deciding.

### Step 6 — Extract `navigateToStep` (3 h)

Same pattern as §5.3. Create `packages/core/src/lib/navigate-to-step.ts`:

```ts
import { MAX_HIDDEN_CHAIN } from '../constants'  // or wherever this constant lives
import { TourRouteError, TourValidationError } from './validate-tour'
import { isNavigationNeeded } from '../utils/navigation'
import { waitForStepTarget } from '../utils/wait-for-target'
import type { TourEngineContext } from './tour-engine-context'

/**
 * Resolve `stepIndex` to a target step and either dispatch GO_TO_STEP
 * directly (no route change needed), or coordinate route navigation +
 * target wait + then dispatch.
 *
 * Hidden steps are traversed up to `ctx.maxHiddenChain` iterations; longer
 * chains throw `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })`.
 *
 * Returns `true` when the destination step is now active; `false` for any
 * navigation that was deferred (prompt strategy), aborted (signal), or
 * rejected (router said no).
 */
export async function navigateToStep(
  ctx: TourEngineContext,
  stepIndex: number
): Promise<boolean> {
  const currentTour = ctx.getCurrentTour()
  if (!currentTour) {
    ctx.dispatch({ type: 'GO_TO_STEP', stepIndex })
    return true
  }

  const localStepIdMap = new Map<string, number>()
  currentTour.steps.forEach((s, i) => localStepIdMap.set(s.id, i))

  let cursor = stepIndex
  for (let chain = 0; chain <= ctx.maxHiddenChain; chain++) {
    const step = currentTour.steps[cursor]
    if (!step) {
      ctx.dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
      return false
    }

    if (step.kind !== 'hidden') {
      const { needed } = isNavigationNeeded(step, ctx.router)
      if (!needed || !step.route || !ctx.router) {
        ctx.dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
        return true
      }

      if (!ctx.autoNavigate) {
        ctx.onNavigationRequired?.(step.route, step.id)
        return false
      }

      const strategy = step.routeChangeStrategy ?? 'auto'

      if (strategy === 'manual') return false

      if (strategy === 'prompt') {
        ctx.onNavigationRequired?.(step.route, step.id)
        return false
      }

      // strategy === 'auto'
      try {
        const navResult = await ctx.router.navigate(step.route)
        if (navResult === false) {
          throw new TourRouteError({
            code: 'NAVIGATION_REJECTED',
            route: step.route,
            message: `Router rejected navigation to "${step.route}".`,
          })
        }
        if (step.routeDelay && step.routeDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, step.routeDelay))
        }
        await waitForStepTarget(step, {
          route: step.route,
          timeoutMs: step.waitTimeout ?? 3000,
          signal: ctx.abortControllerRef.current?.signal,
        })
      } catch (err) {
        if (ctx.abortControllerRef.current?.signal.aborted) return false
        if (err instanceof TourRouteError) {
          ctx.onStepError?.(err)
          ctx.dispatch({ type: 'STOP_TOUR' })
          return false
        }
        throw err
      }

      ctx.dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
      return true
    }

    const next = await ctx.advancePastHiddenStep(step, cursor, currentTour, localStepIdMap)
    if (next === 'terminate') {
      ctx.dispatch({ type: 'GO_TO_STEP', stepIndex: currentTour.steps.length })
      return false
    }
    cursor = next
  }

  const stuckStep = currentTour.steps[cursor]
  throw new TourValidationError({
    code: 'HIDDEN_STEP_LOOP',
    stepId: stuckStep?.id ?? '?',
    message: `Hidden-step chain exceeded ${ctx.maxHiddenChain} iterations${stuckStep ? ` at step "${stuckStep.id}"` : ''}. Likely an infinite loop.`,
  })
}
```

**Update the provider** — replace the 887–998 callback body with a thin wrapper:

```tsx
import { navigateToStep as navigateToStepImpl } from '../lib/navigate-to-step'

const navigateToStep = React.useCallback(
  async (stepIndex: number): Promise<boolean> => {
    if (!engineContextRef.current) return false
    return navigateToStepImpl(engineContextRef.current, stepIndex)
  },
  []
)
```

### Step 7 — Add direct unit tests for `navigateToStep` (1.5 h)

**`packages/core/src/lib/__tests__/navigate-to-step.test.ts`** (new file) — covers:

- No `currentTour` → dispatches GO_TO_STEP and returns true.
- Step doesn't exist (cursor out of bounds) → dispatches GO_TO_STEP and returns false.
- Visible step with no route → dispatches GO_TO_STEP and returns true.
- Visible step with route but `!autoNavigate` → fires `onNavigationRequired` and returns false.
- Strategy `manual` → returns false without dispatch.
- Strategy `prompt` → fires `onNavigationRequired` and returns false.
- Strategy `auto` success → router.navigate called, `waitForStepTarget` awaited, GO_TO_STEP dispatched, returns true.
- Strategy `auto` router rejection → throws `TourRouteError`, calls `onStepError`, dispatches STOP_TOUR, returns false.
- Strategy `auto` abort signal during wait → returns false silently.
- Hidden chain exceeding `maxHiddenChain` → throws `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })`.

Each test builds a fake `TourEngineContext` and asserts on the dispatch / callback invocations.

### Step 8 — Drop 4 biome-ignore comments (15 min)

After both extractions are complete and tests pass, delete:

- Line 888: `// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: hidden-traversal + route navigation in one orchestrator` (now in `navigate-to-step.ts` — but the new file should not trigger the rule because the extracted function is simpler context-free)
- Line 1059: `// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: branch navigation with multiple target types` (same — now in `handle-branch-target.ts`)
- Plus: any other ignores that were specifically there to silence complexity inside the extracted regions.

Run `pnpm lint` — expect no new violations. If the *new* files (`navigate-to-step.ts`, `handle-branch-target.ts`) trigger `noExcessiveCognitiveComplexity` warnings, that's a signal the extraction didn't reduce complexity enough — investigate. Likely fix: extract the inner `switch (target)` branches in `handleBranchTarget` into smaller helpers (`handleSpecialTarget`, `handleCrossTour`, `handleWaitTarget`).

### Step 9 — Run the full test suite + integration check (1.5 h)

```bash
# Per-package
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/react test

# Workspace
pnpm typecheck
pnpm build
pnpm size-limit
```

**Manual integration check (must pass before merge):**

```bash
pnpm --filter @tour-kit/dashboard-next dev  # or whatever runs examples/dashboard-next
```

In the browser, exercise:

1. A multi-step tour with a hidden step in the middle — confirm hidden step is traversed.
2. A tour with `routeChangeStrategy: 'auto'` and a route change — confirm route navigation + target wait + dispatch ordering.
3. A tour with `routeChangeStrategy: 'manual'` — confirm consumer drives navigation and no auto-navigation happens.
4. A branch with `BranchToTour` (cross-tour) — confirm both `onTourBranch` and `onTourStart` callbacks fire in order.
5. A branch with `BranchWait` and a `then` — confirm the delay then the recursive call.

These are not Vitest tests — they're a manual smoke test of the integration. If any of these break, the extraction has a regression; **do not merge**.

---

## Validation Gates

1. `wc -l packages/core/src/context/tour-provider.tsx` reports **≤ ~1500 lines** (down from 1802).
2. `grep -c "biome-ignore lint/complexity/noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx` returns **≤ 2** (down from 6).
3. `packages/core/src/lib/navigate-to-step.ts` and `packages/core/src/lib/handle-branch-target.ts` exist and export module-level functions.
4. `packages/core/src/lib/tour-engine-context.ts` declares the `TourEngineContext` interface.
5. New tests at `packages/core/src/lib/__tests__/navigate-to-step.test.ts` (10 tests) and `…/handle-branch-target.test.ts` (9 tests) all pass.
6. `pnpm --filter @tour-kit/core test` and `pnpm --filter @tour-kit/react test` both exit 0 — **including all existing tests without modification**.
7. `pnpm typecheck` clean (modulo dashboard-next baseline per memory `#203`).
8. `pnpm size-limit` is flat — no regression in `@tour-kit/core` budget.
9. The dashboard-next manual smoke test passes for all 5 flows listed in §5.9.

---

## Rollback Plan

If Phase 5 ships as a single PR and a regression is discovered post-merge, `git revert <merge-commit-sha>` restores the 1802-line provider with all 6 biome-ignores. The new lib files become orphaned but harmless (they're not imported after revert).

**Phase 5a / 5b split** — if §5.6 (`navigateToStep` extraction) takes longer than 4 hours, ship §5.2–§5.5 as **Phase 5a (handle-branch-target only)** and defer `navigateToStep` to **Phase 5b** in a follow-up PR. The `TourEngineContext` type can be added in 5a (with `navigateToStep` field typed as the provider's existing callback type) and reused unchanged in 5b. **Cut-point criteria:** if the new tests for `handleBranchTarget` (§5.4) all pass and you're past 7 hours in, split. The two extractions are independent enough that 5b can ship 2 weeks later with no merge-conflict risk.

---

## Open Questions Surfaced During Planning

1. **Should the extracted functions be exported from `@tour-kit/core` for advanced consumers?** They're new module-level functions — could be public. **Recommendation:** keep internal (no barrel re-export). The `TourEngineContext` shape is an implementation detail and we don't want consumers depending on it. Revisit if there's demand for low-level navigation control.
2. **Should `completeTour` and `skipTour` also be extracted?** They're currently `useCallback`s in the provider. They could become extracted module functions in a follow-up, further trimming the provider. **Decision:** out of scope for Phase 5. The two functions are well under the complexity threshold and their React-bound shape (closing over `tourKitContext`, `clear`, `persistTerminalTours`, `markSkipped`) makes the extraction noisier than the gain. File a follow-up.
3. **Should the flow-restore effect (lines 671–890) be extracted too?** It's the third-largest complexity hotspot and carries a `biome-ignore` of its own. **Decision:** out of scope for Phase 5. It's tightly coupled to the maintenance effect, the abort controller, and the persistence layer; extraction would require a much larger `TourEngineContext`. Re-evaluate after Phase 5 lands and we see whether the engine-context pattern scales.
4. **Should we add a runtime invariant check inside `TourEngineContext` build to assert no field is `undefined`?** Defensive but probably noise. **Decision:** skip — TypeScript's `strict` mode catches missing fields at compile time, and the maintenance effect runs every render so a missed field would crash on first navigation, surfacing the bug fast in tests.

---

## Time Budget

| Step                                                       | Estimated |
| ---------------------------------------------------------- | --------- |
| 1. Catalog closure-captured variables                      | 1.5 h     |
| 2. Define `TourEngineContext`                              | 1 h       |
| 3. Extract `handleBranchTarget`                            | 3 h       |
| 4. Add direct unit tests for `handleBranchTarget`          | 1.5 h     |
| 5. Add `engineContextRef` maintenance effect               | 30 min    |
| 6. Extract `navigateToStep`                                | 3 h       |
| 7. Add direct unit tests for `navigateToStep`              | 1.5 h     |
| 8. Drop biome-ignore comments + lint                       | 15 min    |
| 9. Full test suite + integration smoke check               | 1.5 h     |
| Buffer for type / closure surprises                        | 1.25 h    |
| **Total**                                                  | **~14 h** (allow 12–16 h envelope)|

If the total exceeds 8 hours mid-extraction, **split the phase**. Carrying a half-extracted `tour-provider.tsx` through more than one work session is the highest-risk failure mode — every additional pause introduces stale-context risk.
