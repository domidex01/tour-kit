import * as React from 'react'
import { TourKitContext, type TourKitContextValue } from './tourkit-context'
import type { TourKitConfig } from '../types'

export interface TourKitProviderProps {
  children: React.ReactNode
  config?: TourKitConfig
  onTourStart?: (tourId: string) => void
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string, stepIndex: number) => void
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
}

export function TourKitProvider({
  children,
  config = {},
  onTourStart,
  onTourComplete,
  onTourSkip,
  onStepView,
}: TourKitProviderProps) {
  const value = React.useMemo<TourKitContextValue>(
    () => ({
      config,
      onTourStart,
      onTourComplete,
      onTourSkip,
      onStepView,
    }),
    [config, onTourStart, onTourComplete, onTourSkip, onStepView]
  )

  return (
    <TourKitContext.Provider value={value}>{children}</TourKitContext.Provider>
  )
}
