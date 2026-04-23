import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useKeyboardNavigation } from '../../hooks/use-keyboard'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'
import { createEventListenerTracker } from '../utils/cleanup-test-utils'

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

  it('calls next on ArrowRight when tour is active', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.currentStepIndex).toBe(0)

    await act(async () => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('calls next on Enter when tour is active', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      dispatchKeyEvent('Enter')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('calls prev on ArrowLeft when tour is active', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    // First go to step 1
    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    await act(async () => {
      dispatchKeyEvent('ArrowLeft')
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('calls skip on Escape when tour is active', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      dispatchKeyEvent('Escape')
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores keyboard when focus is in input', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    input.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(input)
  })

  it('ignores keyboard when focus is in textarea', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    textarea.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(textarea)
  })

  it('ignores keyboard when focus is in select', async () => {
    const wrapper = createWrapper()

    const select = document.createElement('select')
    const option = document.createElement('option')
    option.textContent = 'one'
    select.appendChild(option)
    document.body.appendChild(select)

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    select.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(select)
  })

  it('ignores keyboard when focus is in contenteditable element', async () => {
    const wrapper = createWrapper()

    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    editable.tabIndex = 0
    document.body.appendChild(editable)

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    editable.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(editable)
  })

  it('ignores keyboard when focus is in role="textbox"', async () => {
    const wrapper = createWrapper()

    const textbox = document.createElement('div')
    textbox.setAttribute('role', 'textbox')
    textbox.tabIndex = 0
    document.body.appendChild(textbox)

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    textbox.focus()

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    expect(result.current.currentStepIndex).toBe(0)

    document.body.removeChild(textbox)
  })

  it('uses custom key configuration for next', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ nextKeys: ['n', 'Space'] })
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      dispatchKeyEvent('n')
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('uses custom key configuration for prev', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ prevKeys: ['p', 'Backspace'] })
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStepIndex).toBe(1)

    await act(async () => {
      dispatchKeyEvent('p')
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('uses custom key configuration for exit', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ exitKeys: ['q'] })
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      dispatchKeyEvent('q')
    })

    expect(result.current.isActive).toBe(false)
  })

  it('does nothing when keyboard navigation is disabled', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation({ enabled: false })
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      dispatchKeyEvent('ArrowRight')
    })

    // Should still be on step 0
    expect(result.current.currentStepIndex).toBe(0)
  })

  it('cleans up event listener on unmount', async () => {
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

    await act(async () => {
      await result.current.start()
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('prevents default on recognized keys', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    await act(async () => {
      document.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})

describe('useKeyboardNavigation - memory leak prevention', () => {
  let tracker: ReturnType<typeof createEventListenerTracker>

  beforeEach(() => {
    tracker = createEventListenerTracker(document)
    document.body.innerHTML = ''
  })

  afterEach(() => {
    tracker.cleanup()
  })

  it('does not leak listeners after multiple start/stop cycles', async () => {
    const wrapper = createWrapper()

    const { result, unmount } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    // Perform multiple start/stop cycles
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.start()
      })
      act(() => {
        result.current.stop()
      })
    }

    unmount()
    tracker.assertNoLeaks()
  })

  it('does not accumulate listeners when tour state changes rapidly', async () => {
    const wrapper = createWrapper()

    const { result, unmount } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation()
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    // Navigate through steps rapidly
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.prev()
      })
    }

    // Should only have one keydown listener
    expect(tracker.getListenerCount('keydown')).toBe(1)

    unmount()
    tracker.assertNoLeaks()
  })

  it('cleans up when config changes from enabled to disabled', async () => {
    let config = { enabled: true }
    const wrapper = createWrapper()

    const { result, rerender, unmount } = renderHook(
      () => {
        const tour = useTour()
        useKeyboardNavigation(config)
        return tour
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(tracker.getListenerCount('keydown')).toBe(1)

    // Disable keyboard navigation
    config = { enabled: false }
    rerender()

    // Listener should be removed
    expect(tracker.getListenerCount('keydown')).toBe(0)

    unmount()
    tracker.assertNoLeaks()
  })
})
