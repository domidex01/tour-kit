import { describe, expect, it, vi } from 'vitest'
import type { BranchContext } from '../../../types'
import { handleBranchTargetImpl } from '../handle-branch-target'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { makeTour, visibleStep } from './_helpers/make-tour'

const noopBranchCtx = {} as BranchContext

describe('handleBranchTargetImpl', () => {
  describe('null target', () => {
    it('clears the transitioning flag and returns', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, isTransitioning: true },
      })

      await handleBranchTargetImpl(handle.ctx, null, noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
    })

    it('no-ops when there is no current tour', async () => {
      const handle = createFakeEngineContext({ currentTour: null })
      await handleBranchTargetImpl(handle.ctx, null, noopBranchCtx)
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })

    it('no-ops when there is no current step', async () => {
      const tour = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({ currentTour: tour, state: { currentStep: null } })
      await handleBranchTargetImpl(handle.ctx, null, noopBranchCtx)
      expect(handle.mocks.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('terminal targets', () => {
    it('"complete" calls completeTour exactly once', async () => {
      const tour = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null },
      })
      await handleBranchTargetImpl(handle.ctx, 'complete', noopBranchCtx)
      expect(handle.mocks.completeTour).toHaveBeenCalledTimes(1)
      expect(handle.mocks.skipTour).not.toHaveBeenCalled()
    })

    it('"skip" calls skipTour exactly once', async () => {
      const tour = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null },
      })
      await handleBranchTargetImpl(handle.ctx, 'skip', noopBranchCtx)
      expect(handle.mocks.skipTour).toHaveBeenCalledTimes(1)
      expect(handle.mocks.completeTour).not.toHaveBeenCalled()
    })

    it('"restart" dispatches GO_TO_STEP 0 and tracks step visit', async () => {
      const tour = makeTour('t1', [visibleStep('first'), visibleStep('second')])
      const onStepView = vi.fn()
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[1] ?? null, currentStepIndex: 1 },
        tourKitContext: { onStepView },
      })

      await handleBranchTargetImpl(handle.ctx, 'restart', noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'CLEAR_VISIT_TRACKING' })
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO_STEP', stepIndex: 0 })
      expect(handle.mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRACK_STEP_VISIT', stepId: 'first' })
      )
      expect(onStepView).toHaveBeenCalledWith('t1', 'first', 0)
    })
  })

  describe('cross-tour branch', () => {
    it('missing target tour — warns via dispatch and clears transitioning', async () => {
      const tour = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null },
      })

      await handleBranchTargetImpl(handle.ctx, { tour: 'does-not-exist' }, noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
      expect(handle.mocks.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'START_TOUR' })
      )
    })

    it('named step in target tour — STOP_TOUR then START_TOUR with resolved index', async () => {
      const target = makeTour('t2', [visibleStep('step-x'), visibleStep('step-y')])
      const source = makeTour('t1', [visibleStep('a')])
      const onTourBranch = vi.fn()
      const onTourStart = vi.fn()
      const handle = createFakeEngineContext({
        currentTour: source,
        state: {
          currentStep: source.steps[0] ?? null,
          tours: new Map([
            ['t1', source],
            ['t2', target],
          ]),
        },
        tourKitContext: { onTourBranch, onTourStart },
      })

      // Pre-arm the terminal-callback guards as if the source tour had already
      // completed once; the cross-tour branch MUST clear them so the new tour
      // can fire its own onComplete / onSkip later.
      handle.ctx.completedTourIdRef.current = 't1'
      handle.ctx.skippedTourIdRef.current = 't1'

      await handleBranchTargetImpl(handle.ctx, { tour: 't2', step: 'step-y' }, noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({ type: 'STOP_TOUR' })
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'START_TOUR',
        tourId: 't2',
        stepIndex: 1,
      })
      expect(onTourBranch).toHaveBeenCalledWith('t1', 't2', 'a')
      expect(onTourStart).toHaveBeenCalledWith('t2')
      // Now meaningful: refs were 't1', should have been cleared to null.
      expect(handle.ctx.completedTourIdRef.current).toBeNull()
      expect(handle.ctx.skippedTourIdRef.current).toBeNull()
    })

    it('numeric step in target tour — resolves directly', async () => {
      const target = makeTour('t2', [visibleStep('x'), visibleStep('y'), visibleStep('z')])
      const source = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({
        currentTour: source,
        state: {
          currentStep: source.steps[0] ?? null,
          tours: new Map([
            ['t1', source],
            ['t2', target],
          ]),
        },
      })

      await handleBranchTargetImpl(handle.ctx, { tour: 't2', step: 2 }, noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'START_TOUR',
        tourId: 't2',
        stepIndex: 2,
      })
    })
  })

  describe('BranchWait', () => {
    it('waits then chains the `then` target', async () => {
      const tour = makeTour('t1', [visibleStep('a')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null },
      })

      // biome-ignore lint/suspicious/noThenProperty: BranchWait's `then` is the public branching API
      await handleBranchTargetImpl(handle.ctx, { wait: 1, then: 'complete' }, noopBranchCtx)

      expect(handle.mocks.completeTour).toHaveBeenCalledTimes(1)
    })
  })

  describe('current-index target', () => {
    it('target resolves to current index → clears transitioning, no navigation', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['a', 0],
          ['b', 1],
        ]),
      })

      await handleBranchTargetImpl(handle.ctx, 'a', noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
      expect(handle.mocks.navigateToStep).not.toHaveBeenCalled()
    })
  })

  describe('loop detection', () => {
    it('targeting a step that exceeds maxVisits → clears transitioning, no nav', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const stepVisitCount = new Map<string, number>([['b', 10]])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0, stepVisitCount },
        stepIdMap: new Map([
          ['a', 0],
          ['b', 1],
        ]),
      })

      await handleBranchTargetImpl(handle.ctx, 'b', noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
      expect(handle.mocks.navigateToStep).not.toHaveBeenCalled()
    })
  })

  describe('when-condition false', () => {
    it('target.when returns false AND next visible step exists → navigates to next visible', async () => {
      const tour = makeTour('t1', [
        visibleStep('current'),
        visibleStep('target', { when: () => false }),
        visibleStep('next-visible'),
      ])
      const onStepView = vi.fn()
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['current', 0],
          ['target', 1],
          ['next-visible', 2],
        ]),
        tourKitContext: { onStepView },
      })

      await handleBranchTargetImpl(handle.ctx, 'target', noopBranchCtx)

      expect(handle.mocks.navigateToStep).toHaveBeenCalledWith(2)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRACK_STEP_VISIT', stepId: 'next-visible' })
      )
      expect(onStepView).toHaveBeenCalledWith('t1', 'next-visible', 2)
    })

    it('target.when returns false AND no visible step exists → completeTour', async () => {
      const tour = makeTour('t1', [
        visibleStep('current'),
        visibleStep('target', { when: () => false }),
        visibleStep('tail', { when: () => false }),
      ])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['current', 0],
          ['target', 1],
          ['tail', 2],
        ]),
      })

      await handleBranchTargetImpl(handle.ctx, 'target', noopBranchCtx)

      expect(handle.mocks.completeTour).toHaveBeenCalledTimes(1)
    })
  })

  describe('successful target navigation', () => {
    it('tracks step view and calls onStepChange', async () => {
      const onStepChange = vi.fn()
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b', { onShow: undefined })], {
        onStepChange,
      })
      const onStepView = vi.fn()
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['a', 0],
          ['b', 1],
        ]),
        tourKitContext: { onStepView },
      })

      await handleBranchTargetImpl(handle.ctx, 'b', noopBranchCtx)

      expect(handle.mocks.navigateToStep).toHaveBeenCalledWith(1)
      expect(handle.mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRACK_STEP_VISIT',
          stepId: 'b',
          previousStepId: 'a',
        })
      )
      expect(onStepView).toHaveBeenCalledWith('t1', 'b', 1)
      expect(onStepChange).toHaveBeenCalledTimes(1)
    })

    it('navigateToStep returns false → clear transitioning, no step-view tracking', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['a', 0],
          ['b', 1],
        ]),
        navigateToStep: () => Promise.resolve(false),
      })

      await handleBranchTargetImpl(handle.ctx, 'b', noopBranchCtx)

      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
      expect(handle.mocks.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRACK_STEP_VISIT' })
      )
    })
  })

  describe('stale closure regression (US-5)', () => {
    it('BranchWait recursion sees state mutations applied during the wait', async () => {
      // Outer call enters at currentStepIndex=0 with target=BranchWait→'b'.
      // During the wait we mutate state so currentStepIndex moves to 1.
      // When the recursion resolves 'b' to index 1 it MUST compare against
      // the fresh currentStepIndex (1), triggering the current-index path
      // (SET_TRANSITIONING false, no navigation). If state were stale, the
      // recursion would see index 0 and instead dispatch navigation to 1.
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b'), visibleStep('c')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
        stepIdMap: new Map([
          ['a', 0],
          ['b', 1],
          ['c', 2],
        ]),
      })

      const pending = handleBranchTargetImpl(
        handle.ctx,
        // biome-ignore lint/suspicious/noThenProperty: BranchWait's `then` is the public branching API
        { wait: 20, then: 'b' },
        noopBranchCtx
      )

      // Wait long enough for the outer setTimeout to be in flight, then
      // mutate state mid-wait.
      await new Promise((r) => setTimeout(r, 5))
      handle.setState({ currentStep: tour.steps[1] ?? null, currentStepIndex: 1 })

      await pending

      // Recursion's target ('b' → index 1) equals fresh currentStepIndex (1),
      // so the current-index short-circuit fires.
      expect(handle.mocks.dispatch).toHaveBeenCalledWith({
        type: 'SET_TRANSITIONING',
        isTransitioning: false,
      })
      expect(handle.mocks.navigateToStep).not.toHaveBeenCalled()
    })

    it('getter returns latest state when invoked from a captured ctx', () => {
      // Sanity check on the engine-context contract itself: a ctx captured
      // before a mutation MUST observe the mutation on the next getState().
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const handle = createFakeEngineContext({
        currentTour: tour,
        state: { currentStep: tour.steps[0] ?? null, currentStepIndex: 0 },
      })
      const capturedCtx = handle.ctx
      handle.setState({ currentStepIndex: 1 })
      expect(capturedCtx.getState().currentStepIndex).toBe(1)
    })
  })
})
