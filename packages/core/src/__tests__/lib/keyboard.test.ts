/**
 * v2 §1.3b-2 — `attachKeyboard`, the plain function behind
 * `useKeyboardNavigation`.
 *
 * The 20 cases in `__tests__/hooks/use-keyboard.test.tsx` are the read-only
 * oracle. What they cannot see is the gating seam this phase introduces:
 * `isEnabled` is a PREDICATE evaluated per event, not a subscription
 * (Decision 2), so a binding attaches once at mount and lets the predicate
 * decide. Flipping it must take effect without re-attaching.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { attachKeyboard } from '../../lib/keyboard'

function press(key: string, options: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  document.dispatchEvent(event)
  return event
}

function actions() {
  return { next: vi.fn(), prev: vi.fn(), skip: vi.fn() }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('the three key lists', () => {
  it.each([
    ['ArrowRight', 'next'],
    ['Enter', 'next'],
    ['ArrowLeft', 'prev'],
    ['Escape', 'skip'],
  ] as const)('%s calls %s and preventDefaults', (key, verb) => {
    const a = actions()
    const detach = attachKeyboard(a)

    const event = press(key)

    expect(a[verb]).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
    detach()
  })

  it('ignores an unmapped key', () => {
    const a = actions()
    const detach = attachKeyboard(a)

    const event = press('a')

    expect(a.next).not.toHaveBeenCalled()
    expect(a.prev).not.toHaveBeenCalled()
    expect(a.skip).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    detach()
  })

  it('honours custom key lists over the defaults', () => {
    const a = actions()
    const detach = attachKeyboard(a, { nextKeys: ['n'], prevKeys: ['p'], exitKeys: ['q'] })

    press('n')
    press('p')
    press('q')
    press('ArrowRight')

    expect(a.next).toHaveBeenCalledTimes(1)
    expect(a.prev).toHaveBeenCalledTimes(1)
    expect(a.skip).toHaveBeenCalledTimes(1)
    detach()
  })
})

describe('the editable-target guard', () => {
  function focusable(build: () => HTMLElement): HTMLElement {
    const el = build()
    document.body.appendChild(el)
    el.focus()
    return el
  }

  it.each([
    ['input', () => document.createElement('input')],
    ['textarea', () => document.createElement('textarea')],
    ['select', () => document.createElement('select')],
    [
      'contentEditable',
      () => {
        const el = document.createElement('div')
        el.tabIndex = 0
        // jsdom does not derive isContentEditable from the attribute.
        Object.defineProperty(el, 'isContentEditable', { value: true })
        return el
      },
    ],
    [
      'role="textbox"',
      () => {
        const el = document.createElement('div')
        el.tabIndex = 0
        el.setAttribute('role', 'textbox')
        return el
      },
    ],
  ])('stays silent while focus is in a %s', (_label, build) => {
    const a = actions()
    const detach = attachKeyboard(a)
    focusable(build)

    press('ArrowRight')
    press('ArrowLeft')
    press('Escape')

    expect(a.next).not.toHaveBeenCalled()
    expect(a.prev).not.toHaveBeenCalled()
    expect(a.skip).not.toHaveBeenCalled()
    detach()
  })
})

describe('isEnabled is a per-event predicate, not a subscription', () => {
  it('suppresses every verb while it returns false', () => {
    const a = actions()
    const detach = attachKeyboard(a, undefined, { isEnabled: () => false })

    press('ArrowRight')
    press('ArrowLeft')
    press('Escape')

    expect(a.next).not.toHaveBeenCalled()
    expect(a.prev).not.toHaveBeenCalled()
    expect(a.skip).not.toHaveBeenCalled()
    detach()
  })

  it('re-enables mid-flight with no re-attach', () => {
    // A Vue binding attaches once at mount and passes
    // `() => engine.getState().isActive`. If the predicate were read at attach
    // time, the tour could never become drivable without a re-attach.
    const a = actions()
    let live = false
    const addSpy = vi.spyOn(document, 'addEventListener')
    const detach = attachKeyboard(a, undefined, { isEnabled: () => live })
    const attachCount = addSpy.mock.calls.length

    press('ArrowRight')
    expect(a.next).not.toHaveBeenCalled()

    live = true
    press('ArrowRight')

    expect(a.next).toHaveBeenCalledTimes(1)
    expect(addSpy.mock.calls.length).toBe(attachCount)
    detach()
  })
})

describe('enabled: false', () => {
  it('installs no listener at all', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const a = actions()

    const detach = attachKeyboard(a, { enabled: false })

    expect(addSpy).not.toHaveBeenCalled()
    press('ArrowRight')
    expect(a.next).not.toHaveBeenCalled()
    expect(() => detach()).not.toThrow()
  })
})

describe('detach', () => {
  it('is idempotent and silences later keys', () => {
    const a = actions()
    const detach = attachKeyboard(a)

    expect(() => {
      detach()
      detach()
    }).not.toThrow()

    press('ArrowRight')
    expect(a.next).not.toHaveBeenCalled()
  })
})
