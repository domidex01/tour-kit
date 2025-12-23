import { useCallback, useEffect, useRef } from 'react'
import { getFocusableElements } from '../utils/dom'

export interface UseFocusTrapReturn {
  containerRef: React.RefObject<HTMLElement | null>
  activate: () => void
  deactivate: () => void
}

export function useFocusTrap(enabled = true): UseFocusTrapReturn {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const isTrapping = useRef(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isTrapping.current || event.key !== 'Tab' || !containerRef.current) {
      return
    }

    const focusable = getFocusableElements(containerRef.current)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  const activate = useCallback(() => {
    if (!enabled || !containerRef.current) return

    previousActiveElement.current = document.activeElement as HTMLElement
    isTrapping.current = true

    const focusable = getFocusableElements(containerRef.current)
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    document.addEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  const deactivate = useCallback(() => {
    isTrapping.current = false
    document.removeEventListener('keydown', handleKeyDown)

    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return { containerRef, activate, deactivate }
}
