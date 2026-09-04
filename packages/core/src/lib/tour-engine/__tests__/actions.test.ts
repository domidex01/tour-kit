/**
 * v2 §1.3d — the tour's verbs, driven directly against the port.
 *
 * What these tests own is the *dispatch sequence and callback fan-out* of each
 * action. What they deliberately do NOT re-test is `navigateToStepImpl` and
 * `handleBranchTargetImpl` — those have 34 tests of their own. Here we assert
 * that the actions call them with the right arguments (spying on
 * `ctx.navigateToStep`).
 *
 * The two idempotency guards on the terminal paths get the most attention.
 * `completeTourImpl` / `skipTourImpl` are the single source of truth for all
 * four ways a tour can end — public `complete()`, `next()` at the last step, a
 * branch resolving to 'complete', and the no-visible-step auto-finish — and
 * they guard twice: a ref against a synchronous stale-closure double-call, and
 * `state.isActive` against re-firing after COMPLETE_TOUR.
 */
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tour } from '../../../types/tour'
import { logger } from '../../../utils/logger'
import {
  completeTourImpl,
  goToImpl,
  goToStepImpl,
  nextImpl,
  prevImpl,
  resetImpl,
  setDontShowAgainImpl,
  skipTourImpl,
  startImpl,
  startTourImpl,
  stopImpl,
  triggerBranchActionImpl,
} from '../actions'
import type { TourEngineAnalytics } from '../context'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'

type Handle = ReturnType<typeof createFakeEngineContext>

const THREE = makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])

/** An engine context sitting on `tour` at `stepIndex`, active. */
function on(
  tour: Tour,
  stepIndex = 0,
  overrides: Parameters<typeof createFakeEngineContext>[0] = {}
): Handle {
  const handle = createFakeEngineContext(overrides)
  handle.setCurrentTour(tour)
  handle.setState({
    tourId: tour.id,
    isActive: true,
    currentStepIndex: stepIndex,
    currentStep: tour.steps[stepIndex] ?? null,
    totalSteps: tour.steps.length,
  })
  return handle
}

const typesOf = (dispatch: { mock: { calls: unknown[][] } }) =>
  dispatch.mock.calls.map((c) => (c[0] as { type: string }).type)

