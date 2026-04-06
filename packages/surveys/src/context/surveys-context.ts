import { createContext, useContext } from 'react'
import type { SurveysContextValue } from '../types/context'

export const SurveysContext = createContext<SurveysContextValue | null>(null)

SurveysContext.displayName = 'SurveysContext'

export function useSurveysContext(): SurveysContextValue {
  const context = useContext(SurveysContext)
  if (!context) {
    throw new Error('useSurveysContext must be used within a SurveysProvider')
  }
  return context
}
