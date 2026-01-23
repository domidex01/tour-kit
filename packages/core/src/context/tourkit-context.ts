import { createContext, useContext } from 'react'
import type { BranchTarget, TourKitConfig } from '../types'

export interface TourKitContextValue {
  config: TourKitConfig
  /**
   * Resolved text direction ('ltr' or 'rtl')
   * Automatically resolved from config.dir or document.dir
   */
  direction: 'ltr' | 'rtl'
  /**
   * Whether the current direction is RTL
   */
  isRTL: boolean
  // Global callbacks
  onTourStart?: (tourId: string) => void
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string, stepIndex: number) => void
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
  /**
   * Called when a branch action is triggered from a step
   * @param tourId - The current tour ID
   * @param stepId - The step where the action was triggered
   * @param actionId - The action ID that was triggered
   * @param target - The resolved branch target
   */
  onBranchAction?: (tourId: string, stepId: string, actionId: string, target: BranchTarget) => void
  /**
   * Called when branching to a different tour
   * @param fromTourId - The tour being navigated from
   * @param toTourId - The tour being navigated to
   * @param fromStepId - The step where the branch occurred
   */
  onTourBranch?: (fromTourId: string, toTourId: string, fromStepId: string) => void
}

export const TourKitContext = createContext<TourKitContextValue | null>(null)

TourKitContext.displayName = 'TourKitContext'

/**
 * Hook to access TourKit context
 * Provides access to global config, direction (RTL/LTR), and callbacks
 *
 * @throws Error if used outside of TourKitProvider
 */
export function useTourKitContext(): TourKitContextValue {
  const context = useContext(TourKitContext)

  if (!context) {
    throw new Error('useTourKitContext must be used within a TourKitProvider')
  }

  return context
}

/**
 * Hook to access RTL direction information
 * Returns direction ('ltr' | 'rtl') and isRTL boolean
 */
export function useDirection(): { direction: 'ltr' | 'rtl'; isRTL: boolean } {
  const { direction, isRTL } = useTourKitContext()
  return { direction, isRTL }
}
