import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

const testTour: Tour = {
  id: 'test-tour',
  steps: [
    { id: 'step-1', target: '#step1', content: 'Step 1' },
    { id: 'step-2', target: '#step2', content: 'Step 2' },
    { id: 'step-3', target: '#step3', content: 'Step 3' },
  ],
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TourProvider tours={[testTour]}>{children}</TourProvider>
)

describe('useTour', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTour())
    }).toThrow('useTour must be used within a TourProvider')

    consoleSpy.mockRestore()
  })

  it('returns inactive state initially', () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    expect(result.current.isActive).toBe(false)
    expect(result.current.currentStep).toBeNull()
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.totalSteps).toBe(0)
  })

  it('starts tour when start is called', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStep?.id).toBe('step-1')
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.totalSteps).toBe(3)
  })

  it('advances to next step', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.currentStep?.id).toBe('step-2')
  })

  it('goes to previous step', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    await act(async () => {
      await result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.currentStep?.id).toBe('step-1')
  })

  it('does not go to previous step when on first step', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.prev()
    })

    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.isFirstStep).toBe(true)
  })

  it('completes tour on last step next', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    // Go to last step
    await act(async () => {
      await result.current.goTo(2)
    })

    expect(result.current.isLastStep).toBe(true)

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('skips tour', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.skip()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('stops tour', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('completes tour manually', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.complete()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('calculates progress correctly', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.progress).toBeCloseTo(1 / 3)
    expect(result.current.isFirstStep).toBe(true)
    expect(result.current.isLastStep).toBe(false)

    await act(async () => {
      await result.current.goTo(2)
    })

    expect(result.current.progress).toBe(1)
    expect(result.current.isLastStep).toBe(true)
    expect(result.current.isFirstStep).toBe(false)
  })

  it('goes to specific step with goTo', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.goTo(1)
    })

    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.currentStep?.id).toBe('step-2')
  })

  it('isStepActive returns correct value', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isStepActive('step-1')).toBe(true)
    expect(result.current.isStepActive('step-2')).toBe(false)

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.isStepActive('step-1')).toBe(false)
    expect(result.current.isStepActive('step-2')).toBe(true)
  })

  it('getStep returns step by id', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    const step = result.current.getStep('step-2')
    expect(step?.id).toBe('step-2')
    expect(step?.content).toBe('Step 2')
  })

  it('getStep returns undefined for non-existent step', async () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    await act(async () => {
      await result.current.start()
    })

    const step = result.current.getStep('nonexistent')
    expect(step).toBeUndefined()
  })

  it('starts tour with specific tourId', async () => {
    const multipleTours: Tour[] = [
      testTour,
      {
        id: 'second-tour',
        steps: [{ id: 'second-step-1', target: '#target', content: 'Second Tour Step 1' }],
      },
    ]

    const multiWrapper = ({ children }: { children: React.ReactNode }) => (
      <TourProvider tours={multipleTours}>{children}</TourProvider>
    )

    const { result } = renderHook(() => useTour('second-tour'), { wrapper: multiWrapper })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.currentStep?.id).toBe('second-step-1')
  })
})
