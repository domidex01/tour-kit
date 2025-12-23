import { createContext } from 'react'
import type { TourKitConfig } from '../types'

export interface TourKitContextValue {
  config: TourKitConfig
  // Global callbacks
  onTourStart?: (tourId: string) => void
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string, stepIndex: number) => void
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
}

export const TourKitContext = createContext<TourKitContextValue | null>(null)

TourKitContext.displayName = 'TourKitContext'
