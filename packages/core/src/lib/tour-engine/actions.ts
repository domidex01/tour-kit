/**
 * v2 §1.3d — the tour's public verbs, moved behind the port.
 *
 * Every function here takes `ctx: TourEngineContext` first and reads live
 * state through its getters. That is not ceremony: the provider's versions
 * closed over a render-scoped `state` const and needed dependency arrays to
 * stay fresh across `await` boundaries. Reading `ctx.getState()` after an
 * await is correct by construction, which is why the two already-extracted
 * impls (`navigateToStepImpl`, `handleBranchTargetImpl`) work the same way.
 */
import type { BranchContext } from '../../types/branch'
import type { TourCallbackContext } from '../../types/state'
import { resolveBranch } from '../../utils/branch'
import { logger } from '../../utils/logger'
import type { TourEngineContext } from './context'
import { handleBranchTargetImpl } from './handle-branch-target'
import {
  buildCallbackContext,
  evaluateStepWhen,
  findNearestVisibleStepIndex,
  findNextVisibleStepIndex,
  invokeCallback,
} from './helpers'

/** The `{ ...state, tour, data }` shape every tour-level callback receives. */
function snapshot(ctx: TourEngineContext): TourCallbackContext {
  return buildCallbackContext(ctx.getState(), ctx.getCurrentTour(), ctx.getData())
}

export function buildBranchContextImpl(
  ctx: TourEngineContext,
  action?: string,
  actionPayload?: unknown
): BranchContext {
  return { ...snapshot(ctx), action, actionPayload, setData: ctx.setData }
}

/**
 * The single source of truth for ALL completion paths — public `complete()`,
 * `next()` at the last step, a branch resolving to 'complete', and the
 * no-visible-step auto-finish.
 *
 * Two guards, and both are load-bearing. `completedTourIdRef` stops a
 * synchronous double-call (two `next()`s in one tick see the same
 * pre-dispatch state); `state.isActive` stops a re-fire once COMPLETE_TOUR
 * has landed.
 */
export function completeTourImpl(ctx: TourEngineContext): void {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour) return
  if (ctx.completedTourIdRef.current === currentTour.id) return
  ctx.completedTourIdRef.current = currentTour.id

  if (ctx.persistTerminalTours) ctx.markCompleted(currentTour.id)
  ctx.dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
  ctx.dispatch({ type: 'COMPLETE_TOUR' })
  ctx.clearRouteState()
  ctx.tourKitContext?.onTourComplete?.(currentTour.id)
  invokeCallback('onComplete', () =>
    currentTour.onComplete?.({ ...state, tour: currentTour, data: ctx.getData() })
  )
}

/** Mirrors `completeTourImpl` for skip semantics. */
export function skipTourImpl(ctx: TourEngineContext): void {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour) return
  if (ctx.skippedTourIdRef.current === currentTour.id) return
  ctx.skippedTourIdRef.current = currentTour.id

  if (ctx.persistTerminalTours) ctx.markSkipped(currentTour.id)
  ctx.dispatch({ type: 'ADD_SKIPPED', tourId: currentTour.id })
  ctx.dispatch({ type: 'SKIP_TOUR' })
  ctx.clearRouteState()
  ctx.tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)
  invokeCallback('onSkip', () =>
    currentTour.onSkip?.({ ...state, tour: currentTour, data: ctx.getData() })
  )
}

export async function startImpl(
  ctx: TourEngineContext,
  tourId?: string,
  stepIndex?: number
): Promise<void> {
  const state = ctx.getState()
  const data = ctx.getData()

  // `state.tours` is built from the `tours` prop/option in insertion order, so
  // the first entry is the first registered tour.
  const id = tourId ?? state.tours.keys().next().value
  if (!id) return

  const tour = state.tours.get(id)
  if (!tour) return

  const initialIndex = stepIndex ?? tour.startAt ?? 0

  // Context for `when` evaluation, shaped as if the tour had already started.
  const context = buildCallbackContext(
    {
      ...state,
      tourId: id,
      isActive: true,
      totalSteps: tour.steps.length,
      currentStepIndex: initialIndex,
      currentStep: tour.steps[initialIndex] ?? null,
    },
    tour,
    data
  )

  const visibleIndex = await findNextVisibleStepIndex(initialIndex, 1, tour.steps, context)
  if (visibleIndex === -1) {
    logger.warn(`Tour "${id}" has no visible steps`)
    return
  }

  // Re-arm terminal-callback guards for the (re)started tour.
  ctx.completedTourIdRef.current = null
  ctx.skippedTourIdRef.current = null

  ctx.dispatch({ type: 'START_TOUR', tourId: id, stepIndex: visibleIndex })
  ctx.tourKitContext?.onTourStart?.(id)
  invokeCallback('onStart', () => tour.onStart?.({ ...state, tour, data }))
}

