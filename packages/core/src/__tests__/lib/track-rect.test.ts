/**
 * v2 §1.3b-3 — `trackRect`, the one scroll/resize tracker behind both
 * `useSpotlight` and `useElementPosition`.
 *
 * The load-bearing case here is **construction reads nothing** (US-4).
 * `useSpotlight.show()` seeds `targetRect` itself before its effect runs; an
 * attach-time read would `setTargetRect` a fresh `DOMRect` and cost one extra
 * render per `show()` in a real DOM. Neither hook oracle counts
 * `getBoundingClientRect` calls — both only assert `toHaveBeenCalled()` after a
 * scroll or an explicit `update()` — so an auto-reading tracker passes all 27
 * of their cases silently. This file is the only net.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackRect } from '../../lib/track-rect'
import { type FrameHarness, deferredFrames } from './_helpers/frames'
import { rectOf } from './_helpers/rect'
import { type ResizeObserverStub, stubResizeObserver } from './_helpers/resize-observer'

describe('trackRect', () => {
  let el: HTMLDivElement
  let onRect: ReturnType<typeof vi.fn>
  let frames: FrameHarness

  beforeEach(() => {
    el = document.createElement('div')
    document.body.appendChild(el)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rectOf(100, 100, 200, 100))
    onRect = vi.fn()
    frames = deferredFrames()
  })

  afterEach(() => {
    frames.restore()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('construction reads nothing', () => {
    it('calls neither onRect nor getBoundingClientRect on construction', () => {
      const tracker = trackRect(el, onRect)

      expect(onRect).not.toHaveBeenCalled()
      expect(el.getBoundingClientRect).not.toHaveBeenCalled()

      tracker.stop()
    })

    it('update() reads once, synchronously', () => {
      const tracker = trackRect(el, onRect)

      tracker.update()

      expect(onRect).toHaveBeenCalledTimes(1)
      expect(onRect).toHaveBeenCalledWith(expect.objectContaining({ top: 100, width: 200 }))
      expect(frames.pending()).toBe(0)

      tracker.stop()
    })
  })

  describe('throttled scroll/resize', () => {
    it.each([
      ['scroll', () => window.dispatchEvent(new Event('scroll'))],
      ['resize', () => window.dispatchEvent(new Event('resize'))],
    ])('coalesces repeated %s events into one call per frame', (_label, fire) => {
      const tracker = trackRect(el, onRect)

      fire()
      fire()
      expect(onRect).not.toHaveBeenCalled()
      expect(frames.pending()).toBe(1)

      frames.flush()

      expect(onRect).toHaveBeenCalledTimes(1)
      tracker.stop()
    })
  })

  describe('observeResize', () => {
    let ro: ResizeObserverStub

    beforeEach(() => {
      ro = stubResizeObserver()
    })

    it('observes the element and its HTMLElement scroll parent', () => {
      const scroller = document.createElement('div')
      scroller.style.overflow = 'auto'
      document.body.appendChild(scroller)
      scroller.appendChild(el)

      const tracker = trackRect(el, onRect, { observeResize: true })

      expect(ro.observed()).toContain(el)
      expect(ro.observed()).toContain(scroller)
      tracker.stop()
    })

    it('observes only the element when the scroll parent is the window', () => {
      const tracker = trackRect(el, onRect, { observeResize: true })

      expect(ro.observed()).toEqual([el])
      tracker.stop()
    })

    it('a resize goes through the same frame throttle', () => {
      const tracker = trackRect(el, onRect, { observeResize: true })

      ro.trigger()
      ro.trigger()
      expect(onRect).not.toHaveBeenCalled()

      frames.flush()

      expect(onRect).toHaveBeenCalledTimes(1)
      tracker.stop()
    })

    it('disconnects on stop()', () => {
      const tracker = trackRect(el, onRect, { observeResize: true })

      tracker.stop()

      expect(ro.disconnect).toHaveBeenCalled()
    })

    it('does not construct a ResizeObserver without the option', () => {
      const tracker = trackRect(el, onRect)

      expect(ro.observe).not.toHaveBeenCalled()
      tracker.stop()
    })
  })

  describe('stop()', () => {
    it('is idempotent and silences later events', () => {
      const tracker = trackRect(el, onRect)

      expect(() => {
        tracker.stop()
        tracker.stop()
      }).not.toThrow()

      window.dispatchEvent(new Event('scroll'))
      frames.flush()

      expect(onRect).not.toHaveBeenCalled()
    })

    it('cancels a frame already queued', () => {
      const tracker = trackRect(el, onRect)

      window.dispatchEvent(new Event('scroll'))
      expect(frames.pending()).toBe(1)

      tracker.stop()
      expect(frames.pending()).toBe(0)

      frames.flush()
      expect(onRect).not.toHaveBeenCalled()
    })
  })
})
