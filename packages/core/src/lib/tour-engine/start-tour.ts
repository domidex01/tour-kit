/**
 * Issue #121 — the two halves of "a tour starts on this step", shared by
 * `startImpl` and the cross-tour branch.
 *
 * Both commit a step *without* going through `navigateToStep`, so both owe the
 * incoming half of the step lifecycle; and the re-arm / dispatch / analytics /
 * `onStart` tail was already duplicated verbatim between them.
 *
 * They live here rather than in `actions.ts` because `handle-branch-target.ts`
 * needs them and `actions.ts` already imports `handleBranchTargetImpl` — a
 * direct import would close a cycle between the two, which
 * `handle-branch-target.ts` documents that it avoids.
 *
 * The split is deliberate: the *guards* are shared, the *response to a veto* is
 * not. `startImpl` returns silently; the branch clears its transitioning flag
 * and leaves the current tour running. Injecting that difference into one
 * function as a callback would hide each caller's control flow from its own
 * reader, so each caller asks, then decides, then commits.
 */
import type { TourCallbackContext } from '../../types/state'
import type { Tour } from '../../types/tour'
import type { TourReducerState } from '../../types/tour-reducer'
import type { TourEngineContext } from './context'
import { buildCallbackContext, invokeAsyncCallback, invokeCallback } from './helpers'

/**
 * Ask the landing step's pre-commit hooks: `onBeforeShow` (which may veto) and
 * then `onEnter`. Nothing is dispatched and nothing is announced, so a `false`
 * here leaves the world exactly as it was.
 *
 * @returns `false` when `onBeforeShow` returned a literal `false`.
 */
export async function askStepGuards(
  ctx: TourEngineContext,
  tour: Tour,
  stepIndex: number,
  data: Record<string, unknown>
): Promise<boolean> {
  const step = tour.steps[stepIndex]
  if (!step) return true

  // Shaped as if the tour had already started — the step's own hooks should
  // see where they are about to be, not the pre-start state.
  const stepCtx: TourCallbackContext = {
    ...buildCallbackContext(ctx.getState(), tour, data),
    tourId: tour.id,
    isActive: true,
    totalSteps: tour.steps.length,
    currentStepIndex: stepIndex,
    currentStep: step,
  }

  if ((await invokeAsyncCallback('onBeforeShow', () => step.onBeforeShow?.(stepCtx))) === false) {
    return false
  }
  await invokeAsyncCallback('onEnter', () => step.onEnter?.(stepCtx))
  return true
}

/**
 * Commit the start: re-arm the terminal-callback guards, dispatch `START_TOUR`,
 * fire the start callbacks. Synchronous, and only ever called once
 * {@link askStepGuards} has passed — the re-arm wipes terminal state, so a
 * vetoed start must not reach this.
 */
export function commitStart(
  ctx: TourEngineContext,
  tour: Tour,
  stepIndex: number,
  state: TourReducerState,
  data: Record<string, unknown>
): void {
  ctx.completedTourIdRef.current = null
  ctx.skippedTourIdRef.current = null

  ctx.dispatch({ type: 'START_TOUR', tourId: tour.id, stepIndex })
  ctx.tourKitContext?.onTourStart?.(tour.id)
  invokeCallback('onStart', () => tour.onStart?.({ ...state, tour, data }))
}
