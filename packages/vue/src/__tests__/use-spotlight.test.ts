import { afterEach, describe, expect, it } from 'vitest'
/**
 * The BRIDGE, not the machine.
 *
 * Since v2 §1.5f the spotlight state machine lives in core's
 * `createSpotlight()` and has its own direct suite there — including the §1.3b
 * retarget regression. Re-asserting it here would be a slow duplicate of a test
 * that already exists, and if the two ever disagreed core's would be right.
 * What is this binding's to prove is the Vue half: a `shallowRef` write per
 * controller notification, and a scope dispose that unsubscribes AND destroys.
 */
import { effectScope, nextTick } from 'vue'
import { useSpotlight } from '../use-spotlight'

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

describe('useSpotlight — the Vue bridge', () => {
  it('mirrors the controller snapshot into reactive refs', () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    expect(s.isVisible.value).toBe(false)
    expect(s.targetRect.value).toBeNull()
    expect(s.cutoutStyle.value).toEqual({})

    s.show(el('a', 10))

    expect(s.isVisible.value).toBe(true)
    expect(s.targetRect.value?.top).toBe(10)
    expect(s.overlayStyle.value).toMatchObject({ position: 'fixed' })
    expect(s.cutoutStyle.value).toMatchObject({ position: 'absolute' })

    scope.stop()
  })

  it('a tracked rect change reaches the refs', async () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    const a = el('a', 10)
    s.show(a)

    a.getBoundingClientRect = () => ({ top: 55, left: 0, width: 1, height: 1 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()
    await nextTick()

    expect(s.targetRect.value?.top).toBe(55)
    scope.stop()
  })

  it('stopping the scope unsubscribes AND destroys the controller', async () => {
    const scope = effectScope()
    const s = scope.run(() => useSpotlight())
    if (!s) throw new Error('scope did not run')

    const a = el('a', 10)
    s.show(a)
    scope.stop()

    // Destroy stops the tracker, so a scroll cannot move the last snapshot the
    // ref saw. A bridge that unsubscribed but leaked the controller would leave
    // a live rAF-throttled listener behind for the life of the page.
    a.getBoundingClientRect = () => ({ top: 777 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()
    await nextTick()

    expect(s.targetRect.value?.top).toBe(10)
  })
})
