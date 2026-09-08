/**
 * The ACTION contract: `update(params)` toggles, `destroy` releases.
 *
 * Restoring focus when the tour ends is `enabled: false` → `deactivate()`,
 * which is the card's call — the same split the React card has.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { focusTrap } from '../focus-trap'

function card() {
  const container = document.createElement('div')
  const inner = document.createElement('button')
  inner.type = 'button'
  inner.id = 'inside'
  container.appendChild(inner)
  document.body.appendChild(container)
  return container
}

function opener() {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.id = 'opener'
  document.body.appendChild(btn)
  btn.focus()
  return btn
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('focusTrap action', () => {
  it('captures and activates on mount, and restores focus when disabled', () => {
    const start = opener()
    const node = card()

    const action = focusTrap(node, { enabled: true })
    expect(document.activeElement?.id).toBe('inside')

    action?.update?.({ enabled: false })
    expect(document.activeElement).toBe(start)

    action?.destroy?.()
  })

  it('enabled: false is inert', () => {
    const start = opener()
    const node = card()

    const action = focusTrap(node, { enabled: false })

    expect(document.activeElement).toBe(start)
    action?.destroy?.()
  })

  it('defaults to enabled when no params are given', () => {
    opener()
    const node = card()

    const action = focusTrap(node, undefined)

    expect(document.activeElement?.id).toBe('inside')
    action?.destroy?.()
  })

  it('destroy restores focus, then releases — the card-unmount path', () => {
    const start = opener()
    const node = card()

    const action = focusTrap(node, { enabled: true })
    expect(document.activeElement?.id).toBe('inside')

    action?.destroy?.()

    // For an action, node destruction IS the card unmounting: a card that
    // vanishes on `Escape` has to hand focus back to whatever opened it. This
    // is what React's `<TourCard>` effect cleanup does.
    expect(document.activeElement).toBe(start)
  })

  it('a fresh action on a released node still traps', () => {
    opener()
    const node = card()

    focusTrap(node, { enabled: true })?.destroy?.()

    // The §1.3b `isTrapping` bug was exactly a release that left the trap
    // unable to re-activate.
    const again = focusTrap(node, { enabled: true })
    expect(document.activeElement?.id).toBe('inside')
    again?.destroy?.()
  })
})
