/**
 * v2 §1.3e — the side-effects a transition owes, driven with hand-built
 * snapshots.
 *
 * The point of taking `prev` and `next` explicitly is that every "did this
 * edge get crossed?" question becomes a comparison. Two of them are load-
 * bearing and were previously kept in sync by hand through a ref:
 *
 *  - the flow-blob clear fires ONLY on `isActive` true -> false. Clearing
 *    unconditionally would wipe a freshly restored blob the moment boot()
 *    dispatched START_TOUR, because the initial snapshot is inactive.
 *  - the cross-tab pause has a timestamp tie-break. Without it two tabs
 *    cold-restoring the same session at the same instant pause each other and
 *    the user sees no tour anywhere.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tourRegistry } from '../../../registry/tour-registry'
import type { TourCallbackContext } from '../../../types/state'
import type { Tour } from '../../../types/tour'
import { createBroadcast } from '../adapters/broadcast'
import type { CrossTabActiveMessage } from '../context'
import { applyTransitionEffects, subscribeCrossTabPause } from '../transition-effects'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { makeTour, visibleStep } from './_helpers/make-tour'

const TOUR = makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])

/** A snapshot; defaults to "inactive, nothing running". */
function snap(overrides: Partial<TourCallbackContext> = {}): TourCallbackContext {
  return {
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 0,
    isLoading: false,
    isTransitioning: false,
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tour: null,
    data: {},
    ...overrides,
  }
}

const active = (stepIndex = 0, tour: Tour = TOUR) =>
  snap({
    tourId: tour.id,
    isActive: true,
    currentStepIndex: stepIndex,
    currentStep: tour.steps[stepIndex] ?? null,
    totalSteps: tour.steps.length,
    tour,
  })

beforeEach(() => {
  tourRegistry.__reset__?.()
})

describe('route-state save', () => {
  it('saves when the tour is active and route persistence is on', () => {
    const { ctx, mocks } = createFakeEngineContext({ routePersistenceEnabled: true })

    applyTransitionEffects(ctx, snap(), active(1))

    expect(mocks.saveRouteState).toHaveBeenCalledWith(expect.objectContaining({ tourId: 't' }))
  })

  it('does not save when route persistence is off', () => {
    const { ctx, mocks } = createFakeEngineContext({ routePersistenceEnabled: false })

    applyTransitionEffects(ctx, snap(), active(1))

    expect(mocks.saveRouteState).not.toHaveBeenCalled()
  })

  it('does not save when the tour is not active', () => {
    const { ctx, mocks } = createFakeEngineContext({ routePersistenceEnabled: true })

    applyTransitionEffects(ctx, active(), snap())

    expect(mocks.saveRouteState).not.toHaveBeenCalled()
  })
})

describe('flow-session save', () => {
  it('saves the step index and the current route', () => {
    const { ctx, mocks } = createFakeEngineContext({
      flowSessionEnabled: true,
      router: { getCurrentRoute: () => '/pricing' },
    })

    applyTransitionEffects(ctx, active(0), active(2))

    expect(mocks.saveFlowSession).toHaveBeenCalledWith(2, '/pricing')
  })

  it('does not save when the flow session is not configured', () => {
    const { ctx, mocks } = createFakeEngineContext({ flowSessionEnabled: false })

    applyTransitionEffects(ctx, active(0), active(2))

    expect(mocks.saveFlowSession).not.toHaveBeenCalled()
  })
})

describe('an unchanged prev -> next is inert', () => {
  // The regression this pins: adapter A calls applyTransitionEffects on EVERY
  // commit, not once per reducer transition. Before the gates, a re-render
  // that changed nothing about the tour still wrote storage and announced to
  // every other tab — and because `subscribeCrossTabPause` stops any tab whose
  // own announce is older, a re-rendering tab paused tours in other tabs.
  const everythingOn = {
    routePersistenceEnabled: true,
    flowSessionEnabled: true,
    router: { getCurrentRoute: () => '/pricing' },
  }

  it('writes no storage and announces nothing when the snapshot did not move', () => {
    const { ctx, mocks } = createFakeEngineContext(everythingOn)
    const steady = active(1)

    // Five inert commits, exactly as five React re-renders would produce.
    for (let i = 0; i < 5; i++) applyTransitionEffects(ctx, steady, steady)

    expect(mocks.saveRouteState).not.toHaveBeenCalled()
    expect(mocks.saveFlowSession).not.toHaveBeenCalled()
    expect(mocks.announce).not.toHaveBeenCalled()
  })

  it('still fires once when the step actually advances', () => {
    const { ctx, mocks } = createFakeEngineContext(everythingOn)

    applyTransitionEffects(ctx, active(1), active(1))
    applyTransitionEffects(ctx, active(1), active(2))
    applyTransitionEffects(ctx, active(2), active(2))

    expect(mocks.saveRouteState).toHaveBeenCalledTimes(1)
    expect(mocks.saveFlowSession).toHaveBeenCalledExactlyOnceWith(2, '/pricing')
  })

  it('announces on activation, not on every commit while active', () => {
    const { ctx, mocks } = createFakeEngineContext(everythingOn)

    applyTransitionEffects(ctx, snap(), active(0))
    applyTransitionEffects(ctx, active(0), active(0))
    applyTransitionEffects(ctx, active(0), active(1))

    // Activation announces. A step move does not re-announce — ownership did
    // not change, and re-announcing perturbs the cross-tab tie-break.
    expect(mocks.announce).toHaveBeenCalledTimes(1)
  })
})

