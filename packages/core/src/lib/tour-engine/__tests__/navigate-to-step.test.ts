import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourValidationError } from '../../validate-tour'
import { TourRouteError } from '../../wait-for-step-target'
import { navigateToStepImpl } from '../navigate-to-step'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'

describe('navigateToStepImpl', () => {
  describe('no current tour', () => {
    it('dispatches GO_TO_STEP and returns true', async () => {
      const handle = createFakeEngineContext({ currentTour: null })
      const result = await navigateToStepImpl(handle.ctx, 3)
      expect(result).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 3 })
    })
  })

  describe('visible step without route', () => {
    it('dispatches GO_TO_STEP synchronously', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({ currentTour: tour })
      const result = await navigateToStepImpl(handle.ctx, 1)
      expect(result).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 1 })
    })
  })

  describe('autoNavigate: false', () => {
    it('fires onNavigationRequired and does not dispatch', async () => {
      const tour = makeTour('t1', [visibleStep('a', { route: '/about' })])
      const handle = createFakeEngineContext({ currentTour: tour, autoNavigate: false })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onNavigationRequired).toHaveBeenCalledWith('/about', 'a')
      expect(handle.mocks.router.navigate).not.toHaveBeenCalled()
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('routeChangeStrategy: "manual"', () => {
    it('returns false without firing any side effects', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { route: '/about', routeChangeStrategy: 'manual' }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onNavigationRequired).not.toHaveBeenCalled()
      expect(handle.mocks.router.navigate).not.toHaveBeenCalled()
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('routeChangeStrategy: "prompt"', () => {
    it('fires onNavigationRequired', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { route: '/about', routeChangeStrategy: 'prompt' }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onNavigationRequired).toHaveBeenCalledWith('/about', 'a')
      expect(handle.mocks.router.navigate).not.toHaveBeenCalled()
    })
  })

  describe('routeChangeStrategy: "auto"', () => {
    it('navigates, waits for target, then dispatches GO_TO_STEP', async () => {
      // waitForStepTarget resolves immediately when the step has no target
      // selector — pass a target/content but stub the document query via JSDOM
      const tour = makeTour('t1', [visibleStep('a', { route: '/about', target: '#exists' })])
      document.body.innerHTML = '<div id="exists"></div>'
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(true)
      expect(handle.mocks.router.navigate).toHaveBeenCalledWith('/about')
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 0 })

      document.body.innerHTML = ''
    })

    it('router returning false → throws NAVIGATION_REJECTED, onStepError, STOP_TOUR', async () => {
      const tour = makeTour('t1', [visibleStep('a', { route: '/about', target: '#x' })])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)
      handle.mocks.router.navigate.mockResolvedValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onStepError).toHaveBeenCalledTimes(1)
      const err = handle.mocks.onStepError.mock.calls[0]?.[0]
      expect(err).toBeInstanceOf(TourRouteError)
      expect((err as TourRouteError).code).toBe('NAVIGATION_REJECTED')
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'STOP_TOUR' })
    })

    it('waitForStepTarget times out → onStepError(TARGET_NOT_FOUND), STOP_TOUR', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { route: '/about', target: '#never', waitTimeout: 50 }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onStepError).toHaveBeenCalledTimes(1)
      const err = handle.mocks.onStepError.mock.calls[0]?.[0]
      expect(err).toBeInstanceOf(TourRouteError)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'STOP_TOUR' })
    })
  })

  describe('abort signal already aborted', () => {
    it('returns false silently — no onStepError', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { route: '/about', target: '#never', waitTimeout: 100 }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour, preAborted: true })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 0)

      expect(result).toBe(false)
      expect(handle.mocks.onStepError).not.toHaveBeenCalled()
      expect(handle.mocks.dispatch).not.toHaveBeenCalledWith({ type: 'STOP_TOUR' })
    })
  })

  describe('hidden step without branch', () => {
    it('advances cursor past hidden step to the next visible step', async () => {
      const onEnter = vi.fn()
      const onShow = vi.fn()
      const tour = makeTour('t1', [
        visibleStep('start'),
        hiddenStep('h1', { onEnter, onShow }),
        visibleStep('after-hidden'),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      const result = await navigateToStepImpl(handle.ctx, 1)

      expect(result).toBe(true)
      expect(onEnter).toHaveBeenCalled()
      expect(onShow).toHaveBeenCalled()
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 2 })
    })

    it('hidden step with onNext "complete" → walks past end of steps and returns false', async () => {
      const tour = makeTour('t1', [
        visibleStep('a'),
        hiddenStep('h1', { onNext: 'complete' }),
        visibleStep('z'),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      const result = await navigateToStepImpl(handle.ctx, 1)

      expect(result).toBe(false)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'GO_TO_STEP',
        stepIndex: tour.steps.length,
      })
    })
  })

  describe('hidden chain enforcement', () => {
    it('exceeding maxHiddenChain throws HIDDEN_STEP_LOOP', async () => {
      // Build a tour of N+2 hidden steps with onNext: 'next' so the loop walks
      // the whole chain. maxHiddenChain=3 → cursor visits 0,1,2,3 (4 iterations,
      // chain index reaches 3 which is the loop tail) and throws.
      const max = 3
      const steps = Array.from({ length: max + 2 }, (_, i) =>
        hiddenStep(`h${i}`, { onNext: 'next' })
      )
      const tour = makeTour('t1', steps)
      const handle = createFakeEngineContext({ currentTour: tour, maxHiddenChain: max })

      await expect(navigateToStepImpl(handle.ctx, 0)).rejects.toBeInstanceOf(TourValidationError)
    })
  })
})

