import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getScrollParent } from '../utils/dom'
import { throttleRAF } from '../utils/throttle'

export interface ElementPositionResult {
  element: HTMLElement | null
  rect: DOMRect | null
  scrollParent: HTMLElement | Window | null
  update: () => void
}

export function useElementPosition(target: string | HTMLElement | null): ElementPositionResult {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [scrollParent, setScrollParent] = useState<HTMLElement | Window | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  // Resolve target to element
  useEffect(() => {
    if (!target) {
      setElement(null)
      setScrollParent(null)
      return
    }

    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target)
      setElement(el)
      if (el) {
        setScrollParent(getScrollParent(el))
      }
    } else {
      setElement(target)
      setScrollParent(getScrollParent(target))
    }
  }, [target])

  const update = useCallback(() => {
    if (element) {
      setRect(element.getBoundingClientRect())
    }
  }, [element])

  // Throttle updates to RAF for smooth 60fps during scroll/resize
  const throttledUpdate = useMemo(() => throttleRAF(update), [update])

  useEffect(() => {
    if (!element) {
      setRect(null)
      return
    }

    update()

    // Observe element resize
    observerRef.current = new ResizeObserver(throttledUpdate)
    observerRef.current.observe(element)

    // Listen for window scroll/resize with passive listeners for better performance
    window.addEventListener('scroll', throttledUpdate, { passive: true, capture: true })
    window.addEventListener('resize', throttledUpdate, { passive: true })

    // Also observe scrollable parent's resize if it's not window
    if (scrollParent && scrollParent !== window && scrollParent instanceof HTMLElement) {
      observerRef.current.observe(scrollParent)
    }

    return () => {
      throttledUpdate.cancel()
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', throttledUpdate, true)
      window.removeEventListener('resize', throttledUpdate)
    }
  }, [element, scrollParent, update, throttledUpdate])

  return { element, rect, scrollParent, update }
}
