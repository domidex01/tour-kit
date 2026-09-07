/**
 * v2 §1.3b-1 — `createFocusTrap`, the plain function behind `useFocusTrap`.
 *
 * The 20 cases in `__tests__/hooks/use-focus-trap.test.tsx` are the read-only
 * oracle for the React surface; this file covers what that oracle structurally
 * cannot see, plus the two-phase contract the factory makes explicit:
 *
 *  - `capture()` and `activate()` are separate phases, because `TourPortal` and
 *    `FloatingPortal` mount their node AFTER the render in which the trap
 *    becomes enabled. By the time `activate()` runs, `document.activeElement`
 *    has already drifted to `<body>`.
 *  - the empty-container branch focuses the container ITSELF — the oracle case
 *    (`use-focus-trap.test.tsx:177`) only asserts "does not throw".
 *  - nested `inert` releases in BOTH orders — the oracle covers A-then-B only.
 *  - `release()` must NOT move focus. That is the only thing distinguishing it
 *    from `deactivate()`, and the oracle's unmount case never checks it.
 *
 * No React and no @testing-library anywhere in this directory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFocusTrap } from '../../lib/focus-trap'

/** A container with `n` buttons, appended to `document.body`. */
function makeContainer(n = 2): { container: HTMLDivElement; buttons: HTMLButtonElement[] } {
  const container = document.createElement('div')
  container.tabIndex = -1
  const buttons = Array.from({ length: n }, (_, i) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = `b${i}`
    container.appendChild(button)
    return button
  })
  document.body.appendChild(container)
  return { container, buttons }
}

function tab(options: { shift?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: !!options.shift,
    bubbles: true,
    cancelable: true,
  })
  document.dispatchEvent(event)
  return event
}

let trigger: HTMLButtonElement

beforeEach(() => {
  trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.textContent = 'open'
  document.body.appendChild(trigger)
})

afterEach(() => {
  // `applyBackgroundInert` walks document.body.children — one stranded node from
  // an earlier case turns the inert assertions into order-dependent flakes.
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('the two-phase contract', () => {
  it('restores focus to the element captured at enable, not the one active at activate', () => {
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.capture()
    // The lazy portal mounts here; focus drifts to <body> in between.
    document.body.focus()
    ;(document.activeElement as HTMLElement | null)?.blur()

    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })

  it('activate() alone still captures, as a last resort', () => {
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })

  it('capture() twice keeps the first element', () => {
    const { container } = makeContainer()
    const second = document.createElement('button')
    document.body.appendChild(second)
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.capture()
    second.focus()
    trap.capture()

    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })

  it('activate() twice does not re-capture', () => {
    const { container, buttons } = makeContainer()
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.activate()
    expect(document.activeElement).toBe(buttons[0])

    // A StrictMode double-effect: the second activate() must not record the
    // first focusable as the thing to restore to.
    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })

  it('activate() is a no-op when the container getter returns null', () => {
    const trap = createFocusTrap(() => null)

    trigger.focus()

    expect(() => trap.activate()).not.toThrow()
    expect(document.activeElement).toBe(trigger)
  })
})

describe('forget()', () => {
  it('clears the record so the next capture() takes the CURRENT trigger', () => {
    // enabled -> false with no activate() in between: a lazy portal that never
    // mounted. Without forget(), the next enable would restore focus to a
    // trigger that is no longer the one the user came from.
    const { container } = makeContainer()
    const other = document.createElement('button')
    document.body.appendChild(other)
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.capture()
    trap.forget()

    other.focus()
    trap.capture()
    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(other)
  })

  it('without forget(), the first captured trigger still wins', () => {
    const { container } = makeContainer()
    const other = document.createElement('button')
    document.body.appendChild(other)
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.capture()

    other.focus()
    trap.capture()
    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })

  it('is a no-op while trapping', () => {
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.capture()
    trap.activate()
    trap.forget()
    trap.deactivate()

    expect(document.activeElement).toBe(trigger)
  })
})

describe('Tab handling', () => {
  it('wraps Tab on the last focusable back to the first', () => {
    const { container, buttons } = makeContainer(3)
    const trap = createFocusTrap(() => container)
    trap.activate()

    buttons[2].focus()
    const event = tab()

    expect(document.activeElement).toBe(buttons[0])
    expect(event.defaultPrevented).toBe(true)
    trap.release()
  })

  it('wraps Shift+Tab on the first focusable back to the last', () => {
    const { container, buttons } = makeContainer(3)
    const trap = createFocusTrap(() => container)
    trap.activate()

    buttons[0].focus()
    const event = tab({ shift: true })

    expect(document.activeElement).toBe(buttons[2])
    expect(event.defaultPrevented).toBe(true)
    trap.release()
  })

  it('leaves an interior Tab alone', () => {
    const { container, buttons } = makeContainer(3)
    const trap = createFocusTrap(() => container)
    trap.activate()

    buttons[1].focus()
    const event = tab()

    expect(document.activeElement).toBe(buttons[1])
    expect(event.defaultPrevented).toBe(false)
    trap.release()
  })

  it('pulls drifted focus back to the first focusable', () => {
    const { container, buttons } = makeContainer(2)
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const trap = createFocusTrap(() => container)
    trap.activate()

    outside.focus()
    const event = tab()

    expect(document.activeElement).toBe(buttons[0])
    expect(event.defaultPrevented).toBe(true)
    trap.release()
  })

  it('focuses the container itself when nothing inside is focusable', () => {
    const { container } = makeContainer(0)
    const focusSpy = vi.spyOn(container, 'focus')
    const trap = createFocusTrap(() => container)
    trap.activate()
    focusSpy.mockClear()

    const event = tab()

    // The oracle case asserts only "does not throw"; the branch that keeps Tab
    // from escaping an empty dialog is otherwise untested.
    expect(focusSpy).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
    trap.release()
  })

  it('ignores keys other than Tab', () => {
    const { container, buttons } = makeContainer(2)
    const trap = createFocusTrap(() => container)
    trap.activate()

    buttons[1].focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(document.activeElement).toBe(buttons[1])
    trap.release()
  })
})

describe('inertBackground', () => {
  function background(): { plain: HTMLElement; preset: HTMLElement } {
    const plain = document.createElement('section')
    const preset = document.createElement('section')
    preset.setAttribute('aria-hidden', 'false')
    document.body.append(plain, preset)
    return { plain, preset }
  }

  it('marks body siblings and restores their ORIGINAL attributes', () => {
    const { plain, preset } = background()
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container, { inertBackground: true })

    trap.activate()

    expect(plain.hasAttribute('inert')).toBe(true)
    expect(plain.getAttribute('aria-hidden')).toBe('true')
    expect(preset.getAttribute('aria-hidden')).toBe('true')

    trap.deactivate()

    expect(plain.hasAttribute('inert')).toBe(false)
    expect(plain.hasAttribute('aria-hidden')).toBe(false)
    // Restored, not removed.
    expect(preset.getAttribute('aria-hidden')).toBe('false')
  })

  it('leaves the subtree containing the container interactive', () => {
    const portal = document.createElement('div')
    document.body.appendChild(portal)
    const container = document.createElement('div')
    portal.appendChild(container)
    const trap = createFocusTrap(() => container, { inertBackground: true })

    trap.activate()

    expect(portal.hasAttribute('inert')).toBe(false)
    trap.release()
  })

  it('does not touch the background when the option is off', () => {
    const { plain } = background()
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container)

    trap.activate()

    expect(plain.hasAttribute('inert')).toBe(false)
    trap.release()
  })

  it.each([
    ['A then B', 0],
    ['B then A', 1],
  ])('ref-counts nested traps released %s', (_label, releaseSecondFirst) => {
    const { plain, preset } = background()
    const a = makeContainer().container
    const b = makeContainer().container
    const trapA = createFocusTrap(() => a, { inertBackground: true })
    const trapB = createFocusTrap(() => b, { inertBackground: true })

    trapA.activate()
    trapB.activate()

    // Both traps hold the background; releasing one must not restore it.
    const [first, second] = releaseSecondFirst ? [trapB, trapA] : [trapA, trapB]
    first.deactivate()

    expect(plain.hasAttribute('inert')).toBe(true)
    expect(preset.getAttribute('aria-hidden')).toBe('true')

    second.deactivate()

    expect(plain.hasAttribute('inert')).toBe(false)
    expect(plain.hasAttribute('aria-hidden')).toBe(false)
    expect(preset.getAttribute('aria-hidden')).toBe('false')
  })
})

