import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useStep } from '../../hooks/use-step'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

const testTours: Tour[] = [
  {
    id: 'test-tour',
    steps: [
      { id: 'step-1', target: '#target-1', content: 'Step 1' },
      { id: 'step-2', target: '#target-2', content: 'Step 2' },
      { id: 'step-3', target: '#target-3', content: 'Step 3' },
    ],
  },
]

function createWrapper(tours: Tour[] = testTours) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

describe('useStep', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="target-1">Target 1</div>
      <div id="target-2">Target 2</div>
      <div id="target-3">Target 3</div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useStep('step-1'))
    }).toThrow('useStep must be used within a TourProvider')

    consoleSpy.mockRestore()
  })

  it('returns isActive false when tour is not started', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useStep('step-1'), { wrapper })
    expect(result.current.isActive).toBe(false)
  })

  it('returns isActive true when step is current', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-1'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.step.isActive).toBe(true)
  })

  it('returns isActive false for non-current step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-2'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.step.isActive).toBe(false)
  })

  it('show() navigates to the step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-2'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.tour.currentStepIndex).toBe(0)

    act(() => {
      result.current.step.show()
    })

    expect(result.current.tour.currentStepIndex).toBe(1)
  })

  it('hide() sets isVisible false', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-1'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.step.isVisible).toBe(true)

    act(() => {
      result.current.step.hide()
    })

    expect(result.current.step.isVisible).toBe(false)
  })

  it('complete() advances to next step', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-1'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    act(() => {
      result.current.step.complete()
    })

    expect(result.current.tour.currentStepIndex).toBe(1)
    expect(result.current.step.hasCompleted).toBe(true)
  })

  it('sets isVisible true on active', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-1'),
      }),
      { wrapper }
    )

    expect(result.current.step.isVisible).toBe(false)

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.step.isVisible).toBe(true)
  })

  it('resolves target from selector', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        tour: useTour(),
        step: useStep('step-1'),
      }),
      { wrapper }
    )

    act(() => {
      result.current.tour.start()
    })

    expect(result.current.step.targetElement).toBe(document.getElementById('target-1'))
  })
})
