import { act, render, renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'
import type { RouterAdapter } from '../../types/router'

const tour: Tour = {
  id: 'onboarding',
  steps: [
    { id: 's1', target: '#t1', content: 'Step 1' },
    { id: 's2', target: '#t2', content: 'Step 2' },
    { id: 's3', target: '#t3', content: 'Step 3' },
  ],
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('TourProvider — flowSession reload (US-1)', () => {
  it('restores at the persisted stepIndex after unmount/remount', async () => {
    function makeWrapper() {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
          <TourProvider
            tours={[tour]}
            routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
          >
            {children}
          </TourProvider>
        )
      }
    }

    const first = renderHook(() => useTour(), { wrapper: makeWrapper() })

    await act(async () => {
      first.result.current.start('onboarding')
    })
    await act(async () => {
      first.result.current.next()
    })
    expect(first.result.current.currentStepIndex).toBe(1)

    // Verify blob exists
    expect(sessionStorage.getItem('tourkit:flow:active')).not.toBeNull()
    first.unmount()

    const second = renderHook(() => useTour(), { wrapper: makeWrapper() })
    expect(second.result.current.isActive).toBe(true)
    expect(second.result.current.currentStepIndex).toBe(1)
    expect(second.result.current.currentStep?.id).toBe('s2')
    // Regression for clear-on-mount bug: the blob must still exist after the
    // restored mount. Previously the clear effect fired on initial mount
    // (state.isActive=false) and wiped the blob right after restore — only
    // saved by the leading-edge throttle re-write on the next render.
    expect(sessionStorage.getItem('tourkit:flow:active')).not.toBeNull()
  })

  it('clears the persisted blob when the tour is explicitly stopped', async () => {
    function makeWrapper() {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
          <TourProvider
            tours={[tour]}
            routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
          >
            {children}
          </TourProvider>
        )
      }
    }

    const { result } = renderHook(() => useTour(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.start('onboarding')
    })
    expect(sessionStorage.getItem('tourkit:flow:active')).not.toBeNull()

    await act(async () => {
      result.current.stop()
    })
    expect(sessionStorage.getItem('tourkit:flow:active')).toBeNull()
  })
})

describe('TourProvider — flowSession TTL expiry (US-1)', () => {
  it('does not auto-restore when persisted blob is older than ttlMs', () => {
    sessionStorage.setItem(
      'tourkit:flow:active',
      JSON.stringify({
        schemaVersion: 1,
        tourId: 'onboarding',
        stepIndex: 2,
        startedAt: 1,
        lastUpdatedAt: 1,
      })
    )

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={[tour]}
          routePersistence={{
            enabled: false,
            flowSession: { storage: 'sessionStorage', ttlMs: 1_000 },
          }}
        >
          {children}
        </TourProvider>
      )
    }
    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    expect(result.current.isActive).toBe(false)
    expect(sessionStorage.getItem('tourkit:flow:active')).toBeNull()
  })
})

describe('TourProvider — cross-tab pause (US-2)', () => {
  it('fires onTourPaused and stops the local tour when another tab posts tour:active', async () => {
    const channel = `tk-cross-tab-${Math.random().toString(36).slice(2)}`
    const onTourPausedA = vi.fn()
    const onTourPausedB = vi.fn()

    function makeWrapper(spy: typeof onTourPausedA) {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
          <TourProvider
            tours={[tour]}
            routePersistence={{ enabled: false, crossTab: { enabled: true, channel } }}
            onTourPaused={spy}
          >
            {children}
          </TourProvider>
        )
      }
    }

    const tabA = renderHook(() => useTour(), { wrapper: makeWrapper(onTourPausedA) })
    const tabB = renderHook(() => useTour(), { wrapper: makeWrapper(onTourPausedB) })

    // Tab B starts a tour first.
    await act(async () => {
      tabB.result.current.start('onboarding')
    })
    expect(tabB.result.current.isActive).toBe(true)

    // Tab A starts → posts tour:active on the shared channel.
    await act(async () => {
      tabA.result.current.start('onboarding')
    })

    // Allow MessageChannel microtasks to flush; jsdom dispatches BroadcastChannel
    // events asynchronously (microtask queue).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onTourPausedB).toHaveBeenCalledWith('onboarding', 'cross-tab')
    expect(tabB.result.current.isActive).toBe(false)
    // Tab A is unaffected (filters self by tabId).
    expect(tabA.result.current.isActive).toBe(true)
    expect(onTourPausedA).not.toHaveBeenCalled()

    tabA.unmount()
    tabB.unmount()
  })
})

// -----------------------------------------------------------------------------
// Phase 1.3 — restore-with-route integration (US-4)
// -----------------------------------------------------------------------------