describe('release()', () => {
  it('removes the Tab handler and restores inert WITHOUT moving focus', () => {
    const plain = document.createElement('section')
    document.body.appendChild(plain)
    const { container, buttons } = makeContainer(2)
    const trap = createFocusTrap(() => container, { inertBackground: true })

    trigger.focus()
    trap.capture()
    trap.activate()
    buttons[1].focus()

    trap.release()

    // deactivate() would have sent focus back to `trigger`. release() is the
    // unmount path and must leave it exactly where it was.
    expect(document.activeElement).toBe(buttons[1])
    expect(plain.hasAttribute('inert')).toBe(false)

    buttons[1].focus()
    tab()
    expect(document.activeElement).toBe(buttons[1])
  })

  it('is idempotent', () => {
    const { container } = makeContainer()
    const trap = createFocusTrap(() => container)
    trap.activate()

    expect(() => {
      trap.release()
      trap.release()
    }).not.toThrow()
  })

  it('leaves the trap re-armable — activate() after release() engages again', () => {
    // A binding that wires close -> release() and open -> activate() must get a
    // live trap the second time. `activate()` bails on its own idempotence
    // guard, so release() has to clear the trapping flag or the reopened card
    // has no focus move, no Tab handler and no inert — failing silently.
    const { container, buttons } = makeContainer(2)
    const trap = createFocusTrap(() => container)

    trap.activate()
    trap.release()
    trigger.focus()

    trap.activate()
    expect(document.activeElement).toBe(buttons[0])

    // The Tab handler is live again, not just the focus move.
    buttons[1].focus()
    tab()
    expect(document.activeElement).toBe(buttons[0])

    // afterEach clears the body but not document-level listeners — a trap left
    // armed here would preventDefault the next case's Tab.
    trap.release()
  })
})

describe('deactivate()', () => {
  it('is idempotent and removes the listener', () => {
    const { container, buttons } = makeContainer(2)
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.activate()
    trap.deactivate()
    expect(() => trap.deactivate()).not.toThrow()

    buttons[1].focus()
    const event = tab()
    expect(event.defaultPrevented).toBe(false)
  })

  it('re-activating after deactivate re-captures the current trigger', () => {
    const { container } = makeContainer()
    const other = document.createElement('button')
    document.body.appendChild(other)
    const trap = createFocusTrap(() => container)

    trigger.focus()
    trap.activate()
    trap.deactivate()

    other.focus()
    trap.activate()
    trap.deactivate()

    expect(document.activeElement).toBe(other)
  })
})
