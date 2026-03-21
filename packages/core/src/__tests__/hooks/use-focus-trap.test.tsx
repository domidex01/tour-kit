import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFocusTrap } from '../../hooks/use-focus-trap'
import {
  createEventListenerTracker,
  createFunctionIdentityChecker,
} from '../utils/cleanup-test-utils'

function TestComponent({ enabled = true }: { enabled?: boolean }) {
  const { containerRef, activate, deactivate } = useFocusTrap(enabled)

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
      <button type="button" data-testid="first">
        First
      </button>
      <button type="button" data-testid="second">
        Second
      </button>
      <button type="button" data-testid="third">
        Third
      </button>
      <button type="button" onClick={activate} data-testid="activate">
        Activate
      </button>
      <button type="button" onClick={deactivate} data-testid="deactivate">
        Deactivate
      </button>
    </div>
  )
}

function TestComponentWithExternal({ enabled = true }: { enabled?: boolean }) {
  const { containerRef, activate, deactivate } = useFocusTrap(enabled)

  return (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <button type="button" onClick={activate} data-testid="external-activate">
        External Activate
      </button>
      <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
        <button type="button" data-testid="first">
          First
        </button>
        <button type="button" data-testid="second">
          Second
        </button>
        <button type="button" data-testid="third">
          Third
        </button>
        <button type="button" onClick={activate} data-testid="activate">
          Activate
        </button>
        <button type="button" onClick={deactivate} data-testid="deactivate">
          Deactivate
        </button>
      </div>
    </>
  )
}

function EmptyContainerComponent() {
  const { containerRef, activate } = useFocusTrap(true)

  return (
    <>
      <button type="button" data-testid="trigger" onClick={activate}>
        Trigger
      </button>
      <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="empty-container">
        {/* No focusable elements */}
        <span>Not focusable</span>
      </div>
    </>
  )
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Clear any previous focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  it('returns containerRef, activate, and deactivate', () => {
    render(<TestComponent />)

    expect(screen.getByTestId('container')).toBeInTheDocument()
    expect(screen.getByTestId('activate')).toBeInTheDocument()
    expect(screen.getByTestId('deactivate')).toBeInTheDocument()
  })

  it('focuses first focusable element on activate', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))

    expect(screen.getByTestId('first')).toHaveFocus()
  })

  it('traps Tab at last element', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))
    expect(screen.getByTestId('first')).toHaveFocus()

    // Tab through all elements
    await user.tab() // Second
    expect(screen.getByTestId('second')).toHaveFocus()

    await user.tab() // Third
    expect(screen.getByTestId('third')).toHaveFocus()

    await user.tab() // Activate button
    expect(screen.getByTestId('activate')).toHaveFocus()

    await user.tab() // Deactivate button
    expect(screen.getByTestId('deactivate')).toHaveFocus()

    await user.tab() // Should wrap to First
    expect(screen.getByTestId('first')).toHaveFocus()
  })

  it('traps Shift+Tab at first element', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))
    expect(screen.getByTestId('first')).toHaveFocus()

    // Shift+Tab should wrap to last
    await user.tab({ shift: true })

    expect(screen.getByTestId('deactivate')).toHaveFocus()
  })

  it('restores focus on deactivate', async () => {
    const user = userEvent.setup()
    render(<TestComponentWithExternal />)

    // Click external activate button (outside the trap container)
    // This will save 'external-activate' as previousActiveElement
    await user.click(screen.getByTestId('external-activate'))
    expect(screen.getByTestId('first')).toHaveFocus()

    // Deactivate trap - focus should return to external-activate
    // (the element that was focused when activate was called)
    await user.click(screen.getByTestId('deactivate'))
    expect(screen.getByTestId('external-activate')).toHaveFocus()
  })

  it('does nothing when disabled', async () => {
    const user = userEvent.setup()
    render(<TestComponentWithExternal enabled={false} />)

    // Focus outside
    screen.getByTestId('outside').focus()
    expect(screen.getByTestId('outside')).toHaveFocus()

    // Try to activate trap
    await user.click(screen.getByTestId('activate'))

    // Focus should remain where it was (on activate button after click)
    expect(screen.getByTestId('first')).not.toHaveFocus()
  })

  it('handles empty container without error', async () => {
    const user = userEvent.setup()
    render(<EmptyContainerComponent />)

    // Should not throw
    await user.click(screen.getByTestId('trigger'))

    // No error should occur
    expect(screen.getByTestId('empty-container')).toBeInTheDocument()
  })

  it('removes event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const user = userEvent.setup()

    const { unmount } = render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('removes event listener on deactivate', async () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))
    await user.click(screen.getByTestId('deactivate'))

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('adds event listener on activate', async () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByTestId('activate'))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    addEventListenerSpy.mockRestore()
  })
})

describe('useFocusTrap - memory leak prevention', () => {
  let tracker: ReturnType<typeof createEventListenerTracker>

  beforeEach(() => {
    tracker = createEventListenerTracker(document)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  afterEach(() => {
    tracker.cleanup()
  })

  it('does not leak listeners after multiple activate/deactivate cycles', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    // Perform multiple activate/deactivate cycles
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByTestId('activate'))
      await user.click(screen.getByTestId('deactivate'))
    }

    tracker.assertNoLeaks()
  })

  it('does not leak listeners after rapid activate calls', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    // Rapid activate calls without deactivate
    await user.click(screen.getByTestId('activate'))
    await user.click(screen.getByTestId('activate'))
    await user.click(screen.getByTestId('activate'))

    // Should only have one listener
    expect(tracker.getListenerCount('keydown')).toBe(1)

    await user.click(screen.getByTestId('deactivate'))
    tracker.assertNoLeaks()
  })

  it('maintains function identity stability across rerenders', () => {
    const checker = createFunctionIdentityChecker()
    const { result, rerender } = renderHook(() => useFocusTrap())

    checker.record('activate', result.current.activate)
    checker.record('deactivate', result.current.deactivate)

    // Rerender multiple times
    for (let i = 0; i < 3; i++) {
      rerender()
      checker.assertStable('activate', result.current.activate)
      checker.assertStable('deactivate', result.current.deactivate)
    }
  })

  it('cleans up properly when enabled prop changes', async () => {
    const user = userEvent.setup()

    function ToggleComponent() {
      const [enabled, setEnabled] = useState(true)
      const { containerRef, activate, deactivate } = useFocusTrap(enabled)

      return (
        <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
          <button type="button" data-testid="first">
            First
          </button>
          <button type="button" onClick={activate} data-testid="activate">
            Activate
          </button>
          <button type="button" onClick={deactivate} data-testid="deactivate">
            Deactivate
          </button>
          <button type="button" onClick={() => setEnabled((e: boolean) => !e)} data-testid="toggle">
            Toggle
          </button>
        </div>
      )
    }

    const { unmount } = render(<ToggleComponent />)

    await user.click(screen.getByTestId('activate'))
    await user.click(screen.getByTestId('toggle')) // Disable
    await user.click(screen.getByTestId('deactivate'))

    unmount()
    tracker.assertNoLeaks()
  })
})
