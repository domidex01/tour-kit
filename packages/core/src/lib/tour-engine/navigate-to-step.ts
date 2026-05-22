import type { BranchContext, TourCallbackContext } from '../../types'
import type { TourStep } from '../../types/step'
import type { Tour } from '../../types/tour'
import { resolveBranch, resolveTargetToIndex } from '../../utils/branch'
import { TourValidationError } from '../validate-tour'
import { TourRouteError, waitForStepTarget } from '../wait-for-step-target'
import type { TourEngineContext } from './context'
import { buildCallbackContext, isNavigationNeeded } from './helpers'

/**
 * Run a hidden step's lifecycle and return either the next cursor or
 * `'terminate'` if the step's `onNext` resolves to a terminal target.
 */
async function advancePastHiddenStep(
  ctx: TourEngineContext,
  step: TourStep,
  cursor: number,
  tour: Tour,
  stepIdLookup: Map<string, number>
): Promise<number | 'terminate'> {
  const state = ctx.getState()
  const data = ctx.getData()
  const baseCtx = buildCallbackContext(state, tour, data)
  const stepCtx: TourCallbackContext = {
    ...baseCtx,
    currentStepIndex: cursor,
    currentStep: step,
  }
  await step.onEnter?.(stepCtx)
  await step.onShow?.(stepCtx)

  if (step.onNext === undefined || step.onNext === null) {
    return cursor + 1
  }

  const branchCtx: BranchContext = { ...stepCtx, setData: ctx.setData }
  const target = await resolveBranch(step.onNext, branchCtx)

  if (target === 'complete' || target === 'skip') {
    return 'terminate'
  }

  const idx = resolveTargetToIndex(target, cursor, stepIdLookup, tour.steps.length)
  return idx ?? cursor + 1
}

/**
 * Route-aware step navigation.
 *
 * Walks past hidden steps (firing their `onEnter` / `onShow` lifecycle) until
 * a mountable step is reached, then dispatches `GO_TO_STEP`. Throws
 * `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })` when the hidden chain
 * exceeds `ctx.maxHiddenChain`.
 *
 * Per-step `routeChangeStrategy`:
 * - `'auto'` (default): navigate, await target via `waitForStepTarget`,
 *   dispatch. On `TourRouteError`: fire `onStepError`, `STOP_TOUR`.
 * - `'prompt'`: fire `onNavigationRequired(route, stepId)`, do not dispatch.
 * - `'manual'`: do nothing — consumer drives navigation explicitly.
 *
 * `autoNavigate: false` (legacy) is equivalent to per-step `'prompt'`.
 *
 * @returns `true` on a successful synchronous-or-route-based dispatch, `false`
 *   when navigation is deferred to the consumer or aborted, throws on a
 *   hidden-step loop.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: hidden-traversal + route navigation in one orchestrator
export async function navigateToStepImpl(
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

      if (strategy === 'manual') {
        return false
      }

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

    const next = await advancePastHiddenStep(ctx, step, cursor, currentTour, localStepIdMap)
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
