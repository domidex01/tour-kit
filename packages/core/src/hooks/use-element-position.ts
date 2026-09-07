import { useCallback, useEffect, useState } from 'react'
import { trackRect } from '../lib/track-rect'
import type { TourTarget } from '../types/target'
import { getElement, getScrollParent } from '../utils/dom'

export interface ElementPositionResult {
  element: HTMLElement | null
  rect: DOMRect | null
  scrollParent: HTMLElement | Window | null
  update: () => void
}

/**
 * Subscribe to a target's position. Accepts every `TourTarget` shape (string
 * selector, `RefObject`, getter) plus a direct `HTMLElement` for callers that
 * already hold the resolved node. Resolution flows through `getElement`, which
 * delegates the union branches to `resolveTarget`.
 *
 * A React wrapper over `trackRect` (`lib/track-rect.ts`). `update` stays a
 * hook-owned callback because it must no-op on a null element, before any
 * tracker exists.
 */
export function useElementPosition(target: TourTarget | HTMLElement | null): ElementPositionResult {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [scrollParent, setScrollParent] = useState<HTMLElement | Window | null>(null)

  // Resolve target to element
  useEffect(() => {
    const el = getElement(target)
    setElement(el)
    setScrollParent(el ? getScrollParent(el) : null)
  }, [target])

  const update = useCallback(() => {
    if (element) {
      setRect(element.getBoundingClientRect())
    }
  }, [element])

  useEffect(() => {
    if (!element) {
      setRect(null)
      return
    }

    const tracker = trackRect(element, setRect, { observeResize: true })
    // The synchronous first read this hook has always done on attach — unlike
    // `useSpotlight`, nothing has seeded the rect here.
    tracker.update()
    return tracker.stop
  }, [element])

  return { element, rect, scrollParent, update }
}
