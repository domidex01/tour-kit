import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useKeyboardNavigation } from '../../hooks/use-keyboard'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

const testTours: Tour[] = [
  {
    id: 'test-tour',
    steps: [
      { id: 'step-1', target: '#t1', content: 'Step 1' },
      { id: 'step-2', target: '#t2', content: 'Step 2' },
      { id: 'step-3', target: '#t3', content: 'Step 3' },
    ],
  },
]

function createWrapper(tours: Tour[] = testTours) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

function dispatchKeyEvent(key: string, options: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...options })
  document.dispatchEvent(event)
}

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    // Clear any input elements
    document.body.innerHTML = ''
  })

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useKeyboardNavigation())
    }).toThrow('useKeyboardNavigation must be used within a TourProvider')

    consoleSpy.mockRestore()
  })

  it('does nothing when tour is not active', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    expect(result.current.isActive).toBe(false)

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('calls next on ArrowRight when tour is active', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('calls next on Enter when tour is active', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      dispatchKeyEvent('Enter')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('calls prev on ArrowLeft when tour is active', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    // First go to step 1
    act(() => {
      result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    act(() => {
      dispatchKeyEvent('ArrowLeft')
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('calls skip on Escape when tour is active', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      dispatchKeyEvent('Escape')
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores keyboard when focus is in input', () => {
    const wrapper = createWrapper()

    // Create and focus an input
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    input.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(input)
  })

  it('ignores keyboard when focus is in textarea', () => {
    const wrapper = createWrapper()

    // Create and focus a textarea
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    textarea.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(textarea)
  })

  it('uses custom key configuration for next', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ nextKeys: ['n', 'Space'] })
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      dispatchKeyEvent('n')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('uses custom key configuration for prev', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ prevKeys: ['p', 'Backspace'] })
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    act(() => {
      dispatchKeyEvent('p')
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('uses custom key configuration for exit', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ exitKeys: ['q'] })
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      dispatchKeyEvent('q')
    })

    expect(result.current.isActive).toBe(false)
  })

  it('does nothing when keyboard navigation is disabled', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ enabled: false })
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = createWrapper()

    const { result, unmount } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('prevents default on recognized keys', () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    act(() => {
      result.current.start()
    })

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      document.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
