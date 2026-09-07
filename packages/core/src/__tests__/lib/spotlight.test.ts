/**
 * v2 §1.3b-3 — `computeSpotlight`, the two `useMemo`s from `use-spotlight.ts`
 * as one pure function.
 *
 * The trap for a "verbatim move" is `overlayStyle.backgroundColor`: it is the
 * literal `'transparent'`, and the configured colour reaches the DOM only
 * through the cutout's `boxShadow`. Wiring `config.color` into the overlay
 * passes a careless test and changes rendering.
 */
import { describe, expect, it } from 'vitest'
import { computeSpotlight } from '../../lib/spotlight'
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
