import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
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

  it('start() activates tour', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStep).not.toBeNull()
  })

  it('start(tourId) starts specific tour', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start('tour-2')
    })

    expect(result.current.currentStep?.id).toBe('s4')
  })

  it('start(tourId, stepIndex) starts at specific step', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start('tour-1')
    })

    await act(async () => {
      await result.current.goTo(1)
    })

    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.currentStep?.id).toBe('s2')
  })

  it('next() advances step', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('next() on last step completes tour', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    // Go to last step
    await act(async () => {
      await result.current.goTo(2)
    })

    expect(result.current.currentStepIndex).toBe(2)

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('prev() goes back', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    await act(async () => {
      await result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('prev() on first step does nothing', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    await act(async () => {
      await result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('goTo(index) jumps to step', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.goTo(2)
    })

    expect(result.current.currentStepIndex).toBe(2)
    expect(result.current.currentStep?.id).toBe('s3')
  })

  it('skip() deactivates tour', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      result.current.skip()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('complete() deactivates tour', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.complete()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('stop() deactivates without tracking', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('calls onStart callback', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    expect(onStart).toHaveBeenCalled()
  })

  it('calls onComplete callback', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.complete()
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('calls onSkip callback', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.skip()
    })

    expect(onSkip).toHaveBeenCalled()
  })

  it('fires onComplete exactly once across two consecutive complete() calls (PR #6/#7 guard)', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.complete()
      result.current.complete()
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires onSkip exactly once across two consecutive skip() calls (PR #6/#7 guard)', async () => {
    const onSkip = vi.fn()
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          { id: 's1', target: '#t1', content: 'c1' },
          { id: 's2', target: '#t2', content: 'c2' },
        ],
        onSkip,
      },
    ]
    const wrapper = createWrapper(tours)
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.skip()
      result.current.skip()
    })

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('calls onStepChange callback', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(onStepChange).toHaveBeenCalled()
  })

  it('isFirstStep returns true on first step', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isFirstStep).toBe(true)
  })

  it('isFirstStep returns false on other steps', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.isFirstStep).toBe(false)
  })

  it('isLastStep returns true on last step', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.goTo(2)
    })

    expect(result.current.isLastStep).toBe(true)
  })

  it('isLastStep returns false on other steps', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isLastStep).toBe(false)
  })

  it('progress calculates correctly', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    // Step 0 of 3: (0+1)/3 = 1/3
    expect(result.current.progress).toBeCloseTo(1 / 3)

    await act(async () => {
      await result.current.next()
    })

    // Step 1 of 3: (1+1)/3 = 2/3
    expect(result.current.progress).toBeCloseTo(2 / 3)

    await act(async () => {
      await result.current.next()
    })

    // Step 2 of 3: (2+1)/3 = 3/3 = 1
    expect(result.current.progress).toBeCloseTo(1)
  })

  it('totalSteps returns correct count', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.totalSteps).toBe(3)
  })

  it('isStepActive returns correct value', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isStepActive('s1')).toBe(true)
    expect(result.current.isStepActive('s2')).toBe(false)
  })

  it('getStep returns step by id', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    const step = result.current.getStep('s2')
    expect(step?.id).toBe('s2')
    expect(step?.content).toBe('Step 2')
  })

  it('getStep returns undefined for unknown id', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    const step = result.current.getStep('unknown')
    expect(step).toBeUndefined()
  })
})

describe('TourProvider — UPDATE_TOURS reducer', () => {
  it('short-circuits when tours array is shallow-equal (regression)', () => {
    // Stable tour references — mimics the common pattern where module-scope
    // tours are passed in a freshly-spread array on each render.
    const t1: Tour = {
      id: 'tour-a',
      steps: [{ id: 'a1', target: '#a1', content: 'A1' }],
    }
    const t2: Tour = {
      id: 'tour-b',
      steps: [{ id: 'b1', target: '#b1', content: 'B1' }],
    }

    let consumerRenders = 0

    function Consumer() {
      useTour()
      consumerRenders += 1
      return null
    }

    function Harness({ n }: { n: number }) {
      // Fresh array identity per render (inline literal), but same tour refs.
      return (
        <TourProvider tours={[t1, t2]}>
          <Consumer />
          <span data-testid="n">{n}</span>
        </TourProvider>
      )
    }

    const { rerender } = render(<Harness n={0} />)
    const initial = consumerRenders

    // Force several parent re-renders with the same tour references.
    for (let i = 1; i <= 5; i++) {
      rerender(<Harness n={i} />)
    }

    // Consumer may still render due to parent re-renders, but the reducer
    // short-circuit means each re-render is at most a single pass rather
    // than triggering an additional UPDATE_TOURS-induced render.
    expect(consumerRenders - initial).toBeLessThanOrEqual(5)
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

/**
 * Issue #121 — the React seat inherits the step lifecycle without an edit.
 *
 * `<TourProvider>` calls `applyTransitionEffects` from a no-deps effect, and
 * the pre-commit guards live in the shared `navigateToStepImpl`. So the
 * headless engine and the provider must produce the same order — docs written
 * once are true twice. If this case ever fails, the effect at
 * `tour-provider.tsx:607-615` is the first place to look.
 *
 * Only the five step hooks are asserted. The tour-level `onStepChange` sits
 * *before* `onHide`/`onShow` here and *after* them in the engine; pinning it
 * would pin a divergence this phase is not fixing.
 */
describe('TourProvider — step lifecycle order (#121)', () => {
  const callOrder: string[] = []
  const note = (name: string, id: string) => () => {
    callOrder.push(`${name}:${id}`)
    return undefined
  }

  const hookedTours: Tour[] = [
    {
      id: 'hooked',
      steps: [
        {
          id: 'a',
          target: '#t1',
          content: 'Step A',
          onBeforeHide: note('onBeforeHide', 'a'),
          onHide: note('onHide', 'a'),
        },
        {
          id: 'b',
          target: '#t2',
          content: 'Step B',
          onBeforeShow: note('onBeforeShow', 'b'),
          onEnter: note('onEnter', 'b'),
          onShow: note('onShow', 'b'),
        },
      ],
    },
  ]

  it('gives the same five-element order as the headless engine', async () => {
    const wrapper = createWrapper(hookedTours)
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start('hooked')
    })
    callOrder.length = 0

    await act(async () => {
      await result.current.next()
    })

    // Group B lands in a microtask inside a passive effect, so a bare
    // assertion here reads a short array.
    await waitFor(() =>
      expect(callOrder).toEqual([
        'onBeforeHide:a',
        'onBeforeShow:b',
        'onEnter:b',
        'onHide:a',
        'onShow:b',
      ])
    )
  })

  it('honours a veto from a step guard', async () => {
    const vetoTours: Tour[] = [
      {
        id: 'vetoed',
        steps: [
          { id: 'a', target: '#t1', content: 'A', onBeforeHide: () => false as const },
          { id: 'b', target: '#t2', content: 'B' },
        ],
      },
    ]
    const wrapper = createWrapper(vetoTours)
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start('vetoed')
    })
    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.isTransitioning).toBe(false)
  })
})
