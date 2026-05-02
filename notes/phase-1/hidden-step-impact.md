# Spike 0.2 — Hidden-Step Impact

**Date:** 2026-05-02
**Owner:** domidex01
**Phase:** 1.0 (Validation Gate)
**File under audit:** `packages/core/src/context/tour-provider.tsx`
**Hypothesis:** A hidden-step semantics (`step.kind === 'hidden'`) can be slotted into the existing `findNextVisibleStepIndex` / `findNearestVisibleStepIndex` helpers without a wider reducer or callsite rewrite.

---

## Inputs verified

```bash
$ grep -c "currentStepIndex" packages/core/src/context/tour-provider.tsx
22
```

Step type today (`packages/core/src/types/step.ts:9–69`) has **no `kind` field** — Phase 2 will introduce it as an optional discriminator. The existing `when` predicate (line 33) is the only "skip this step" lever; hidden steps are conceptually "always-skip-from-navigation, run-onEnter-only" — i.e. a stricter sibling of `when: () => false`.

---

## Classification table

Every `currentStepIndex` reference in `tour-provider.tsx`, classified into:

- **read** — pure read, no decision based on step kind
- **compute** — passes the index into `findNext/NearestVisibleStepIndex` or `resolveTargetToIndex`
- **dispatch** — writes to reducer
- **render-gate** — chooses whether to mount the step UI / fire onShow

| Line | Code excerpt | Classification | Hidden-step concern? |
| ---: | --- | --- | --- |
| 78 | `currentStepIndex: state.currentStepIndex` (in `buildCallbackContext`) | read | No — context propagation. |
| 131 | `currentStepIndex: index` (synthetic context inside `findNextVisibleStepIndex`) | read | No — already inside the helper we're extending. |
| 191 | `currentStepIndex: 0` (in `createStoppedState`) | dispatch | No — reset path. |
| 225 | `currentStepIndex: index` (in `handleStartTour`) | dispatch | No — reducer write; finder already filtered visible. |
| 244 | `currentStepIndex: newIndex` (in `handleStepNavigation`) | dispatch | No — reducer write; finder already filtered visible. |
| 270 | `handleStepNavigation(state, state.currentStepIndex + 1)` (NEXT_STEP reducer) | compute | **Stale path** — only fires if the public `next()` callback bypasses the helper. Today every callsite goes through `next()` → `findNextVisibleStepIndex`, so this branch is unreachable. Worth deleting in Phase 2. |
| 272 | `handleStepNavigation(state, state.currentStepIndex - 1)` (PREV_STEP reducer) | compute | Same as line 270 — unreachable via the public API. |
| 306–310 | `updatedTour.steps[state.currentStepIndex]` (UPDATE_TOURS hot-swap) | read | No — refreshes the `currentStep` reference after a tours-array mutation. Safe because the index was already validated at write time. |
| 371 | `currentStepIndex: 0` (initialState) | dispatch | No — initialization. |
| 437 | `[…, state.currentStepIndex, …]` (effect deps for `save`) | read | No — persistence trigger. |
| 512 | `tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)` (in `skipTour`) | read | No — analytics surface. |
| 617 | `state.currentStepIndex` arg to `resolveTargetToIndex` (branch handler) | compute | **Render-gate-adjacent** — the result feeds into `findNextVisibleStepIndex` at line 650 if the resolved step is filtered out. Hidden-step skip flows through the same fallback. |
| 622 | `targetIndex === state.currentStepIndex` (no-op guard in branch handler) | read | No — identity short-circuit. |
| 641 | `currentStepIndex: targetIndex` (synthetic step context) | read | No — already filtered above. |
| 649 | `targetIndex > state.currentStepIndex ? 1 : -1` (direction selector for fallback finder) | compute | No — direction picker, not gate. |
| 722 | `currentStepIndex: initialIndex` (synthetic state for first-step `when` eval in `start`) | read | No — `start` then calls `findNextVisibleStepIndex(initialIndex, 1, …)` at 730. |
| 762 | `state.currentStepIndex >= currentTour.steps.length - 1` (last-step check in `next`) | render-gate | **Yes** — if the last visible step is followed only by hidden trailing steps, this condition must still complete. The fix is in the helper, not here: extending the finder makes "no further visible step" return `-1`, which the existing `if (nextStepIndex === -1)` branch at line 780 already handles by calling `completeTour()`. |
| 773 | `state.currentStepIndex + 1` arg to `findNextVisibleStepIndex` (in `next`) | compute | **Yes — change is in the helper.** Caller doesn't change. |
| 834 | `state.currentStepIndex <= 0` (first-step guard in `prev`) | render-gate | **Yes** — same shape as 762. If only hidden steps precede, the helper returns `-1` and the existing `if (prevStepIndex === -1)` branch at 848 keeps the user on the current step. No change. |
| 841 | `state.currentStepIndex - 1` arg to `findNextVisibleStepIndex` (in `prev`) | compute | **Yes — change is in the helper.** Caller doesn't change. |
| 895 | `currentStepIndex: stepIndex` (synthetic context in `goTo`) | read | No. |

