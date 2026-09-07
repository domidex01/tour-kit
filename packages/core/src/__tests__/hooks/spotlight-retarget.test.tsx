/**
 * v2 §1.3b-3 regression — `show(a)` then `show(b)` with no `hide()` between.
 *
 * `TourOverlay` (both variants) advances a step by calling `show(newTarget)`
 * directly; `isVisible` never goes false in between. Before §1.3b the
 * scroll/resize handler read `targetRef.current` at call time, so it followed
 * the swap for free. `trackRect` takes a concrete element, so the wrapper's
 * effect has to re-run on a retarget or the spotlight silently keeps tracking
 * the previous step's element.
 *
 * None of the 15 `use-spotlight` oracle cases exercises a retarget, which is
 * why this lives in its own file rather than being caught there.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpotlight } from '../../hooks/use-spotlight'

function targetAt(top: number): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    left: 0,
    width: 10,
    height: 10,
    bottom: top + 10,
    right: 10,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect)
  return el
}

beforeEach(() => {
  // Synchronous frames, the idiom the hook suites already use.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('useSpotlight retargeting', () => {
  it('tracks the NEW target after show() is called again while visible', () => {
    const first = targetAt(100)
    const second = targetAt(500)
    const { result } = renderHook(() => useSpotlight())

    act(() => result.current.show(first))
    act(() => result.current.show(second))

    // A scroll must now report the second target's rect, not the first's.
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.targetRect?.top).toBe(500)
  })

  it('stops tracking the old target entirely', () => {
    const first = targetAt(100)
    const second = targetAt(500)
    const { result } = renderHook(() => useSpotlight())

    act(() => result.current.show(first))
    ;(first.getBoundingClientRect as ReturnType<typeof vi.fn>).mockClear()

    act(() => result.current.show(second))
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(first.getBoundingClientRect).not.toHaveBeenCalled()
  })
})
