import { act, render, renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

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
