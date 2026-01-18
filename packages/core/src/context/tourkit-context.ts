import { createContext, useContext } from 'react'
import type { TourKitConfig } from '../types'

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