describe('start', () => {
  it('dispatches START_TOUR at the first visible step and fires onTourStart', async () => {
    const onTourStart = vi.fn()
    const onStart = vi.fn()
    const tour = makeTour('t', [visibleStep('a')], { onStart })
    const { ctx, mocks } = on(tour, 0, { tourKitContext: { onTourStart } })

    await startImpl(ctx, 't')

    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: 'START_TOUR',
      tourId: 't',
      stepIndex: 0,
    })
    expect(onTourStart).toHaveBeenCalledWith('t')
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('defaults to the first registered tour when no id is given', async () => {
    const { ctx, mocks } = on(THREE)

    await startImpl(ctx)

    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ tourId: 't' }))
  })

  it('honours the tour startAt when no explicit index is given', async () => {
    const { ctx, mocks } = on(makeTour('t', [visibleStep('a'), visibleStep('b')], { startAt: 1 }))

    await startImpl(ctx, 't')

    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ stepIndex: 1 }))
  })

  it('skips forward past a leading when:false step', async () => {
    const tour = makeTour('t', [visibleStep('a', { when: () => false }), visibleStep('b')])
    const { ctx, mocks } = on(tour)

    await startImpl(ctx, 't')

    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ stepIndex: 1 }))
  })

  it('warns and dispatches nothing when no step is visible', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const tour = makeTour('t', [visibleStep('a', { when: () => false })])
    const { ctx, mocks } = on(tour)

    await startImpl(ctx, 't')

    expect(warn).toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('does nothing for an unregistered tour id', async () => {
    const { ctx, mocks } = on(THREE)

    await startImpl(ctx, 'nope')

    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('re-arms both terminal guards so a restarted tour can complete again', async () => {
    const { ctx } = on(THREE)
    ctx.completedTourIdRef.current = 't'
    ctx.skippedTourIdRef.current = 't'

    await startImpl(ctx, 't')

    expect(ctx.completedTourIdRef.current).toBeNull()
    expect(ctx.skippedTourIdRef.current).toBeNull()
  })
})

describe('next', () => {
  it('navigates to the following step and tracks the visit', async () => {
    const onStepView = vi.fn()
    const { ctx, mocks } = on(THREE, 0, { tourKitContext: { onStepView } })

    await nextImpl(ctx)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(1)
    expect(typesOf(mocks.dispatch)).toContain('TRACK_STEP_VISIT')
    expect(onStepView).toHaveBeenCalledWith('t', 'b', 1)
  })

  it('skips a when:false step on the way forward', async () => {
    const tour = makeTour('t', [
      visibleStep('a'),
      visibleStep('b', { when: () => false }),
      visibleStep('c'),
    ])
    const { ctx, mocks } = on(tour, 0)

    await nextImpl(ctx)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(2)
  })

  it('does nothing when the tour is not active', async () => {
    const handle = on(THREE)
    handle.setState({ isActive: false })

    await nextImpl(handle.ctx)

    expect(handle.mocks.dispatch).not.toHaveBeenCalled()
  })

  it('resets isTransitioning when navigation is declined', async () => {
    const { ctx, mocks } = on(THREE, 0, { navigateToStep: () => Promise.resolve(false) })

    await nextImpl(ctx)

    expect(mocks.dispatch).toHaveBeenLastCalledWith({
      type: 'SET_TRANSITIONING',
      isTransitioning: false,
    })
  })

  it('takes the branch path when the step declares onNext, without navigating', async () => {
    const tour = makeTour('t', [visibleStep('a', { onNext: 'skip' }), visibleStep('b')])
    const { ctx, mocks } = on(tour, 0)

    await nextImpl(ctx)

    expect(mocks.navigateToStep).not.toHaveBeenCalled()
    expect(mocks.skipTour).toHaveBeenCalledTimes(1)
  })
})

describe('terminal paths fire exactly once', () => {
  let handle: Handle
  let onComplete: Mock<NonNullable<Tour['onComplete']>>

  beforeEach(() => {
    onComplete = vi.fn()
    handle = on(makeTour('t', [visibleStep('a'), visibleStep('b')], { onComplete }), 1, {
      persistTerminalTours: true,
    })
    // Route completion through the real impl rather than the fake's spy — the
    // guards under test live in `completeTourImpl`, not in the ctx wiring.
    handle.ctx.completeTour = () => completeTourImpl(handle.ctx)
  })

  it('next() twice on the last step completes once', async () => {
    await nextImpl(handle.ctx)
    await nextImpl(handle.ctx)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(handle.mocks.markCompleted).toHaveBeenCalledExactlyOnceWith('t')
  })

  it('the ref guard alone stops a synchronous double-call', () => {
    // `state.isActive` is still true here (the fake does not run the reducer),
    // so only `completedTourIdRef` can be doing the work.
    completeTourImpl(handle.ctx)
    completeTourImpl(handle.ctx)

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('the isActive guard stops a re-fire after COMPLETE_TOUR landed', () => {
    handle.ctx.completedTourIdRef.current = null
    handle.setState({ isActive: false })

    completeTourImpl(handle.ctx)

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('completing clears the route blob so a finished tour cannot resume', () => {
    completeTourImpl(handle.ctx)

    expect(handle.mocks.clearRouteState).toHaveBeenCalledTimes(1)
  })

  it('skip mirrors complete: once, persisted, route blob cleared', () => {
    const onSkip = vi.fn()
    const onTourSkip = vi.fn()
    const h = on(makeTour('t', [visibleStep('a')], { onSkip }), 0, {
      persistTerminalTours: true,
      tourKitContext: { onTourSkip } satisfies TourEngineAnalytics,
    })

    skipTourImpl(h.ctx)
    skipTourImpl(h.ctx)

    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(h.mocks.markSkipped).toHaveBeenCalledExactlyOnceWith('t')
    expect(onTourSkip).toHaveBeenCalledExactlyOnceWith('t', 0)
    expect(h.mocks.clearRouteState).toHaveBeenCalledTimes(1)
  })

  it('does not touch the terminal store when persistTerminalTours is off', () => {
    const h = on(makeTour('t', [visibleStep('a')]), 0, { persistTerminalTours: false })

    completeTourImpl(h.ctx)

    expect(h.mocks.markCompleted).not.toHaveBeenCalled()
    expect(typesOf(h.mocks.dispatch)).toContain('ADD_COMPLETED')
  })
})

describe('prev', () => {
  it('navigates back one step', async () => {
    const { ctx, mocks } = on(THREE, 1)

    await prevImpl(ctx)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(0)
  })

  it('does nothing at the first step', async () => {
    const { ctx, mocks } = on(THREE, 0)

    await prevImpl(ctx)

    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('onPrev: null disables going back entirely', async () => {
    const tour = makeTour('t', [visibleStep('a'), visibleStep('b', { onPrev: null })])
    const { ctx, mocks } = on(tour, 1)

    await prevImpl(ctx)

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(mocks.navigateToStep).not.toHaveBeenCalled()
  })

  it('skips a when:false step on the way back', async () => {
    const tour = makeTour('t', [
      visibleStep('a'),
      visibleStep('b', { when: () => false }),
      visibleStep('c'),
    ])
    const { ctx, mocks } = on(tour, 2)

    await prevImpl(ctx)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(0)
  })
})

describe('goTo / goToStep', () => {
  it('navigates straight to a visible index', async () => {
    const { ctx, mocks } = on(THREE, 0)

    await goToImpl(ctx, 2)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(2)
  })

  it('lands on the nearest visible step when the target is when:false', async () => {
    const tour = makeTour('t', [
      visibleStep('a'),
      visibleStep('b', { when: () => false }),
      visibleStep('c'),
    ])
    const { ctx, mocks } = on(tour, 0)

    await goToImpl(ctx, 1)

    expect(mocks.navigateToStep).toHaveBeenCalledWith(2)
  })

  it('does nothing for an out-of-range index', async () => {
    const { ctx, mocks } = on(THREE, 0)

    await goToImpl(ctx, 99)

    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('goToStep resolves the id through the step map', async () => {
    const { ctx, mocks } = on(THREE, 0)

    await goToStepImpl(ctx, 'c')

    expect(mocks.navigateToStep).toHaveBeenCalledWith(2)
  })

  it('goToStep warns and no-ops on an unknown id', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { ctx, mocks } = on(THREE, 0)

    await goToStepImpl(ctx, 'nope')

    expect(warn).toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })
})

describe('startTour', () => {
  it('resolves a string step id to its index in the TARGET tour', async () => {
    const other = makeTour('other', [visibleStep('o1'), visibleStep('o2')])
    const handle = on(THREE, 0)
    handle.setState({
      tours: new Map([
        ['t', THREE],
        ['other', other],
      ]),
    })

    await startTourImpl(handle.ctx, 'other', 'o2')

    expect(handle.mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'START_TOUR', tourId: 'other', stepIndex: 1 })
    )
  })

  it('accepts a numeric step index unchanged', async () => {
    const other = makeTour('other', [visibleStep('o1'), visibleStep('o2')])
    const handle = on(THREE, 0)
    handle.setState({
      tours: new Map([
        ['t', THREE],
        ['other', other],
      ]),
    })

    await startTourImpl(handle.ctx, 'other', 1)

    expect(handle.mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ tourId: 'other', stepIndex: 1 })
    )
  })

  it('warns and no-ops for an unknown tour', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { ctx, mocks } = on(THREE, 0)

    await startTourImpl(ctx, 'nope')

    expect(warn).toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })
})

describe('triggerBranchAction', () => {
  it('fires both analytics hooks then hands off to the branch handler', async () => {
    const onBranchAction = vi.fn()
    const tourOnBranchAction = vi.fn()
    const tour = makeTour('t', [visibleStep('a', { onAction: { go: 'skip' } })], {
      onBranchAction: tourOnBranchAction,
    })
    const { ctx, mocks } = on(tour, 0, { tourKitContext: { onBranchAction } })

    await triggerBranchActionImpl(ctx, 'go', { n: 1 })

    expect(onBranchAction).toHaveBeenCalledWith('t', 'a', 'go', 'skip')
    expect(tourOnBranchAction).toHaveBeenCalledWith('a', 'go', 'skip')
    expect(mocks.skipTour).toHaveBeenCalledTimes(1)
  })

  it('warns and no-ops for an action the step does not declare', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { ctx, mocks } = on(THREE, 0)

    await triggerBranchActionImpl(ctx, 'nope')

    expect(warn).toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('passes the payload through to the branch resolver', async () => {
    const resolver = vi.fn(() => 'skip' as const)
    const tour = makeTour('t', [visibleStep('a', { onAction: { go: resolver } })])
    const { ctx } = on(tour, 0)

    await triggerBranchActionImpl(ctx, 'go', { n: 7 })

    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'go', actionPayload: { n: 7 } })
    )
  })
})

describe('stop / reset / setDontShowAgain', () => {
  it('stop dispatches STOP_TOUR and nothing else', () => {
    const { ctx, mocks } = on(THREE, 0)

    stopImpl(ctx)

    expect(mocks.dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'STOP_TOUR' })
  })

  it('reset clears persistence only when persistTerminalTours is on', () => {
    const off = on(THREE, 0, { persistTerminalTours: false })
    resetImpl(off.ctx, 't')
    expect(off.mocks.resetPersistence).not.toHaveBeenCalled()
    expect(off.mocks.dispatch).toHaveBeenCalledWith({ type: 'RESET', tourId: 't' })

    const onPersist = on(THREE, 0, { persistTerminalTours: true })
    resetImpl(onPersist.ctx, 't')
    expect(onPersist.mocks.resetPersistence).toHaveBeenCalledWith('t')
  })

  it('setDontShowAgain is still a no-op — moved as-is, not wired', () => {
    // `createTerminalStore` implements the storage half and nothing calls it
    // (`tour-provider.tsx:1120`). Wiring it is a behaviour change; a refactor
    // is not where that lands. This test exists so a future wiring is a
    // deliberate edit rather than a silent one.
    const { ctx, mocks } = on(THREE, 0)

    setDontShowAgainImpl(ctx, 't', true)

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(mocks.markCompleted).not.toHaveBeenCalled()
  })
})

describe('hidden steps', () => {
  it('start walks past a hidden step to the first visible one', async () => {
    const tour = makeTour('t', [hiddenStep('h'), visibleStep('a')])
    const { ctx, mocks } = on(tour, 0)

    await startImpl(ctx, 't')

    // Hidden steps have no `when`, so they are "visible" to the resolver and
    // navigateToStep is what hops them. start() lands on index 0.
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ stepIndex: 0 }))
  })
})
