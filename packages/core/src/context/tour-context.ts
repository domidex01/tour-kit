import { createContext, useContext } from 'react'
import type { TourContextValue } from '../types'

export const TourContext = createContext<TourContextValue | null>(null)

TourContext.displayName = 'TourContext'

export function useTourContext(): TourContextValue {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider')
  }

  return context
}
