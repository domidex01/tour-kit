/**
 * The retarget regression FIRST. `show(a)` then `show(b)` with no `hide()` is a
 * real flow — an overlay advances a step that way — and the §1.3b execution
 * shipped a version that kept tracking the first node.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useSpotlight } from '../use-spotlight'

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

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useSpotlight', () => {
  it('show() seeds the rect synchronously and hide() clears it', () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    expect(s.isVisible.value).toBe(false)
    expect(s.targetRect.value).toBeNull()

    s.show(el('a', 10))
    expect(s.isVisible.value).toBe(true)
    expect(s.targetRect.value?.top).toBe(10)

    s.hide()
    expect(s.isVisible.value).toBe(false)
    expect(s.targetRect.value).toBeNull()

    scope.stop()
  })

  it('show(a) then show(b) stops tracking a — the §1.3b retarget regression', async () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    const a = el('a', 10)
    const b = el('b', 80)
    s.show(a)
    s.show(b)
    expect(s.targetRect.value?.top).toBe(80)

    // `hide()` stops the tracker the kit is holding — ONE handle, so a leaked
    // tracker for `a` survives it. Asserting on a scroll *before* hide proves
    // nothing: both trackers would fire in registration order and b's write
    // would land last either way. After hide, any write at all is the leak.
    s.hide()
    expect(s.targetRect.value).toBeNull()

    a.getBoundingClientRect = () => ({ top: 999 }) as DOMRect
    b.getBoundingClientRect = () => ({ top: 888 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await nextTick()

    expect(s.targetRect.value).toBeNull()
    scope.stop()
  })

  it('update() works while hidden, and computeSpotlight drives the styles', () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    const a = el('a', 10)
    s.show(a)
    expect(s.overlayStyle.value).toBeTruthy()
    expect(s.cutoutStyle.value).toBeTruthy()

    a.getBoundingClientRect = () => ({ top: 42, left: 0, width: 1, height: 1 }) as DOMRect
    s.update()
    expect(s.targetRect.value?.top).toBe(42)

    scope.stop()
  })

  it('stopping the scope stops the tracker', async () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    const a = el('a', 10)
    s.show(a)
    scope.stop()

    a.getBoundingClientRect = () => ({ top: 777 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    expect(s.targetRect.value?.top).toBe(10)
  })
})
