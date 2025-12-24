import { createContext, useContext } from 'react'
import type { HintsContextValue } from '../types'

export const HintsContext = createContext<HintsContextValue | null>(null)

HintsContext.displayName = 'HintsContext'

export function useHintsContext(): HintsContextValue {
  const context = useContext(HintsContext)
  if (!context) {
    throw new Error('useHintsContext must be used within a HintsProvider')
  }
  return context
}
