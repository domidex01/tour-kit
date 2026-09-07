import { useContext, useEffect } from 'react'
import { TourContext } from '../context/tour-context'
import { bindStepAdvance } from '../lib/advance-on'

export { dispatchAdvanceEvent } from '../lib/advance-on'

export interface UseAdvanceOnOptions {
  /** Enable/disable the advanceOn behavior (default: true) */
  enabled?: boolean
}

/**
 * Hook to handle advanceOn behavior - automatically advances tour when
 * user performs specified action on target element.
 *
 * A React wrapper over `bindStepAdvance` (`lib/advance-on.ts`). The engine-level
 * equivalent for a non-React binding is `attachAdvanceOn(engine)`.
 */
export function useAdvanceOn(options: UseAdvanceOnOptions = {}): void {
  const { enabled = true } = options
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useAdvanceOn must be used within a TourProvider')
  }

  const { isActive, currentStep, next } = context

  useEffect(() => {
    if (!enabled || !isActive || !currentStep) return
    return bindStepAdvance(currentStep, next)
  }, [enabled, isActive, currentStep, next])
}