**Summary:** 22 hits across the file. **Render-gates that change behavior with hidden steps: zero — they all delegate the visibility decision to the two helpers.** The two helpers are the only files that need to learn about `step.kind === 'hidden'`.

---

## Proposed minimum diff

Single change is to `evaluateStepWhen` (line 97) so a `kind: 'hidden'` step short-circuits to "not visible". The two helpers (lines 116–144 and 151–162) already consume `evaluateStepWhen` — they need **no edit**.

```diff
--- a/packages/core/src/context/tour-provider.tsx
+++ b/packages/core/src/context/tour-provider.tsx
@@ -94,6 +94,9 @@
  /**
   * Evaluate step's when condition
   * @returns true if step should be shown, false if it should be skipped
   */
  async function evaluateStepWhen(step: TourStep, context: TourCallbackContext): Promise<boolean> {
+   // Phase 2: hidden steps run lifecycle hooks but never mount step UI; they are
+   // always "not visible" from the navigation finder's perspective.
+   if (step.kind === 'hidden') return false
    if (!step.when) return true
```

And in `packages/core/src/types/step.ts`, add the optional discriminator:

```diff
  export interface TourStep {
    id: string
+   /** Step kind. 'hidden' steps run lifecycle (onBeforeShow/onShow/onHide) but never mount step UI. */
+   kind?: 'standard' | 'hidden'
    target: string | React.RefObject<HTMLElement | null>
```

One additional spot needs attention — Phase 2 will likely add an `onEnter` lifecycle hook fired even for hidden steps inside `START_TOUR` / `GO_TO_STEP` (lines 195–250). That is **a new lifecycle**, not a refactor of the existing one, and it lives in the same two reducer cases. Hour budget below assumes this `onEnter` is the only new code path.

---

## Reducer/state-shape impact

**None.** State shape (`TourReducerState` lines 182–184) does not need a new field. The action shape (`TourAction` lines 165–180) does not need a new variant. Branch resolution (`resolveTargetToIndex`, line 615 ff.) operates on indices, not kinds, and routes its filtered output back through `findNextVisibleStepIndex` — so the hidden-step skip is implicit.

---

## Hour estimate

| Sub-task | Files touched | Hours |
| --- | --- | --- |
| Add `kind?: 'standard' \| 'hidden'` to `TourStep` | `types/step.ts` | 0.25 |
| Short-circuit `evaluateStepWhen` for hidden | `context/tour-provider.tsx` | 0.25 |
| Add `onEnter` lifecycle invocation in `handleStartTour` + `handleStepNavigation` | `context/tour-provider.tsx` | 0.75 |
| Update `TourCallbackContext` JSDoc / type for `onEnter` if separate | `types/state.ts` | 0.25 |
| Tests: 4 new cases (hidden first, hidden last, hidden-trailing, hidden-only-tour) | `__tests__/context/tour-provider-hidden.test.tsx` | 1.5 |
| Documentation: 1 paragraph in `apps/docs/content/docs/core/types.mdx` | docs | 0.5 |
| **Total** | **5 files** | **3.5h** |

≤ 4h cap. **Refactor fits inside the existing helpers — no reducer rewrite, no callsite churn.**

---

Decision: GO
