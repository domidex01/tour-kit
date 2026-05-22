import type { RouterAdapter } from '../../types/router'
import type { TourCallbackContext, TourState } from '../../types/state'
import type { TourStep } from '../../types/step'
import type { Tour } from '../../types/tour'
import { logger } from '../../utils/logger'

/**
 * Whether the step requires the router to navigate before mount.
 */
export function isNavigationNeeded(
  step: TourStep | undefined,
  router: RouterAdapter | undefined
): { needed: boolean; isOnRoute: boolean } {
  if (!step?.route || !router) {
    return { needed: false, isOnRoute: true }
  }
  const matchMode = step.routeMatch ?? 'exact'
  const isOnRoute = router.matchRoute(step.route, matchMode)
  return { needed: !isOnRoute, isOnRoute }
}

/**
 * Build a `TourCallbackContext` from the reducer state, current tour, and
 * data slice. Shared by `navigateToStep` and `handleBranchTarget` for `when`
 * evaluation and lifecycle callbacks.
 */
export function buildCallbackContext(
  state: TourState,
  tour: Tour | null,
  data: Record<string, unknown>
): TourCallbackContext {
  return {
    tourId: state.tourId,
    isActive: state.isActive,
    currentStepIndex: state.currentStepIndex,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    isLoading: state.isLoading,
    isTransitioning: state.isTransitioning,
    completedTours: state.completedTours,
    skippedTours: state.skippedTours,
    visitedSteps: state.visitedSteps,
    stepVisitCount: state.stepVisitCount,
    previousStepId: state.previousStepId,
    tour,
    data,
  }
}

/**
 * Evaluate a step's `when` predicate. Defaults to true on undefined; any
 * thrown error is logged and treated as `false` (skip the step) so a buggy
 * predicate cannot brick the tour.
 */
export async function evaluateStepWhen(
  step: TourStep,
  context: TourCallbackContext
): Promise<boolean> {
  if (!step.when) return true
  try {
    return await step.when(context)
  } catch (error) {
    logger.warn(`Error evaluating when condition for step "${step.id}":`, error)
    return false
  }
}

/**
 * Walk steps in `direction` from `startIndex` (inclusive) until a step's
 * `when` predicate returns true or the array boundary is reached.
 *
 * @returns The matching index, or `-1` when no visible step exists.
 */
export async function findNextVisibleStepIndex(
  startIndex: number,
  direction: 1 | -1,
  steps: TourStep[],
  context: TourCallbackContext
): Promise<number> {
  let index = startIndex
  while (index >= 0 && index < steps.length) {
    const step = steps[index]
    if (!step) break
    const stepContext: TourCallbackContext = {
      ...context,
      currentStepIndex: index,
      currentStep: step,
    }
    const shouldShow = await evaluateStepWhen(step, stepContext)
    if (shouldShow) return index
    index += direction
  }
  return -1
}

/**
 * Nearest visible step from `startIndex` — tries forward, then backward.
 */
export async function findNearestVisibleStepIndex(
  startIndex: number,
  steps: TourStep[],
  context: TourCallbackContext
): Promise<number> {
  const forwardIndex = await findNextVisibleStepIndex(startIndex, 1, steps, context)
  if (forwardIndex !== -1) return forwardIndex
  return findNextVisibleStepIndex(startIndex - 1, -1, steps, context)
}
