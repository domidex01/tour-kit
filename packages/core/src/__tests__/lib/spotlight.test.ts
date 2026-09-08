/**
 * v2 §1.3b-3 — `computeSpotlight`, the two `useMemo`s from `use-spotlight.ts`
 * as one pure function.
 *
 * The trap for a "verbatim move" is `overlayStyle.backgroundColor`: it is the
 * literal `'transparent'`, and the configured colour reaches the DOM only
 * through the cutout's `boxShadow`. Wiring `config.color` into the overlay
 * passes a careless test and changes rendering.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeSpotlight, createSpotlight } from '../../lib/spotlight'
import { rectOf } from './_helpers/rect'

const RECT = rectOf(100, 100, 200, 100)

describe('computeSpotlight', () => {
  it('returns an overlay and a null cutout with no rect', () => {
    const { overlayStyle, cutoutStyle } = computeSpotlight(null)

    // The hook maps null -> {} for React; the factory returns null so a binding
    // can tell "no target yet" from "an empty style object".
    expect(cutoutStyle).toBeNull()
    expect(overlayStyle.position).toBe('fixed')
    expect(overlayStyle.inset).toBe(0)
    expect(overlayStyle.pointerEvents).toBe('auto')
  })

  it('keeps the overlay transparent and puts the colour in the cutout shadow', () => {
    const { overlayStyle, cutoutStyle } = computeSpotlight(RECT, { color: 'rgba(1, 2, 3, 0.9)' })

    expect(overlayStyle.backgroundColor).toBe('transparent')
    expect(cutoutStyle?.boxShadow).toBe('0 0 0 9999px rgba(1, 2, 3, 0.9)')
  })

  it('insets the cutout by the configured padding', () => {
    const { cutoutStyle } = computeSpotlight(RECT, { padding: 10, borderRadius: 12 })

    expect(cutoutStyle).toMatchObject({
      position: 'absolute',
      top: 90,
      left: 90,
      width: 220,
      height: 120,
      borderRadius: 12,
      pointerEvents: 'none',
    })
  })

  it('falls back to the default padding and radius', () => {
    const { cutoutStyle } = computeSpotlight(RECT, {})

    expect(cutoutStyle?.top).toBe(92)
    expect(cutoutStyle?.width).toBe(216)
    expect(cutoutStyle?.borderRadius).toBe(4)
  })

  it('merges a partial config over the defaults', () => {
    const { cutoutStyle } = computeSpotlight(RECT, { padding: 0 })

    // padding overridden, colour still the default.
    expect(cutoutStyle?.top).toBe(100)
    expect(cutoutStyle?.boxShadow).toBe('0 0 0 9999px rgba(0, 0, 0, 0.5)')
  })

  it('sets transition on BOTH styles when animate is on', () => {
    const { overlayStyle, cutoutStyle } = computeSpotlight(RECT, {
      animate: true,
      animationDuration: 120,
    })

    expect(overlayStyle.transition).toBe('all 120ms ease-out')
    expect(cutoutStyle?.transition).toBe('all 120ms ease-out')
  })

  it('sets transition on NEITHER style when animate is off', () => {
    const { overlayStyle, cutoutStyle } = computeSpotlight(RECT, { animate: false })

    expect(overlayStyle.transition).toBeUndefined()
    expect(cutoutStyle?.transition).toBeUndefined()
  })
})

describe('createSpotlight — the state machine (v2 §1.5f)', () => {
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

  it('getState() is reference-stable between changes', () => {
    // Every binding compares with Object.is — React's useSyncExternalStore, a
    // Vue shallowRef and a Svelte createSubscriber getter alike. A fresh object
    // per call is an infinite render loop.
    const s = createSpotlight()
    expect(s.getState()).toBe(s.getState())

    const first = s.getState()
    s.show(el('a', 10))
    expect(s.getState()).not.toBe(first)
    expect(s.getState()).toBe(s.getState())

    s.destroy()
  })

  it('show() seeds the rect synchronously and notifies once', () => {
    const s = createSpotlight()
    const listener = vi.fn()
    s.subscribe(listener)

    s.show(el('a', 10))

    expect(listener).toHaveBeenCalledTimes(1)
    expect(s.getState().isVisible).toBe(true)
    expect(s.getState().targetRect?.top).toBe(10)
    expect(s.getState().cutoutStyle).toMatchObject({ position: 'absolute' })

    s.destroy()
  })

  it('hide() clears the rect and reports an empty cutout', () => {
    const s = createSpotlight()
    s.show(el('a', 10))
    s.hide()

    expect(s.getState().isVisible).toBe(false)
    expect(s.getState().targetRect).toBeNull()
    expect(s.getState().cutoutStyle).toEqual({})

    s.destroy()
  })

  it('show(a) then show(b) stops tracking a — the §1.3b retarget regression', async () => {
    const s = createSpotlight()
    const a = el('a', 10)
    const b = el('b', 80)

    s.show(a)
    s.show(b)
    expect(s.getState().targetRect?.top).toBe(80)

    // A leaked tracker for `a` is only observable AFTER hide(): before it, both
    // trackers fire in registration order and b's write lands last either way.
    s.hide()
    a.getBoundingClientRect = () => ({ top: 999 }) as DOMRect
    b.getBoundingClientRect = () => ({ top: 888 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()

    expect(s.getState().targetRect).toBeNull()
    s.destroy()
  })

  it('update() re-reads the current target', () => {
    const s = createSpotlight()
    const a = el('a', 10)
    s.show(a)

    a.getBoundingClientRect = () => ({ top: 42, left: 0, width: 1, height: 1 }) as DOMRect
    s.update()

    expect(s.getState().targetRect?.top).toBe(42)
    s.destroy()
  })

  it('update() is inert with no target', () => {
    const s = createSpotlight()
    const listener = vi.fn()
    s.subscribe(listener)

    s.update()

    expect(listener).not.toHaveBeenCalled()
    s.destroy()
  })

  it('unsubscribe stops notifications; destroy() stops the tracker', async () => {
    const s = createSpotlight()
    const listener = vi.fn()
    const off = s.subscribe(listener)
    const a = el('a', 10)

    s.show(a)
    expect(listener).toHaveBeenCalledTimes(1)

    off()
    s.update()
    expect(listener).toHaveBeenCalledTimes(1)

    s.destroy()
    a.getBoundingClientRect = () => ({ top: 777 }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    await raf()

    expect(s.getState().targetRect?.top).toBe(10)
  })

  it('destroy() is idempotent', () => {
    const s = createSpotlight()
    s.show(el('a', 10))
    expect(() => {
      s.destroy()
      s.destroy()
    }).not.toThrow()
  })
})
