import { useCallback, useEffect, useRef, useState } from 'react'
import { getScrollParent } from '../utils/dom'

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

  useEffect(() => {
    if (!element) {
      setRect(null)
      return
    }

    update()

    // Observe element resize
    observerRef.current = new ResizeObserver(update)
    observerRef.current.observe(element)

    // Listen for window scroll/resize (with capture to catch all scroll events)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    // Also observe scrollable parent's resize if it's not window
    if (scrollParent && scrollParent !== window && scrollParent instanceof HTMLElement) {
      observerRef.current.observe(scrollParent)
    }

    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [element, scrollParent, update])

  return { element, rect, scrollParent, update }
}