describe('TourProvider — restore-with-route (Phase 1.3 / US-4)', () => {
  // Two-route tour where step index 1 lives on /billing.
  const crossPageTour: Tour = {
    id: 'cross-page',
    steps: [
      { id: 'a', target: '#dashboard-target', content: 'A' },
      { id: 'b', target: '#billing-target', route: '/billing', content: 'B' },
    ],
  }

  function makeRouter(initialPath = '/'): {
    adapter: RouterAdapter
    navigate: ReturnType<typeof vi.fn>
    state: { path: string }
  } {
    const state = { path: initialPath }
    const navigate = vi.fn(async (route: string) => {
      state.path = route
      // Mount the target on the new route as a microtask — mirrors the
      // App Router contract where push() returns before the new tree mounts.
      queueMicrotask(() => {
        const t = document.createElement('div')
        t.id = 'billing-target'
        document.body.appendChild(t)
      })
      return undefined
    })
    const callbacks = new Set<(r: string) => void>()
    const adapter: RouterAdapter = {
      getCurrentRoute: () => state.path,
      navigate,
      matchRoute: (pattern, mode = 'exact') => {
        switch (mode) {
          case 'exact':
            return state.path === pattern
          case 'startsWith':
            return state.path.startsWith(pattern)
          case 'contains':
            return state.path.includes(pattern)
          default:
            return state.path === pattern
        }
      },
      onRouteChange: (cb) => {
        callbacks.add(cb)
        cb(state.path)
        return () => callbacks.delete(cb)
      },
    }
    return { adapter, navigate, state }
  }

  it('navigates to the persisted currentRoute then dispatches START_TOUR (US-4)', async () => {
    // Seed the V2 blob with stepIndex=1 + currentRoute=/billing.
    sessionStorage.setItem(
      'tourkit:flow:active',
      JSON.stringify({
        schemaVersion: 2,
        tourId: 'cross-page',
        stepIndex: 1,
        currentRoute: '/billing',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      })
    )
    const { adapter, navigate } = makeRouter('/')
    document.body.innerHTML = '<div id="dashboard-target"></div>'

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={[crossPageTour]}
          router={adapter}
          routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })

    // The mount-only effect kicks off router.navigate('/billing') →
    // waitForStepTarget → dispatch START_TOUR. Drain microtasks.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(navigate).toHaveBeenCalledWith('/billing')
    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.currentStep?.id).toBe('b')

    document.body.innerHTML = ''
  })

  it('skips the route restore when the persisted route already matches (US-4)', async () => {
    sessionStorage.setItem(
      'tourkit:flow:active',
      JSON.stringify({
        schemaVersion: 2,
        tourId: 'cross-page',
        stepIndex: 1,
        currentRoute: '/billing',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      })
    )
    const { adapter, navigate } = makeRouter('/billing')
    document.body.innerHTML = '<div id="billing-target"></div>'

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={[crossPageTour]}
          router={adapter}
          routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })

    // Synchronous restore — no async navigation involved.
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStepIndex).toBe(1)

    document.body.innerHTML = ''
  })

  it('clears the session when the target never mounts on the persisted route (US-4)', async () => {
    sessionStorage.setItem(
      'tourkit:flow:active',
      JSON.stringify({
        schemaVersion: 2,
        tourId: 'cross-page',
        stepIndex: 1,
        currentRoute: '/billing',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      })
    )
    // Router that navigates but never mounts the target.
    const state = { path: '/' }
    const navigate = vi.fn(async (route: string) => {
      state.path = route
      return undefined
    })
    const adapter: RouterAdapter = {
      getCurrentRoute: () => state.path,
      navigate,
      matchRoute: (p) => state.path === p,
      onRouteChange: () => () => {},
    }

    const [stepA, stepB] = crossPageTour.steps
    if (!stepA || !stepB) throw new Error('test fixture invariant')
    const tourWithShortTimeout: Tour = {
      ...crossPageTour,
      steps: [stepA, { ...stepB, waitTimeout: 50 }],
    }

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={[tourWithShortTimeout]}
          router={adapter}
          routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(navigate).toHaveBeenCalledWith('/billing')
    // Tour did NOT start (target missing).
    expect(result.current.isActive).toBe(false)
    // Stale session cleared so next mount doesn't loop.
    expect(sessionStorage.getItem('tourkit:flow:active')).toBeNull()
  })

  it('does nothing when the V1 blob has no currentRoute (Phase 1.1 backward-compat)', async () => {
    // Seed a V1 blob — parse() migrates to V2 with currentRoute: undefined.
    sessionStorage.setItem(
      'tourkit:flow:active',
      JSON.stringify({
        schemaVersion: 1,
        tourId: 'cross-page',
        stepIndex: 1,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      })
    )
    const { adapter, navigate } = makeRouter('/')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={[crossPageTour]}
          router={adapter}
          routePersistence={{ enabled: false, flowSession: { storage: 'sessionStorage' } }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })

    // No route restore — V1 → V2 migration leaves currentRoute undefined,
    // so the provider just dispatches START_TOUR synchronously.
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStepIndex).toBe(1)
  })
})

describe('TourProvider — graceful when BroadcastChannel is unavailable (US-3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts and runs without throwing when BroadcastChannel is undefined', async () => {
    vi.stubGlobal('BroadcastChannel', undefined as unknown as typeof BroadcastChannel)

    function ActiveProbe() {
      const ctx = useTourContext()
      const startedRef = React.useRef(false)
      React.useEffect(() => {
        if (!startedRef.current) {
          startedRef.current = true
          void ctx.start('onboarding')
        }
      }, [ctx])
      return <div data-testid="active">{String(ctx.isActive)}</div>
    }

    expect(() =>
      render(
        <TourProvider
          tours={[tour]}
          routePersistence={{
            enabled: false,
            crossTab: { enabled: true, channel: 'tk-bc-undef' },
          }}
        >
          <ActiveProbe />
        </TourProvider>
      )
    ).not.toThrow()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })
})
