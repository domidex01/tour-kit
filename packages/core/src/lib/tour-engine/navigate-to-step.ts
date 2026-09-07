import type { BranchContext, TourCallbackContext } from '../../types'
import type { TourStep, VisibleTourStep } from '../../types/step'
import type { Tour } from '../../types/tour'
import { resolveBranch, resolveTargetToIndex } from '../../utils/branch'
import { TourValidationError } from '../validate-tour'
import { TourRouteError, waitForStepTarget } from '../wait-for-step-target'
import type { TourEngineContext } from './context'
import { buildCallbackContext, invokeAsyncCallback, isNavigationNeeded } from './helpers'

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
  // Through the fail-safe helper, not awaited directly: a throwing hidden
  // callback used to reject navigateToStepImpl and, through nextImpl, the
  // consumer's next() promise — leaving isTransitioning stuck true. No step
  // callback may brick the tour (#121).
  await invokeAsyncCallback('onEnter', () => step.onEnter?.(stepCtx))
  await invokeAsyncCallback('onShow', () => step.onShow?.(stepCtx))

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
 * Wait for a visible step's target, with the single copy of the failure
 * matrix both wait sites share.
 *
 * @returns `true` when the target resolved, `false` when the caller should
 *   unwind (aborted, or stopped with `TARGET_NOT_FOUND`). Rethrows anything
 *   that is not a `TourRouteError`.
 */
async function awaitTarget(
  ctx: TourEngineContext,
  step: VisibleTourStep,
  route: string
): Promise<boolean> {
  try {
    await waitForStepTarget(step, {
      route,
      timeoutMs: step.waitTimeout ?? 3000,
      signal: ctx.abortControllerRef.current?.signal,
    })
    return true
  } catch (err) {
    if (ctx.abortControllerRef.current?.signal.aborted) return false
    if (err instanceof TourRouteError) {
      ctx.onStepError?.(err)
      ctx.dispatch({ type: 'STOP_TOUR' })
      return false
    }
    throw err
  }
}

/**
 * Route-aware step navigation.
 *
 * Walks past hidden steps (firing their `onEnter` / `onShow` lifecycle) until
 * a mountable step is reached, then dispatches `GO_TO_STEP`. Throws
 * `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })` when the hidden chain
 * exceeds `ctx.maxHiddenChain`.
 *
 * Step lifecycle (#121) — the pre-commit half. `onBeforeHide(outgoing)` runs
 * at entry, so a veto walks no hidden steps and navigates nowhere;
 * `onBeforeShow(incoming)` runs once the visible step is resolved but before
 * the router moves, so a veto leaves the user on the page they are on; and
 * `onEnter(incoming)` runs last, after any navigation and target wait, so it
 * sees the page the step will mount on. Either guard returning a literal
 * `false` returns `false` from here, which every caller already unwinds. The
 * post-commit half (`onHide` / `onShow`) lives in `applyTransitionEffects`,
 * where all four commit paths pass.
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

  // The outgoing guard runs first, before the hidden walk and before any
  // navigation, so a veto is genuinely a no-op rather than a half-transition.
  const outgoing = ctx.getState().currentStep
  if (outgoing && outgoing.kind !== 'hidden') {
    const outgoingCtx = buildCallbackContext(ctx.getState(), currentTour, ctx.getData())
    const vetoed = await invokeAsyncCallback('onBeforeHide', () =>
      outgoing.onBeforeHide?.(outgoingCtx)
    )
    if (vetoed === false) return false
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
      const sameRoute = !needed || !step.route || !ctx.router

      // The deferred strategies come first: the transition is postponed, not
      // decided, so asking the incoming step's guard would be premature.
      // ponytail: a prompt/manual step therefore runs `onBeforeHide` once on
      // the deferred attempt and again when the consumer re-drives it. The
      // alternative — deferring the outgoing guard past the strategy check —
      // would let a hidden walk run ahead of a veto, which is worse.
      if (!sameRoute) {
        if (!ctx.autoNavigate || step.routeChangeStrategy === 'prompt') {
          ctx.onNavigationRequired?.(step.route as string, step.id)
          return false
        }
        if (step.routeChangeStrategy === 'manual') return false
      }

      const stepCtx: TourCallbackContext = {
        ...buildCallbackContext(ctx.getState(), currentTour, ctx.getData()),
        currentStepIndex: cursor,
        currentStep: step,
      }

      if (
        (await invokeAsyncCallback('onBeforeShow', () => step.onBeforeShow?.(stepCtx))) === false
      ) {
        return false
      }

      if (!sameRoute) {
        const route = step.route as string
        try {
          const navResult = await (ctx.router as NonNullable<typeof ctx.router>).navigate(route)
          if (navResult === false) {
            throw new TourRouteError({
              code: 'NAVIGATION_REJECTED',
              route,
              message: `Router rejected navigation to "${route}".`,
            })
          }

          if (step.routeDelay && step.routeDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, step.routeDelay))
          }
        } catch (err) {
          if (ctx.abortControllerRef.current?.signal.aborted) return false
          if (err instanceof TourRouteError) {
            ctx.onStepError?.(err)
            ctx.dispatch({ type: 'STOP_TOUR' })
            return false
          }
          throw err
        }
      }

      // A route change always waits — the target cannot exist before the
      // navigation. On the step's own route the author opts in, and only with
      // a target to observe: `waitForStepTarget` fails synchronously on a null
      // resolve, so a targetless modal step carrying the flag would otherwise
      // stop the tour instantly.
      if (!sameRoute || (step.waitForTarget && step.target)) {
        const route = sameRoute ? (ctx.router?.getCurrentRoute() ?? '') : (step.route as string)
        if (!(await awaitTarget(ctx, step, route))) return false
      }

      await invokeAsyncCallback('onEnter', () => step.onEnter?.(stepCtx))
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
