import { act, render, renderHook, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

const testTours: Tour[] = [
  {
    id: 'tour-1',
    steps: [
      { id: 's1', target: '#t1', content: 'Step 1' },
      { id: 's2', target: '#t2', content: 'Step 2' },
      { id: 's3', target: '#t3', content: 'Step 3' },
    ],
  },
  {
    id: 'tour-2',
    steps: [{ id: 's4', target: '#t4', content: 'Other Step' }],
  },
]

function createWrapper(tours: Tour[] = testTours) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

describe('TourProvider', () => {
  it('provides context to children', () => {
    function Consumer() {
      const tour = useTour()
      return <div data-testid="isActive">{String(tour.isActive)}</div>
    }

    render(
      <TourProvider tours={testTours}>
        <Consumer />
      </TourProvider>
    )

    expect(screen.getByTestId('isActive')).toHaveTextContent('false')
  })

  it('initial state is inactive', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    expect(result.current.isActive).toBe(false)
    expect(result.current.currentStep).toBeNull()
    expect(result.current.currentStepIndex).toBe(0)
  })

  it('start() activates tour', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStep).not.toBeNull()
  })

  it('start(tourId) starts specific tour', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start('tour-2')
    })

    expect(result.current.currentStep?.id).toBe('s4')
  })

  it('start(tourId, stepIndex) starts at specific step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start('tour-1')
    })

    act(() => {
      result.current.goTo(1)
    })

    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.currentStep?.id).toBe('s2')
  })

  it('next() advances step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    act(() => {
      result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('next() on last step completes tour', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    // Go to last step
    act(() => {
      result.current.goTo(2)
    })

    expect(result.current.currentStepIndex).toBe(2)

    act(() => {
      result.current.next()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('prev() goes back', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    act(() => {
      result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('prev() on first step does nothing', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    act(() => {
      result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('goTo(index) jumps to step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.goTo(2)
    })

    expect(result.current.currentStepIndex).toBe(2)
    expect(result.current.currentStep?.id).toBe('s3')
  })

  it('skip() deactivates tour', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      result.current.skip()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('complete() deactivates tour', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.complete()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('stop() deactivates without tracking', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('calls onStart callback', () => {
    const onStart = vi.fn()
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [{ id: 's1', target: '#t1', content: 'c' }],
        onStart,
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(onStart).toHaveBeenCalled()
  })

  it('calls onComplete callback', () => {
    const onComplete = vi.fn()
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [{ id: 's1', target: '#t1', content: 'c' }],
        onComplete,
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.complete()
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('calls onSkip callback', () => {
    const onSkip = vi.fn()
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [{ id: 's1', target: '#t1', content: 'c' }],
        onSkip,
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.skip()
    })

    expect(onSkip).toHaveBeenCalled()
  })

  it('calls onStepChange callback', () => {
    const onStepChange = vi.fn()
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          { id: 's1', target: '#t1', content: 'c1' },
          { id: 's2', target: '#t2', content: 'c2' },
        ],
        onStepChange,
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.next()
    })

    expect(onStepChange).toHaveBeenCalled()
  })

  it('isFirstStep returns true on first step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.isFirstStep).toBe(true)
  })

  it('isFirstStep returns false on other steps', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.next()
    })

    expect(result.current.isFirstStep).toBe(false)
  })

  it('isLastStep returns true on last step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.goTo(2)
    })

    expect(result.current.isLastStep).toBe(true)
  })

  it('isLastStep returns false on other steps', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.isLastStep).toBe(false)
  })

  it('progress calculates correctly', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    // Step 0 of 3: (0+1)/3 = 1/3
    expect(result.current.progress).toBeCloseTo(1 / 3)

    act(() => {
      result.current.next()
    })

    // Step 1 of 3: (1+1)/3 = 2/3
    expect(result.current.progress).toBeCloseTo(2 / 3)

    act(() => {
      result.current.next()
    })

    // Step 2 of 3: (2+1)/3 = 3/3 = 1
    expect(result.current.progress).toBeCloseTo(1)
  })

  it('totalSteps returns correct count', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.totalSteps).toBe(3)
  })

  it('isStepActive returns correct value', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    expect(result.current.isStepActive('s1')).toBe(true)
    expect(result.current.isStepActive('s2')).toBe(false)
  })

  it('getStep returns step by id', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    const step = result.current.getStep('s2')
    expect(step?.id).toBe('s2')
    expect(step?.content).toBe('Step 2')
  })

  it('getStep returns undefined for unknown id', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.start()
    })

    const step = result.current.getStep('unknown')
    expect(step).toBeUndefined()
  })
})

describe('useTourContext', () => {
  it('throws error when used outside TourProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTourContext())
    }).toThrow('useTourContext must be used within a TourProvider')

    consoleSpy.mockRestore()
  })

  it('returns context when used within TourProvider', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTourContext(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.isActive).toBe(false)
  })
})
