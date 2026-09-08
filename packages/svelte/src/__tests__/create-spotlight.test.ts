/**
 * The BRIDGE, not the machine.
 *
 * Since v2 §1.5f the spotlight state machine lives in core's
 * `createSpotlight()` and has its own direct suite there — including the §1.3b
 * retarget regression. Re-asserting it here would be a slow duplicate of a test
 * that already exists, and if the two ever disagreed core's would be right.
 * What is this binding's to prove is the Svelte half: the `createSubscriber`
 * getters read through to the controller, and `destroy` reaches it.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { createSpotlight } from '../create-spotlight'

function el(id: string, top: number) {
  const node = document.createElement('div')
  node.id = id
  node.getBoundingClientRect = () =>
    ({ top, left: 0, width: 100, height: 20, right: 100, bottom: top + 20 }) as DOMRect
  document.body.appendChild(node)
  return node
}

const raf = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createSpotlight — the Svelte bridge', () => {
  it('the getters read the controller snapshot', () => {
    const s = createSpotlight()

    expect(s.isVisible).toBe(false)
    expect(s.targetRect).toBeNull()
    expect(s.cutoutStyle).toEqual({})

    s.show(el('a', 10))

    expect(s.isVisible).toBe(true)
    expect(s.targetRect?.top).toBe(10)
    expect(s.overlayStyle).toMatchObject({ position: 'fixed' })
    expect(s.cutoutStyle).toMatchObject({ position: 'absolute' })

    s.destroy()
  })

  it('hide() reaches the controller', () => {
    const s = createSpotlight()
    s.show(el('a', 10))
    s.hide()

    expect(s.isVisible).toBe(false)
    expect(s.targetRect).toBeNull()

    s.destroy()
  })

  it('a tracked rect change is visible through the getters', async () => {
    const s = createSpotlight()
    const a = el('a', 10)
    s.show(a)

    a.getBoundingClientRect = () => ({ top: 55, left: 0, width: 1, height: 1 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()

    expect(s.targetRect?.top).toBe(55)
    s.destroy()
  })

  it('update() re-reads the current target', () => {
    const s = createSpotlight()
    const a = el('a', 10)
    s.show(a)

    a.getBoundingClientRect = () => ({ top: 42, left: 0, width: 1, height: 1 }) as DOMRect
    s.update()

    expect(s.targetRect?.top).toBe(42)
    s.destroy()
  })

  it('destroy() stops the tracker', async () => {
    const s = createSpotlight()
    const a = el('a', 10)
    s.show(a)
    s.destroy()

    a.getBoundingClientRect = () => ({ top: 777 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()

    expect(s.targetRect?.top).toBe(10)
  })
})
