import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type * as React from 'react'
import { createPortal } from 'react-dom'
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

describe('useFocusTrap - inert background (modal semantics)', () => {
  // The trapped container is portaled to document.body (like TourCard). The
  // testing-library render root is a separate body child standing in for the
  // app background.
  function PortaledTrap({
    enabled = true,
    inert = true,
  }: {
    enabled?: boolean
    inert?: boolean
  }) {
    const { containerRef, activate, deactivate } = useFocusTrap(enabled, {
      inertBackground: inert,
    })
    return (
      <div data-testid="background">
        <button type="button" data-testid="bg-trigger" onClick={activate}>
          Open
        </button>
        <button type="button" data-testid="bg-close" onClick={deactivate}>
          Close
        </button>
        {createPortal(
          <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="trap">
            <button type="button" data-testid="trap-first">
              First
            </button>
          </div>,
          document.body
        )}
      </div>
    )
  }

  beforeEach(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  it('marks background body children inert + aria-hidden on activate and restores on deactivate', async () => {
    const user = userEvent.setup()
    const { container } = render(<PortaledTrap />)
    // testing-library appends `container` directly to document.body, so it is
    // the background body child (the portaled trap is a separate body child).
    const backgroundRoot = container
    expect(backgroundRoot.hasAttribute('inert')).toBe(false)

    await user.click(screen.getByTestId('bg-trigger'))
    expect(backgroundRoot.hasAttribute('inert')).toBe(true)
    expect(backgroundRoot.getAttribute('aria-hidden')).toBe('true')

    await user.click(screen.getByTestId('bg-close'))
    expect(backgroundRoot.hasAttribute('inert')).toBe(false)
    expect(backgroundRoot.hasAttribute('aria-hidden')).toBe(false)
  })

  it('does not touch the background when inertBackground is false', async () => {
    const user = userEvent.setup()
    const { container } = render(<PortaledTrap inert={false} />)
    const backgroundRoot = container

    await user.click(screen.getByTestId('bg-trigger'))
    expect(backgroundRoot.hasAttribute('inert')).toBe(false)
    expect(backgroundRoot.hasAttribute('aria-hidden')).toBe(false)

    await user.click(screen.getByTestId('bg-close'))
  })

  it('does not inert the portal subtree that contains the trap', async () => {
    const user = userEvent.setup()
    render(<PortaledTrap />)

    await user.click(screen.getByTestId('bg-trigger'))
    const trap = screen.getByTestId('trap')
    // Walk up from the trap to its body-level ancestor; it must stay interactive.
    let portalRoot: HTMLElement | null = trap
    while (portalRoot?.parentElement && portalRoot.parentElement !== document.body) {
      portalRoot = portalRoot.parentElement
    }
    expect(portalRoot?.hasAttribute('inert')).toBe(false)

    await user.click(screen.getByTestId('bg-close'))
  })

  // Two concurrent inert-background traps both hide the shared render root.
  // The original state must only be restored when the LAST trap releases, and
  // never re-applied after the first releases.
  function ConcurrentTraps() {
    const a = useFocusTrap(true, { inertBackground: true })
    const b = useFocusTrap(true, { inertBackground: true })
    return (
      <div data-testid="bg">
        <button type="button" data-testid="a-activate" onClick={a.activate}>
          a activate
        </button>
        <button type="button" data-testid="a-deactivate" onClick={a.deactivate}>
          a deactivate
        </button>
        <button type="button" data-testid="b-activate" onClick={b.activate}>
          b activate
        </button>
        <button type="button" data-testid="b-deactivate" onClick={b.deactivate}>
          b deactivate
        </button>
        {createPortal(
          <div ref={a.containerRef as React.RefObject<HTMLDivElement>}>
            <button type="button">a inside</button>
          </div>,
          document.body
        )}
        {createPortal(
          <div ref={b.containerRef as React.RefObject<HTMLDivElement>}>
            <button type="button">b inside</button>
          </div>,
          document.body
        )}
      </div>
    )
  }

  it('ref-counts inert across concurrent traps (no premature/stranded attrs)', async () => {
    const user = userEvent.setup()
    const { container } = render(<ConcurrentTraps />)
    const bg = container // render root — a background body child for both traps

    await user.click(screen.getByTestId('a-activate'))
    await user.click(screen.getByTestId('b-activate'))
    expect(bg.hasAttribute('inert')).toBe(true)
    expect(bg.getAttribute('aria-hidden')).toBe('true')

    // First release: the other trap still holds, so it must stay hidden.
    await user.click(screen.getByTestId('a-deactivate'))
    expect(bg.hasAttribute('inert')).toBe(true)
    expect(bg.getAttribute('aria-hidden')).toBe('true')

    // Last release: original (un-hidden) state restored, not re-applied.
    await user.click(screen.getByTestId('b-deactivate'))
    expect(bg.hasAttribute('inert')).toBe(false)
    expect(bg.hasAttribute('aria-hidden')).toBe(false)
  })
})

describe('useFocusTrap - does not restore a stale trigger', () => {
  // `enabled` is driven via rerender (not a click, which would steal focus) and
  // activate/deactivate are called directly, so the captured element is exactly
  // the programmatically-focused trigger. This mimics a consumer that enabled
  // the trap but never activated it (lazy portal never mounted) before it was
  // disabled, then enabled again from a different trigger.
  let api: { activate: () => void; deactivate: () => void } | null = null
  function Harness({ enabled }: { enabled: boolean }) {
    const trap = useFocusTrap(enabled)
    api = { activate: trap.activate, deactivate: trap.deactivate }
    return (
      <>
        <button type="button" data-testid="trigger-a">
          Trigger A
        </button>
        <button type="button" data-testid="trigger-b">
          Trigger B
        </button>
        <div ref={trap.containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
          <button type="button" data-testid="inside">
            Inside
          </button>
        </div>
      </>
    )
  }

  it('re-captures the trigger when re-enabled after an enable that never activated', () => {
    const { rerender } = render(<Harness enabled={false} />)

    // Cycle 1: focus A, enable (captures A), then disable WITHOUT activating.
    screen.getByTestId('trigger-a').focus()
    rerender(<Harness enabled={true} />)
    rerender(<Harness enabled={false} />)

    // Cycle 2: focus B, enable (must re-capture B, not the stale A), then run a
    // full activate/deactivate — focus must restore to B.
    screen.getByTestId('trigger-b').focus()
    rerender(<Harness enabled={true} />)
    // activate/deactivate are imperative (focus + listeners, no setState).
    api?.activate()
    api?.deactivate()

    expect(screen.getByTestId('trigger-b')).toHaveFocus()
  })
})

describe('useFocusTrap - pulls drifting focus back', () => {
  it('returns focus into the container when Tab is pressed from outside', async () => {
    const user = userEvent.setup()

    function Drifter() {
      const { containerRef, activate } = useFocusTrap(true)
      return (
        <>
          <button type="button" data-testid="outside-1">
            Outside 1
          </button>
          <button type="button" data-testid="open" onClick={activate}>
            Open
          </button>
          <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
            <button type="button" data-testid="inside-first">
              Inside First
            </button>
            <button type="button" data-testid="inside-last">
              Inside Last
            </button>
          </div>
        </>
      )
    }

    render(<Drifter />)
    await user.click(screen.getByTestId('open'))
    expect(screen.getByTestId('inside-first')).toHaveFocus()

    // Programmatically move focus outside the container, then Tab: the trap
    // should pull focus back to the first focusable instead of letting it
    // continue into the background.
    screen.getByTestId('outside-1').focus()
    expect(screen.getByTestId('outside-1')).toHaveFocus()

    await user.tab()
    expect(screen.getByTestId('inside-first')).toHaveFocus()
  })
})
