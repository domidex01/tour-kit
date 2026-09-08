/**
 * The retarget regression first. `show(a)` then `show(b)` with no `hide()` is a
 * real flow, and the §1.3b execution shipped a version that kept tracking the
 * first node.
 *
 * A leaked tracker is only observable AFTER `hide()`: before it, both trackers
 * fire in registration order and the current one's write lands last either way.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { createSpotlight } from '../create-spotlight'

function el(id: string, top: number) {
  const node = document.createElement('div')
  node.id = id
  node.getBoundingClientRect = () =>
    ({
      top,
      left: 0,
      width: 100,
      height: 20,
      right: 100,
      bottom: top + 20,
      x: 0,
      y: top,
    }) as DOMRect
  document.body.appendChild(node)
  return node
}

const raf = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createSpotlight', () => {
  it('show() seeds the rect synchronously and hide() clears it', () => {
    const s = createSpotlight()

    expect(s.isVisible).toBe(false)
    expect(s.targetRect).toBeNull()

    s.show(el('a', 10))
    expect(s.isVisible).toBe(true)
    expect(s.targetRect?.top).toBe(10)

    s.hide()
    expect(s.isVisible).toBe(false)
    expect(s.targetRect).toBeNull()

    s.destroy()
  })

  it('show(a) then show(b) stops tracking a — the §1.3b retarget regression', async () => {
    const s = createSpotlight()
    const a = el('a', 10)
    const b = el('b', 80)

    s.show(a)
    s.show(b)
    expect(s.targetRect?.top).toBe(80)

    s.hide()
    expect(s.targetRect).toBeNull()

    a.getBoundingClientRect = () => ({ top: 999 }) as DOMRect
    b.getBoundingClientRect = () => ({ top: 888 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()

    expect(s.targetRect).toBeNull()
    s.destroy()
  })

  it('update() works while a target is set, and computeSpotlight drives the styles', () => {
    const s = createSpotlight()
    const a = el('a', 10)

    s.show(a)
    expect(s.overlayStyle).toBeTruthy()
    expect(s.cutoutStyle).toBeTruthy()

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
