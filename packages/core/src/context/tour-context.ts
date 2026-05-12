import { createContext, useContext } from 'react'
import type { TourContextValue, TourStep } from '../types'

export const TourContext = createContext<TourContextValue | null>(null)

TourContext.displayName = 'TourContext'

export function useTourContext<TStep extends TourStep = TourStep>(): TourContextValue<TStep> {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider')
  }

  return context as unknown as TourContextValue<TStep>
}

export function useTourContextOptional<
  TStep extends TourStep = TourStep,
>(): TourContextValue<TStep> | null {
  return useContext(TourContext) as unknown as TourContextValue<TStep> | null
}
