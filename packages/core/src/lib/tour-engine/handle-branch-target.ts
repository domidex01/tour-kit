import type { BranchContext, BranchTarget, TourCallbackContext } from '../../types'
import {
  isBranchToTour,
  isBranchWait,
  isLoopDetected,
  isSpecialTarget,
  resolveTargetToIndex,
} from '../../utils/branch'
import { logger } from '../../utils/logger'
import type { TourEngineContext } from './context'
import { buildCallbackContext, evaluateStepWhen, findNextVisibleStepIndex } from './helpers'

/**
 * Resolve a `BranchTarget` to its effect on the active tour. Mirrors the
 * branch-handling matrix documented in the provider — terminal targets
 * (`'complete'` / `'skip'` / `'restart'`), cross-tour navigation, branch
 * delays, loop detection, `when`-filtered targets, and the success path that
 * tracks step view + fires `onStepChange`.
 *
 * Calls `ctx.navigateToStep` for actual route-aware navigation; never
 * imports `navigate-to-step` directly so swap-points and circular surface
 * stay clean.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: branch navigation with multiple target types
export async function handleBranchTargetImpl(
  ctx: TourEngineContext,
  target: BranchTarget,
  branchContext: BranchContext,
  actionId?: string
): Promise<void> {
  void branchContext
  void actionId

  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  const data = ctx.getData()

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
        // Resolve to index and fall through to the resolveTargetToIndex path
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

    // Re-arm terminal-callback guards for the new tour
    ctx.completedTourIdRef.current = null
    ctx.skippedTourIdRef.current = null

    ctx.dispatch({ type: 'START_TOUR', tourId: target.tour, stepIndex: newStepIndex })
    ctx.tourKitContext?.onTourStart?.(target.tour)
    toTour.onStart?.({ ...state, tour: toTour, data })
    return
  }

  // BranchWait - delay before proceeding
  if (isBranchWait(target)) {
    await new Promise((resolve) => setTimeout(resolve, target.wait))
    if (target.then) {
      await handleBranchTargetImpl(ctx, target.then, branchContext, actionId)
    }
    return
  }

  // Resolve target to index
  const targetIndex = resolveTargetToIndex(
    target,
    state.currentStepIndex,
    ctx.getStepIdMap(),
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

  // Apply `when` filter to the target step
  const context = buildCallbackContext(state, currentTour, data)
  const stepContext: TourCallbackContext = {
    ...context,
    currentStepIndex: targetIndex,
    currentStep: targetStep ?? null,
  }

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
        currentTour.onStepChange?.(step, visibleIndex, {
          ...state,
          tour: currentTour,
          data,
        })
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
    currentTour.onStepChange?.(targetStep, targetIndex, {
      ...state,
      tour: currentTour,
      data,
    })
  }
}