describe('flow-blob clear fires only on the true → false edge', () => {
  it('clears when an active tour becomes inactive', () => {
    const { ctx, mocks } = createFakeEngineContext({ flowSessionEnabled: true })

    applyTransitionEffects(ctx, active(1), snap())

    expect(mocks.clearFlowSession).toHaveBeenCalledTimes(1)
  })

  it('does NOT clear on false → true — this is the restore case', () => {
    // The regression this guards: an unconditional clear wipes the blob
    // boot() has just restored from, one tick after START_TOUR.
    const { ctx, mocks } = createFakeEngineContext({ flowSessionEnabled: true })

    applyTransitionEffects(ctx, snap(), active(1))

    expect(mocks.clearFlowSession).not.toHaveBeenCalled()
  })

  it('does NOT clear on false → false — the initial mount', () => {
    const { ctx, mocks } = createFakeEngineContext({ flowSessionEnabled: true })

    applyTransitionEffects(ctx, snap(), snap())

    expect(mocks.clearFlowSession).not.toHaveBeenCalled()
  })

  it('does NOT clear on true → true — an ordinary step change', () => {
    const { ctx, mocks } = createFakeEngineContext({ flowSessionEnabled: true })

    applyTransitionEffects(ctx, active(0), active(1))

    expect(mocks.clearFlowSession).not.toHaveBeenCalled()
  })
})

describe('AbortController swap', () => {
  it('aborts the outgoing controller and installs a fresh one on a tour change', () => {
    const other = makeTour('other', [visibleStep('o1')])
    const { ctx } = createFakeEngineContext()
    const outgoing = new AbortController()
    ctx.abortControllerRef.current = outgoing

    applyTransitionEffects(ctx, active(0), active(0, other))

    expect(outgoing.signal.aborted).toBe(true)
    expect(ctx.abortControllerRef.current).not.toBe(outgoing)
    expect(ctx.abortControllerRef.current?.signal.aborted).toBe(false)
  })

  it('leaves the controller alone across a plain step change', () => {
    const { ctx } = createFakeEngineContext()
    const live = new AbortController()
    ctx.abortControllerRef.current = live

    applyTransitionEffects(ctx, active(0), active(1))

    expect(ctx.abortControllerRef.current).toBe(live)
    expect(live.signal.aborted).toBe(false)
  })

  it('drops the controller to null when the tour ends', () => {
    const { ctx } = createFakeEngineContext()
    ctx.abortControllerRef.current = new AbortController()

    applyTransitionEffects(ctx, active(0), snap())

    expect(ctx.abortControllerRef.current).toBeNull()
  })
})

describe('cross-tab announce', () => {
  it('announces with our tabId when a tour activates', () => {
    const { ctx, mocks } = createFakeEngineContext({ tabId: 'tab-a' })

    applyTransitionEffects(ctx, snap(), active(0))

    expect(mocks.announce).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tour:active', tourId: 't', tabId: 'tab-a' })
    )
  })

  it('records the announce timestamp for the tie-break', () => {
    const { ctx } = createFakeEngineContext()
    expect(ctx.crossTab.lastAnnounceTs).toBeNull()

    applyTransitionEffects(ctx, snap(), active(0))

    expect(ctx.crossTab.lastAnnounceTs).toBeTypeOf('number')
  })

  it('says nothing when no tour is running', () => {
    const { ctx, mocks } = createFakeEngineContext()

    applyTransitionEffects(ctx, active(0), snap())

    expect(mocks.announce).not.toHaveBeenCalled()
  })
})

describe('registry state mirror', () => {
  it('reports progress as (index + 1) / total for the active tour', () => {
    const handle = createFakeEngineContext()
    handle.setCurrentTour(TOUR)
    const update = vi.spyOn(tourRegistry, 'update')

    applyTransitionEffects(handle.ctx, snap(), active(1))

    expect(update).toHaveBeenCalledWith('t', {
      isActive: true,
      currentStepId: 'b',
      progress: 2 / 3,
    })
  })

  it('zeroes every tour that is not the active one', () => {
    const other = makeTour('other', [visibleStep('o1')])
    const handle = createFakeEngineContext()
    handle.setCurrentTour(TOUR)
    handle.setCurrentTour(other)
    handle.setState({
      tours: new Map([
        ['t', TOUR],
        ['other', other],
      ]),
    })
    const update = vi.spyOn(tourRegistry, 'update')

    applyTransitionEffects(handle.ctx, snap(), active(0))

    expect(update).toHaveBeenCalledWith('other', {
      isActive: false,
      currentStepId: null,
      progress: 0,
    })
  })
})