export async function nextImpl(ctx: TourEngineContext): Promise<void> {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour) return

  const currentStep = state.currentStep

  if (currentStep?.onNext !== undefined) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
    const branchContext = buildBranchContextImpl(ctx)
    const target = await resolveBranch(currentStep.onNext, branchContext)
    await handleBranchTargetImpl(ctx, target, branchContext)
    return
  }

  if (state.currentStepIndex >= currentTour.steps.length - 1) {
    ctx.completeTour()
    return
  }

  ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

  const data = ctx.getData()
  const context = buildCallbackContext(state, currentTour, data)
  const nextStepIndex = await findNextVisibleStepIndex(
    state.currentStepIndex + 1,
    1,
    currentTour.steps,
    context
  )

  // No more visible steps — the tour is over.
  if (nextStepIndex === -1) {
    ctx.completeTour()
    return
  }

  const navigated = await ctx.navigateToStep(nextStepIndex)
  if (!navigated) {
    // Reset the transitioning flag set above. The auto-strategy failure path
    // (TARGET_NOT_FOUND / NAVIGATION_REJECTED) already dispatches STOP_TOUR,
    // which clears it — this redundant dispatch only matters for the prompt /
    // manual / hidden-terminate paths, where the tour is still active but the
    // navigation was deferred.
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  const nextStep = currentTour.steps[nextStepIndex]
  if (nextStep) {
    ctx.dispatch({
      type: 'TRACK_STEP_VISIT',
      stepId: nextStep.id,
      previousStepId: currentStep?.id ?? null,
    })
    ctx.tourKitContext?.onStepView?.(currentTour.id, nextStep.id, nextStepIndex)
    invokeCallback('onStepChange', () =>
      currentTour.onStepChange?.(nextStep, nextStepIndex, { ...state, tour: currentTour, data })
    )
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: step navigation with branch/loop handling
export async function prevImpl(ctx: TourEngineContext): Promise<void> {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour) return

  const currentStep = state.currentStep

  if (currentStep?.onPrev !== undefined) {
    // `null` means "back is disabled here", not "no branch".
    if (currentStep.onPrev === null) return

    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
    const branchContext = buildBranchContextImpl(ctx)
    const target = await resolveBranch(currentStep.onPrev, branchContext)
    await handleBranchTargetImpl(ctx, target, branchContext)
    return
  }

  if (state.currentStepIndex <= 0) return

  ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

  const data = ctx.getData()
  const context = buildCallbackContext(state, currentTour, data)
  const prevStepIndex = await findNextVisibleStepIndex(
    state.currentStepIndex - 1,
    -1,
    currentTour.steps,
    context
  )

  // No previous visible step — stay put.
  if (prevStepIndex === -1) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  const navigated = await ctx.navigateToStep(prevStepIndex)
  if (!navigated) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  const prevStep = currentTour.steps[prevStepIndex]
  if (prevStep) {
    ctx.dispatch({
      type: 'TRACK_STEP_VISIT',
      stepId: prevStep.id,
      previousStepId: currentStep?.id ?? null,
    })
    ctx.tourKitContext?.onStepView?.(currentTour.id, prevStep.id, prevStepIndex)
    invokeCallback('onStepChange', () =>
      currentTour.onStepChange?.(prevStep, prevStepIndex, { ...state, tour: currentTour, data })
    )
  }
}

export async function goToImpl(ctx: TourEngineContext, stepIndex: number): Promise<void> {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour) return

  const targetStep = currentTour.steps[stepIndex]
  if (!targetStep) return

  ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

  const data = ctx.getData()
  const context = buildCallbackContext(state, currentTour, data)
  const shouldShow = await evaluateStepWhen(targetStep, {
    ...context,
    currentStepIndex: stepIndex,
    currentStep: targetStep,
  })

  // Use the requested step when it can be shown; otherwise the nearest visible.
  const targetIndex = shouldShow
    ? stepIndex
    : await findNearestVisibleStepIndex(stepIndex + 1, currentTour.steps, context)

  if (targetIndex === -1) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  const navigated = await ctx.navigateToStep(targetIndex)
  if (!navigated) {
    ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
    return
  }

  const step = currentTour.steps[targetIndex]
  if (step) {
    ctx.tourKitContext?.onStepView?.(currentTour.id, step.id, targetIndex)
    invokeCallback('onStepChange', () =>
      currentTour.onStepChange?.(step, targetIndex, { ...state, tour: currentTour, data })
    )
  }
}

