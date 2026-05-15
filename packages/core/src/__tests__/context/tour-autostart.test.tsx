import { act, render, renderHook, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import { TourKitProvider } from '../../context/tourkit-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

function createWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

function createPersistentWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TourKitProvider
        config={{
          persistence: {
            enabled: true,
            storage: 'localStorage',
            keyPrefix: 'tourkit',
            trackCompleted: true,
          },
        }}
      >
        <TourProvider tours={tours}>{children}</TourProvider>
      </TourKitProvider>
    )
  }
}

describe('TourProvider — autoStart', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('activates tour on mount when autoStart is true', async () => {
    const tours: Tour[] = [
      {
        id: 'auto',
        autoStart: true,
        steps: [
          { id: 's1', target: '#t1', content: 'Step 1' },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTourContext(), { wrapper })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
    })
    expect(result.current.tourId).toBe('auto')
    expect(result.current.currentStepIndex).toBe(0)
  })

  it('respects startAt when auto-starting', async () => {
    const tours: Tour[] = [
      {
        id: 'auto',
        autoStart: true,
        startAt: 2,
        steps: [
          { id: 's1', target: '#t1', content: 'Step 1' },
          { id: 's2', target: '#t2', content: 'Step 2' },
          { id: 's3', target: '#t3', content: 'Step 3' },
        ],
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTourContext(), { wrapper })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
    })
    expect(result.current.currentStepIndex).toBe(2)
    expect(result.current.currentStep?.id).toBe('s3')
  })

  it('does not auto-start when autoStart is false/undefined', () => {
    const tours: Tour[] = [
      {
        id: 'manual',
        steps: [{ id: 's1', target: '#t1', content: 'Step 1' }],
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    expect(result.current.isActive).toBe(false)
  })

  it('persistence restore wins over autoStart (no double-start)', async () => {
    // Seed localStorage with a persisted tour "b"
    const storageKey = 'tourkit-route-state'
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        tourId: 'b',
        stepIndex: 1,
        completedTours: [],
        skippedTours: [],
        timestamp: Date.now(),
      })
    )

    const tours: Tour[] = [
      {
        id: 'a',
        autoStart: true,
        steps: [
          { id: 'a1', target: '#a1', content: 'A Step 1' },
          { id: 'a2', target: '#a2', content: 'A Step 2' },
        ],
      },
      {
        id: 'b',
        steps: [
          { id: 'b1', target: '#b1', content: 'B Step 1' },
          { id: 'b2', target: '#b2', content: 'B Step 2' },
        ],
      },
    ]

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={tours}
          routePersistence={{
            enabled: true,
            storage: 'localStorage',
            key: storageKey,
          }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTourContext(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
    })

    // Persistence restore should win — tour "b" at step index 1
    expect(result.current.tourId).toBe('b')
    expect(result.current.currentStepIndex).toBe(1)

    window.localStorage.removeItem(storageKey)
  })

  it('does nothing when no tour has autoStart', () => {
    const tours: Tour[] = [
      { id: 't1', steps: [{ id: 's1', target: '#t1', content: 'x' }] },
      { id: 't2', steps: [{ id: 's2', target: '#t2', content: 'y' }] },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    expect(result.current.isActive).toBe(false)
  })

  it('re-hydrates from a cross-tab storage write when syncTabs is enabled', async () => {
    const storageKey = 'tourkit-route-state-sync'

    const tours: Tour[] = [
      {
        id: 'cross-tab',
        steps: [
          { id: 's1', target: '#t1', content: 'Step 1' },
          { id: 's2', target: '#t2', content: 'Step 2' },
          { id: 's3', target: '#t3', content: 'Step 3' },
        ],
      },
    ]

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TourProvider
          tours={tours}
          routePersistence={{
            enabled: true,
            storage: 'localStorage',
            key: storageKey,
            syncTabs: true,
          }}
        >
          {children}
        </TourProvider>
      )
    }

    const { result } = renderHook(() => useTourContext(), { wrapper: Wrapper })

    expect(result.current.isActive).toBe(false)

    // Simulate another tab writing to the same key and the browser firing a
    // storage event on this tab. The provider must pick up the state.
    const payload = JSON.stringify({
      tourId: 'cross-tab',
      stepIndex: 2,
      completedTours: [],
      skippedTours: [],
      timestamp: Date.now(),
    })
    window.localStorage.setItem(storageKey, payload)

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: payload }))
    })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
    })
    expect(result.current.tourId).toBe('cross-tab')
    expect(result.current.currentStepIndex).toBe(2)

    window.localStorage.removeItem(storageKey)
  })

  it('renders via <TourProvider> + consumer without crashing', async () => {
    const tours: Tour[] = [
      {
        id: 'auto',
        autoStart: true,
        steps: [{ id: 's1', target: '#t1', content: 'Step 1' }],
      },
    ]

    function Consumer() {
      const { isActive } = useTourContext()
      return <div data-testid="active">{String(isActive)}</div>
    }

    const { getByTestId } = render(
      <TourProvider tours={tours}>
        <Consumer />
      </TourProvider>
    )

    await waitFor(() => {
      expect(getByTestId('active').textContent).toBe('true')
    })
  })

  it('does not auto-start a completed tour after remount when persistence is enabled', async () => {
    const tours: Tour[] = [
      {
        id: 'completed-auto',
        autoStart: true,
        steps: [{ id: 's1', target: '#t1', content: 'Step 1' }],
      },
    ]
    const wrapper = createPersistentWrapper(tours)
    const first = renderHook(() => useTourContext(), { wrapper })

    await waitFor(() => {
      expect(first.result.current.isActive).toBe(true)
    })

    act(() => {
      first.result.current.complete()
    })

    await waitFor(() => {
      expect(first.result.current.isActive).toBe(false)
    })
    expect(JSON.parse(window.localStorage.getItem('tourkit:completed') ?? '[]')).toEqual([
      'completed-auto',
    ])

    first.unmount()

    const second = renderHook(() => useTourContext(), { wrapper })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(second.result.current.isActive).toBe(false)
    expect(second.result.current.tourId).toBeNull()
  })

  it('auto-starts again after persisted completion is reset', async () => {
    window.localStorage.setItem('tourkit:completed', JSON.stringify(['reset-auto']))

    const tours: Tour[] = [
      {
        id: 'reset-auto',
        autoStart: true,
        steps: [{ id: 's1', target: '#t1', content: 'Step 1' }],
      },
    ]
    const wrapper = createPersistentWrapper(tours)
    const blocked = renderHook(() => useTourContext(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(blocked.result.current.isActive).toBe(false)

    act(() => {
      blocked.result.current.reset('reset-auto')
    })
    expect(JSON.parse(window.localStorage.getItem('tourkit:completed') ?? '[]')).toEqual([])
    blocked.unmount()

    const restarted = renderHook(() => useTourContext(), { wrapper })
    await waitFor(() => {
      expect(restarted.result.current.isActive).toBe(true)
    })
    expect(restarted.result.current.tourId).toBe('reset-auto')
  })
})
