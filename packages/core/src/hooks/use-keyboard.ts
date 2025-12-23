import { useContext, useEffect, useMemo } from 'react'
import { TourContext } from '../context/tour-context'
import type { KeyboardConfig } from '../types'
import { defaultKeyboardConfig } from '../types/config'

export function useKeyboardNavigation(config?: KeyboardConfig): void {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a TourProvider')
  }

  const { isActive, next, prev, skip } = context
  const mergedConfig = useMemo(() => ({ ...defaultKeyboardConfig, ...config }), [config])

  useEffect(() => {
    if (!isActive || !mergedConfig.enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event

      // Ignore if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (mergedConfig.nextKeys?.includes(key)) {
        event.preventDefault()
        next()
      } else if (mergedConfig.prevKeys?.includes(key)) {
        event.preventDefault()
        prev()
      } else if (mergedConfig.exitKeys?.includes(key)) {
        event.preventDefault()
        skip()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, mergedConfig, next, prev, skip])
}