export async function goToStepImpl(ctx: TourEngineContext, stepId: string): Promise<void> {
  const state = ctx.getState()
  if (!state.isActive || !ctx.getCurrentTour()) return

  const stepIndex = ctx.getStepIdMap().get(stepId)
  if (stepIndex === undefined) {
    logger.warn(`Step "${stepId}" not found in tour`)
    return
  }

  await goToImpl(ctx, stepIndex)
}

/** Start a different tour — the cross-tour branching entry point. */
export async function startTourImpl(
  ctx: TourEngineContext,
  tourId: string,
  stepId?: string | number
): Promise<void> {
  const tour = ctx.getState().tours.get(tourId)
  if (!tour) {
    logger.warn(`Tour "${tourId}" not found`)
    return
  }

  let stepIndex: number | undefined
  if (stepId !== undefined) {
    if (typeof stepId === 'number') {
      stepIndex = stepId
    } else {
      // Resolve against the TARGET tour's steps, not the active tour's map.
      const tourStepMap = new Map<string, number>()
      tour.steps.forEach((s, i) => tourStepMap.set(s.id, i))
      stepIndex = tourStepMap.get(stepId)
      if (stepIndex === undefined) {
        logger.warn(`Step "${stepId}" not found in tour "${tourId}"`)
      }
    }
  }

  await startImpl(ctx, tourId, stepIndex)
}

/** Trigger a branch action declared in the current step's `onAction`. */
export async function triggerBranchActionImpl(
  ctx: TourEngineContext,
  actionId: string,
  payload?: unknown
): Promise<void> {
  const state = ctx.getState()
  const currentTour = ctx.getCurrentTour()
  if (!state.isActive || !currentTour || !state.currentStep) return

  const currentStep = state.currentStep
  const branch = currentStep.onAction?.[actionId]
  if (!branch) {
    logger.warn(`Action "${actionId}" not found on step "${currentStep.id}"`)
    return
  }

  ctx.dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

  const branchContext = buildBranchContextImpl(ctx, actionId, payload)
  const target = await resolveBranch(branch, branchContext)

  ctx.tourKitContext?.onBranchAction?.(currentTour.id, currentStep.id, actionId, target)
  currentTour.onBranchAction?.(currentStep.id, actionId, target)

  await handleBranchTargetImpl(ctx, target, branchContext, actionId)
}

export function stopImpl(ctx: TourEngineContext): void {
  ctx.dispatch({ type: 'STOP_TOUR' })
}

export function resetImpl(ctx: TourEngineContext, tourId?: string): void {
  if (ctx.persistTerminalTours) ctx.resetPersistence(tourId)
  ctx.dispatch({ type: 'RESET', tourId })
}

/**
 * Still a no-op, exactly as at `tour-provider.tsx:1120`. `createTerminalStore`
 * implements the storage half; nothing calls it. Moved as-is — wiring it up is
 * a behaviour change and belongs after §1.4, not inside a refactor.
 */
export function setDontShowAgainImpl(
  _ctx: TourEngineContext,
  _tourId: string,
  _value: boolean
): void {
  // Implemented in createTerminalStore / usePersistence; deliberately unwired.
}
