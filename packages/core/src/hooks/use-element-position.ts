import { useCallback, useEffect, useRef, useState } from 'react'

export function useElementPosition(target: string | HTMLElement | null) {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  // Resolve target to element
  useEffect(() => {
    if (!target) {
      setElement(null)
      return
    }

    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target)
      setElement(el)
    } else {
      setElement(target)
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

    // Listen for scroll/resize
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [element, update])

  return { element, rect, update }
}
