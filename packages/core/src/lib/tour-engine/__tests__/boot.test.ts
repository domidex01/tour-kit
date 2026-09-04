/**
 * v2 §1.3c — the boot-precedence truth table, and the async restore paths.
 *
 * The rows live in `_helpers/boot-rows.ts` because `boot.parity.test.tsx` runs
 * the identical set through a mounted `<TourProvider>`. One table, two
 * consumers: typed separately they would drift, and a drifted pair proves
 * nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistedRouteState } from '../adapters/route-store'
import { type BootDecision, resolveBootStart, runBootStart } from '../boot'
import {
  BOOT_ROWS,
  FLOW_TOUR,
  flowForRow,
  routeForRow,
  toursForRow,
} from './_helpers/boot-rows'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'

describe('resolveBootStart — precedence truth table', () => {
  it.each(BOOT_ROWS)(
    'row %i: flow=%s route=%s auto=%s',
    (_n, flow, route, auto, expected, extra) => {
      const result = resolveBootStart({
        flowSession: flowForRow(flow),
        flowIsStale: flow === 'stale',
        routeState: routeForRow(route),
        tours: toursForRow(auto, extra),
        completedTours: auto === 'completed' ? ['auto'] : [],
      })

      if (expected === null) {
        expect(result).toBeNull()
      } else {
        expect(result).toMatchObject(expected)
      }
    }
  )

  it('carries the flow blob stepIndex through, not the tour startAt', () => {
    expect(
      resolveBootStart({
        flowSession: flowForRow('fresh'),
        flowIsStale: false,
        routeState: null,
        tours: toursForRow('none'),
        completedTours: [],
      })
    ).toEqual({ tourId: 'f', stepIndex: 1, source: 'flow' })
  })

  it('carries the route blob stepIndex through', () => {
    expect(
      resolveBootStart({
        flowSession: null,
        flowIsStale: false,
        routeState: { ...(routeForRow(true) as PersistedRouteState), stepIndex: 3 },
        tours: toursForRow('none'),
        completedTours: [],
      })
    ).toEqual({ tourId: 'r', stepIndex: 3, source: 'route' })
  })

  it('uses the autoStart tour startAt as the entry index', () => {
    const auto = makeTour('auto', [visibleStep('a1'), visibleStep('a2')], {
      autoStart: true,
      startAt: 1,
    })

    expect(
      resolveBootStart({
        flowSession: null,
        flowIsStale: false,
        routeState: null,
        tours: [auto],
        completedTours: [],
      })
    ).toEqual({ tourId: 'auto', stepIndex: 1, source: 'auto' })
  })

  it('ignores a route blob whose tour is not registered', () => {
    expect(
      resolveBootStart({
        flowSession: null,
        flowIsStale: false,
        routeState: { ...(routeForRow(true) as PersistedRouteState), tourId: 'ghost' },
        tours: toursForRow('present'),
        completedTours: [],
      })
    ).toMatchObject({ tourId: 'auto', source: 'auto' })
  })

  it('ignores a route blob with a null tourId', () => {
    expect(
      resolveBootStart({
        flowSession: null,
        flowIsStale: false,
        routeState: { ...(routeForRow(true) as PersistedRouteState), tourId: null },
        tours: toursForRow('present'),
        completedTours: [],
      })
    ).toMatchObject({ tourId: 'auto', source: 'auto' })
  })

  it('is pure — the same input twice gives the same answer', () => {
    const input = {
      flowSession: flowForRow('fresh'),
      flowIsStale: false,
      routeState: routeForRow(true),
      tours: toursForRow('present'),
      completedTours: [],
    }

    expect(resolveBootStart(input)).toEqual(resolveBootStart(input))
  })
})

describe('runBootStart', () => {
  const decision: BootDecision = { tourId: 'f', stepIndex: 0, source: 'flow' }
  let timeSpy: ReturnType<typeof vi.spyOn>
  let timeEndSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="f1"></div>'
    timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {})
    timeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function ctxFor(overrides: Parameters<typeof createFakeEngineContext>[0] = {}) {
    const handle = createFakeEngineContext(overrides)
    handle.setCurrentTour(FLOW_TOUR)
    return handle
  }

  it('dispatches START_TOUR synchronously when already on the right route', async () => {
    const { ctx, mocks } = ctxFor()

    await runBootStart(ctx, decision, { currentRoute: '/', onClear: vi.fn() })

    expect(mocks.router.navigate).not.toHaveBeenCalled()
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: 'START_TOUR',
      tourId: 'f',
      stepIndex: 0,
    })
  })

  it('dispatches without navigating when the decision records no route', async () => {
    const { ctx, mocks } = ctxFor()

    await runBootStart(ctx, decision, { onClear: vi.fn() })

    expect(mocks.router.navigate).not.toHaveBeenCalled()
    expect(mocks.dispatch).toHaveBeenCalledTimes(1)
  })

  it('navigates first, then dispatches, when the recorded route differs', async () => {
    const { ctx, mocks } = ctxFor({ router: { getCurrentRoute: () => '/home' } })

    await runBootStart(ctx, { ...decision, source: 'flow' }, {
      currentRoute: '/pricing',
      onClear: vi.fn(),
    })

    expect(mocks.router.navigate).toHaveBeenCalledWith('/pricing')
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: 'START_TOUR',
      tourId: 'f',
      stepIndex: 0,
    })
  })

  it('clears the session and does not dispatch when navigate rejects', async () => {
    const onClear = vi.fn()
    const { ctx, mocks } = ctxFor({
      router: {
        getCurrentRoute: () => '/home',
        navigate: () => Promise.reject(new Error('404')),
      },
    })

    await runBootStart(ctx, decision, { currentRoute: '/pricing', onClear })

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch and does not clear when aborted mid-flight', async () => {
    const onClear = vi.fn()
    const controller = new AbortController()
    const { ctx, mocks } = ctxFor({
      router: {
        getCurrentRoute: () => '/home',
        navigate: () => {
          controller.abort()
          return Promise.resolve(undefined)
        },
      },
    })

    await runBootStart(ctx, decision, {
      currentRoute: '/pricing',
      signal: controller.signal,
      onClear,
    })

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(onClear).not.toHaveBeenCalled()
  })

  it('does not wait for a target when the restored step is hidden', async () => {
    // `waitForStepTarget` only applies to visible steps; a hidden step has no
    // selector to observe and would hang until its timeout.
    const hiddenTour = makeTour('f', [hiddenStep('h1')])
    const handle = createFakeEngineContext({ router: { getCurrentRoute: () => '/home' } })
    handle.setCurrentTour(hiddenTour)

    await runBootStart(handle.ctx, decision, { currentRoute: '/pricing', onClear: vi.fn() })

    expect(handle.mocks.dispatch).toHaveBeenCalledWith({
      type: 'START_TOUR',
      tourId: 'f',
      stepIndex: 0,
    })
  })

  it('instruments the sync path with console.time("flow-restore") exactly once', async () => {
    // Playwright reads this timer for the <200 ms resume budget. It has to
    // fire on the common same-route path too, not just the async one.
    const { ctx } = ctxFor()

    await runBootStart(ctx, decision, { currentRoute: '/', onClear: vi.fn() })

    expect(timeSpy).toHaveBeenCalledExactlyOnceWith('flow-restore')
    expect(timeEndSpy).toHaveBeenCalledExactlyOnceWith('flow-restore')
  })

  it('instruments the async navigate-then-wait path exactly once too', async () => {
    const { ctx } = ctxFor({ router: { getCurrentRoute: () => '/home' } })

    await runBootStart(ctx, decision, { currentRoute: '/pricing', onClear: vi.fn() })

    expect(timeSpy).toHaveBeenCalledExactlyOnceWith('flow-restore')
    expect(timeEndSpy).toHaveBeenCalledExactlyOnceWith('flow-restore')
  })

  it('ends the timer even when the restore fails', async () => {
    const { ctx } = ctxFor({
      router: {
        getCurrentRoute: () => '/home',
        navigate: () => Promise.reject(new Error('404')),
      },
    })

    await runBootStart(ctx, decision, { currentRoute: '/pricing', onClear: vi.fn() })

    expect(timeEndSpy).toHaveBeenCalledExactlyOnceWith('flow-restore')
  })
})
