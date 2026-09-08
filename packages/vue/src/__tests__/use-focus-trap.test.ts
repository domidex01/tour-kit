/**
 * The two-phase contract. `capture()` records `document.activeElement` as the
 * return target BEFORE the card mounts; `activate()` moves focus once it
 * exists. Capturing at activate time records the card itself, and `Escape`
 * then returns focus to nothing.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { useFocusTrap } from '../use-focus-trap'

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

describe('useFocusTrap', () => {
  it('captures before activation and restores focus on deactivate', async () => {
    const start = opener()
    const enabled = shallowRef(false)
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(enabled))
    if (!trap) throw new Error('scope did not run')

    // Enable BEFORE the container exists — the real order: the card mounts on
    // the next tick.
    enabled.value = true
    await nextTick()

    trap.containerRef.value = card()
    trap.activate()
    expect(document.activeElement?.id).toBe('inside')

    trap.deactivate()
    expect(document.activeElement).toBe(start)

    scope.stop()
  })

  it('activate() is inert while disabled', async () => {
    const start = opener()
    const enabled = shallowRef(false)
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(enabled))
    if (!trap) throw new Error('scope did not run')

    trap.containerRef.value = card()
    trap.activate()
    await nextTick()

    expect(document.activeElement).toBe(start)
    scope.stop()
  })

  it('stopping the scope releases the trap without restoring focus', async () => {
    opener()
    const enabled = shallowRef(true)
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(enabled))
    if (!trap) throw new Error('scope did not run')

    trap.containerRef.value = card()
    trap.activate()
    expect(document.activeElement?.id).toBe('inside')

    scope.stop()

    // release() is the unmount path: no focus restore, and the Tab handler is
    // gone. Re-activating after a release must still work (the §1.3b
    // `isTrapping` bug was exactly this).
    expect(document.activeElement?.id).toBe('inside')
  })
})
