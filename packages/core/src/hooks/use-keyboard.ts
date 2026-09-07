import { useContext, useEffect, useMemo } from 'react'
import { TourContext } from '../context/tour-context'
import { attachKeyboard } from '../lib/keyboard'
import type { KeyboardConfig } from '../types'
import { defaultKeyboardConfig } from '../types/config'

/**
 * React wrapper over `attachKeyboard` (`lib/keyboard.ts`). The effect's
 * `isActive` dep is the gate — the factory's `isEnabled` predicate exists for
 * bindings that attach once and never re-run.
 */
export function useKeyboardNavigation(config?: KeyboardConfig): void {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a TourProvider')
  }

  const { isActive, next, prev, skip } = context
  const mergedConfig = useMemo(() => ({ ...defaultKeyboardConfig, ...config }), [config])

  useEffect(() => {
    if (!isActive || !mergedConfig.enabled) return
    return attachKeyboard({ next, prev, skip }, mergedConfig)
  }, [isActive, mergedConfig, next, prev, skip])
}
