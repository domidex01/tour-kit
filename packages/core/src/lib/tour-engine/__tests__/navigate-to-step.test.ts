import { describe, expect, it, vi } from 'vitest'
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
