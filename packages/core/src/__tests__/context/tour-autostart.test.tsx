import { render, renderHook, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

function createWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

describe('TourProvider — autoStart', () => {
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
})
