import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { dispatchAdvanceEvent, useAdvanceOn } from '../../hooks/use-advance-on'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

describe('useAdvanceOn', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <button id="target-btn">Click me</button>
      <input id="target-input" type="text" />
    `
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  function createWrapper(tours: Tour[]) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <TourProvider tours={tours}>{children}</TourProvider>
    }
  }

  it('advances on click event', async () => {
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn' },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })
    expect(result.current.currentStep?.id).toBe('s1')

    await act(async () => {
      document.getElementById('target-btn')?.click()
    })

    // Wait for async state updates
    await vi.waitFor(() => {
      expect(result.current.currentStep?.id).toBe('s2')
    })
  })

  it('advances on input event', async () => {
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-input',
            content: 'Step 1',
            advanceOn: { event: 'input', selector: '#target-input' },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      const input = document.getElementById('target-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await vi.waitFor(() => {
      expect(result.current.currentStep?.id).toBe('s2')
    })
  })

  it('advances on custom event', async () => {
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'custom', selector: '#target-btn' },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      dispatchAdvanceEvent('#target-btn')
    })

    await vi.waitFor(() => {
      expect(result.current.currentStep?.id).toBe('s2')
    })
  })

  it('does not advance when handler returns false', async () => {
    const handler = vi.fn().mockReturnValue(false)

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn', handler },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      document.getElementById('target-btn')?.click()
    })

    // Should not advance because handler returned false
    expect(result.current.currentStep?.id).toBe('s1')
    expect(handler).toHaveBeenCalled()
  })

  it('advances when handler returns true', async () => {
    const handler = vi.fn().mockReturnValue(true)

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn', handler },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      document.getElementById('target-btn')?.click()
    })

    await vi.waitFor(() => {
      expect(result.current.currentStep?.id).toBe('s2')
    })
    expect(handler).toHaveBeenCalled()
  })

  it('warns when selector element not found', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#nonexistent' },
          },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('advanceOn: Element "#nonexistent" not found')
    )

    consoleSpy.mockRestore()
  })

  it('uses document when no selector provided', async () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click' }, // No selector
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

    addEventListenerSpy.mockRestore()
  })

  it('does nothing when tour is inactive', async () => {
    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn' },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    // Tour not started
    expect(result.current.isActive).toBe(false)

    // Click the button - should not advance because tour is not active
    await act(async () => {
      document.getElementById('target-btn')?.click()
    })

    // Still inactive, no step change
    expect(result.current.isActive).toBe(false)
    expect(result.current.currentStepIndex).toBe(0)
  })

  it('cleans up listener on step change', async () => {
    const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn' },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      await result.current.next()
    })

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('cleans up listener on tour stop', async () => {
    const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn' },
          },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('throws error when used outside TourProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAdvanceOn())
    }).toThrow('useAdvanceOn must be used within a TourProvider')

    consoleSpy.mockRestore()
  })

  it('handles handler that throws error', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const handler = vi.fn().mockImplementation(() => {
      throw new Error('Handler error')
    })

    const tours: Tour[] = [
      {
        id: 'test',
        steps: [
          {
            id: 's1',
            target: '#target-btn',
            content: 'Step 1',
            advanceOn: { event: 'click', selector: '#target-btn', handler },
          },
          { id: 's2', target: '#t2', content: 'Step 2' },
        ],
      },
    ]

    const { result } = renderHook(
      () => {
        const tour = useTour()
        useAdvanceOn()
        return tour
      },
      { wrapper: createWrapper(tours) }
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      document.getElementById('target-btn')?.click()
    })

    // Should not advance due to handler error
    expect(result.current.currentStep?.id).toBe('s1')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('advanceOn handler error'),
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })
})

describe('dispatchAdvanceEvent', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = '<button id="target-btn">Click me</button>'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('dispatches custom event on element', () => {
    const handler = vi.fn()
    const btn = document.getElementById('target-btn')
    btn?.addEventListener('tourkit:advance', handler)

    dispatchAdvanceEvent('#target-btn')

    expect(handler).toHaveBeenCalled()
  })

  it('dispatches custom event on document when no selector', () => {
    const handler = vi.fn()
    document.addEventListener('tourkit:advance', handler)

    dispatchAdvanceEvent()

    expect(handler).toHaveBeenCalled()
    document.removeEventListener('tourkit:advance', handler)
  })

  it('does nothing when element not found', () => {
    // Should not throw
    expect(() => {
      dispatchAdvanceEvent('#nonexistent')
    }).not.toThrow()
  })
})