describe('cross-tab pause', () => {
  const channels: Array<{ close: () => void }> = []
  const drain = async () => {
    await new Promise((r) => setTimeout(r, 0))
    await new Promise((r) => setTimeout(r, 0))
  }

  afterEach(() => {
    for (const c of channels.splice(0)) c.close()
  })

  function tab(tabId: string) {
    const channel = createBroadcast<CrossTabActiveMessage>('tourkit:tie-break')
    channels.push(channel)
    const handle = createFakeEngineContext({ tabId })
    handle.setCurrentTour(TOUR)
    handle.setState({ tourId: 't', isActive: true })
    handle.ctx.announce = channel.post
    const unsubscribe = subscribeCrossTabPause(handle.ctx, channel.subscribe)
    channels.push({ close: unsubscribe })
    return handle
  }

  it('stops our tour when another tab announces later than we did', async () => {
    const us = tab('us')
    const them = tab('them')
    us.ctx.crossTab.lastAnnounceTs = 1000

    applyTransitionEffects(them.ctx, snap(), active(0))
    await drain()

    expect(us.mocks.dispatch).toHaveBeenCalledWith({ type: 'STOP_TOUR' })
    expect(us.mocks.onTourPaused).toHaveBeenCalledExactlyOnceWith('t', 'cross-tab')
  })

  it('keeps running when WE announced after the incoming message', async () => {
    const us = tab('us')
    const them = tab('them')
    // Them first, us second: we are the newer owner.
    applyTransitionEffects(them.ctx, snap(), active(0))
    us.ctx.crossTab.lastAnnounceTs = Date.now() + 10_000

    await drain()

    expect(us.mocks.dispatch).not.toHaveBeenCalled()
    expect(us.mocks.onTourPaused).not.toHaveBeenCalled()
  })

  const stopped = (t: ReturnType<typeof tab>) =>
    t.mocks.dispatch.mock.calls.some((c) => (c[0] as { type: string }).type === 'STOP_TOUR')

  it('a simultaneous cold restore leaves exactly one tab running', async () => {
    // The regression the tie-break exists for: two tabs restoring the same
    // session at once, each hearing the other, both yielding, and the user
    // seeing no tour anywhere.
    const older = tab('older')
    const newer = tab('newer')

    const t0 = Date.now()
    older.ctx.crossTab.lastAnnounceTs = t0
    newer.ctx.crossTab.lastAnnounceTs = t0 + 1

    older.ctx.announce({ type: 'tour:active', tourId: 't', tabId: 'older', ts: t0 })
    newer.ctx.announce({ type: 'tour:active', tourId: 't', tabId: 'newer', ts: t0 + 1 })
    await drain()

    expect(stopped(older)).toBe(true)
    expect(stopped(newer)).toBe(false)
  })

  it('an exact timestamp tie stops both — pinned, not endorsed', () => {
    // `myTs > msg.ts` is strict, so two announces landing in the same
    // millisecond make each tab yield to the other. Rare (it needs a
    // same-millisecond cold restore in two tabs) and it fails safe rather than
    // running two tours at once, but it is a real hole. Pinned here as current
    // behaviour; a deterministic tabId tie-break is a §1.4 candidate.
    const a = tab('a')
    const b = tab('b')
    const t0 = Date.now()
    a.ctx.crossTab.lastAnnounceTs = t0
    b.ctx.crossTab.lastAnnounceTs = t0

    // Deliver each other's message directly — the channel is async and this
    // assertion is about the comparison, not the transport.
    subscribeCrossTabPause(a.ctx, (h) => {
      h({ type: 'tour:active', tourId: 't', tabId: 'b', ts: t0 })
      return () => {}
    })
    subscribeCrossTabPause(b.ctx, (h) => {
      h({ type: 'tour:active', tourId: 't', tabId: 'a', ts: t0 })
      return () => {}
    })

    expect(stopped(a)).toBe(true)
    expect(stopped(b)).toBe(true)
  })

  it('ignores our own echo', async () => {
    const us = tab('solo')

    us.ctx.announce({ type: 'tour:active', tourId: 't', tabId: 'solo', ts: Date.now() })
    await drain()

    expect(us.mocks.dispatch).not.toHaveBeenCalled()
  })

  it('does nothing when we have no tour running', async () => {
    const us = tab('us')
    us.setState({ isActive: false, tourId: null })
    const them = tab('them')

    applyTransitionEffects(them.ctx, snap(), active(0))
    await drain()

    expect(us.mocks.dispatch).not.toHaveBeenCalled()
  })
})