/**
 * Issue #121 — Group A: the pre-commit guards, and where they sit.
 *
 * This is the PLACEMENT unit, not the order oracle. `dispatch` here is a
 * `vi.fn`, so nothing observable happens after the commit — Group B
 * (`onHide`/`onShow`) lives in `applyTransitionEffects` and is tested through
 * the real engine instead. What this file owns is *which* side effects have
 * and have not happened by the time a guard vetoes.
 *
 * Every `onBeforeHide` case passes `state.currentStep` explicitly:
 * `createFakeEngineContext` defaults it to `null`, and the impl reads the
 * outgoing step from `ctx.getState().currentStep`. Without it the case would
 * assert `false` against a callback that never ran — green for the wrong
 * reason. (That default is also why the 17 route/strategy cases above are
 * unchanged by this phase: they are the regression oracle for the restructure.)
 */
describe('navigateToStepImpl — step lifecycle guards (#121)', () => {
  const callOrder: string[] = []

  const note = (name: string, id: string) => () => {
    callOrder.push(`${name}:${id}`)
    return undefined
  }
  const veto = (name: string, id: string) => () => {
    callOrder.push(`${name}:${id}`)
    return false as const
  }

  /** A handle whose dispatch mock records into the shared order array. */
  function orderingHandle(...args: Parameters<typeof createFakeEngineContext>) {
    const handle = createFakeEngineContext(...args)
    handle.mocks.dispatch.mockImplementation((action: { type: string }) => {
      callOrder.push(`dispatch:${action.type}`)
    })
    return handle
  }

  beforeEach(() => {
    callOrder.length = 0
  })

  afterEach(() => {
    // The in-tree idiom from `__tests__/lib/wait-for-step-target.test.ts` — a
    // bare `useRealTimers()` leaves queued timers behind, and most cases in
    // this file never enable fake timers at all.
    if (vi.isFakeTimers?.()) {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
    document.body.innerHTML = ''
  })

  describe('onBeforeHide (the outgoing step)', () => {
    it('a literal false returns false and never dispatches', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { onBeforeHide: veto('onBeforeHide', 'a') }),
        visibleStep('b'),
      ])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      const result = await navigateToStepImpl(handle.ctx, 1)

      expect(result).toBe(false)
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
      expect(callOrder).toEqual(['onBeforeHide:a'])
    })

    it('a veto walks no hidden steps — it runs before the traversal', async () => {
      // The guard sits at entry, before the hidden walk, so a vetoed
      // transition must not have run any hidden step's onEnter along the way.
      const hiddenEnter = vi.fn()
      const tour = makeTour('t1', [
        visibleStep('a', { onBeforeHide: veto('onBeforeHide', 'a') }),
        hiddenStep('h', { onEnter: hiddenEnter }),
        visibleStep('b'),
      ])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      const result = await navigateToStepImpl(handle.ctx, 1)

      expect(result).toBe(false)
      expect(hiddenEnter).not.toHaveBeenCalled()
    })

    it('an async Promise<false> vetoes — the guard is awaited', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { onBeforeHide: async () => false as const }),
        visibleStep('b'),
      ])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(false)
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })

    it('a throwing guard is "no opinion" — the step still commits', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', {
          onBeforeHide: () => {
            throw new Error('consumer bug')
          },
        }),
        visibleStep('b'),
      ])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 1 })
    })
  })

  describe('onBeforeShow (the incoming step)', () => {
    it('a veto on a route-change step never calls router.navigate', async () => {
      // This is what proves the guard sits BEFORE the router, not after: a
      // veto must leave the user on the page they are already on.
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { route: '/about', onBeforeShow: veto('onBeforeShow', 'b') }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      const result = await navigateToStepImpl(handle.ctx, 1)

      expect(result).toBe(false)
      expect(handle.mocks.router.navigate).not.toHaveBeenCalled()
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })

    it('a veto on a same-route step returns false without dispatching', async () => {
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { onBeforeShow: veto('onBeforeShow', 'b') }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(false)
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })

    it('is not reached on a "prompt" step — the consumer drives that navigation', async () => {
      // The prompt/manual early returns come first: the transition is deferred,
      // not decided, so asking the incoming step's guard would be premature.
      const onBeforeShow = vi.fn()
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { route: '/about', routeChangeStrategy: 'prompt', onBeforeShow }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(false)
      expect(onBeforeShow).not.toHaveBeenCalled()
      expect(handle.mocks.onNavigationRequired).toHaveBeenCalledWith('/about', 'b')
    })

    it('a throwing guard logs and proceeds', async () => {
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', {
          onBeforeShow: () => {
            throw new Error('consumer bug')
          },
        }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 1 })
    })
  })

  describe('onEnter runs before the commit', () => {
    it('is awaited before GO_TO_STEP is dispatched', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { onBeforeHide: note('onBeforeHide', 'a') }),
        visibleStep('b', {
          onBeforeShow: note('onBeforeShow', 'b'),
          onEnter: async () => {
            await Promise.resolve()
            callOrder.push('onEnter:b')
          },
        }),
      ])
      const handle = orderingHandle({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      await navigateToStepImpl(handle.ctx, 1)

      expect(callOrder).toEqual([
        'onBeforeHide:a',
        'onBeforeShow:b',
        'onEnter:b',
        'dispatch:GO_TO_STEP',
      ])
    })

    it('runs after the router navigates, so it sees the page the step mounts on', async () => {
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { route: '/about', target: '#about-x', onEnter: note('onEnter', 'b') }),
      ])
      const handle = orderingHandle({ currentTour: tour })
      handle.mocks.router.matchRoute.mockReturnValue(false)
      handle.mocks.router.navigate.mockImplementation(async () => {
        callOrder.push('navigate')
        const el = document.createElement('div')
        el.id = 'about-x'
        document.body.appendChild(el)
        return undefined
      })

      await navigateToStepImpl(handle.ctx, 1)

      expect(callOrder).toEqual(['navigate', 'onEnter:b', 'dispatch:GO_TO_STEP'])
    })
  })

  describe('waitForTarget on the step’s own route', () => {
    it('commits once a late target appears', async () => {
      vi.useFakeTimers()
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { target: '#late', waitForTarget: true, waitTimeout: 1000 }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      const promise = navigateToStepImpl(handle.ctx, 1)
      setTimeout(() => {
        const el = document.createElement('div')
        el.id = 'late'
        document.body.appendChild(el)
      }, 200)
      await vi.advanceTimersByTimeAsync(250)

      expect(await promise).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 1 })
    })

    it('stops the tour with TARGET_NOT_FOUND when the target never appears', async () => {
      vi.useFakeTimers()
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { target: '#never', waitForTarget: true, waitTimeout: 1000 }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      const promise = navigateToStepImpl(handle.ctx, 1)
      await vi.advanceTimersByTimeAsync(1100)

      expect(await promise).toBe(false)
      expect(handle.mocks.onStepError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'TARGET_NOT_FOUND' })
      )
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'STOP_TOUR' })
      expect(handle.mocks.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'GO_TO_STEP' })
      )
    })

    it('is ignored on a targetless step — there is nothing to observe', async () => {
      // `waitForStepTarget` throws TARGET_NOT_FOUND *synchronously* for a null
      // resolve, so without the `&& step.target` gate every targetless modal
      // step carrying this flag would stop the tour instantly.
      const tour = makeTour('t1', [
        visibleStep('a'),
        visibleStep('b', { target: undefined, waitForTarget: true }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 1 })
      expect(handle.mocks.onStepError).not.toHaveBeenCalled()
    })

    it('a step without the flag does not wait, even when its target is missing', async () => {
      // The regression net under the restructure: `visibleStep` hard-codes
      // `target: '#x'`, which exists in no test document.
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({ currentTour: tour })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)
    })
  })

  describe('hidden steps keep their own lifecycle', () => {
    it('fires onEnter and onShow exactly once each on the way past', async () => {
      const onEnter = vi.fn()
      const onShow = vi.fn()
      const successorShow = vi.fn()
      const tour = makeTour('t1', [
        visibleStep('a'),
        hiddenStep('h', { onEnter, onShow }),
        visibleStep('b', { onShow: successorShow }),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)

      expect(onEnter).toHaveBeenCalledTimes(1)
      expect(onShow).toHaveBeenCalledTimes(1)
      // Group B lives in applyTransitionEffects, which this unit does not run.
      expect(successorShow).not.toHaveBeenCalled()
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 2 })
    })

    it('a throwing hidden onEnter is logged, not rethrown', async () => {
      // Before #121 these two were awaited directly rather than through
      // `invokeAsyncCallback`, so a throw here rejected the consumer's next()
      // and left isTransitioning stuck true — the bricked tour the callback
      // contract forbids.
      const tour = makeTour('t1', [
        visibleStep('a'),
        hiddenStep('h', {
          onEnter: () => {
            throw new Error('consumer bug')
          },
        }),
        visibleStep('b'),
      ])
      const handle = createFakeEngineContext({ currentTour: tour })

      await expect(navigateToStepImpl(handle.ctx, 1)).resolves.toBe(true)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 2 })
    })

    it('onBeforeHide is ignored on a hidden outgoing step', async () => {
      const onBeforeHide = vi.fn()
      const tour = makeTour('t1', [hiddenStep('h', { onBeforeHide }), visibleStep('b')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })

      expect(await navigateToStepImpl(handle.ctx, 1)).toBe(true)
      expect(onBeforeHide).not.toHaveBeenCalled()
    })
  })
})
