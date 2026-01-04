import { createContext, useContext } from 'react'
import type { Feature, FeatureUsage, FeatureWithUsage, NudgeState } from '../types'

export interface AdoptionContextValue {
  // State
  features: Feature[]
  usageMap: Record<string, FeatureUsage>
  nudgeState: NudgeState

  // Actions
  trackUsage: (featureId: string) => void
  getFeature: (featureId: string) => FeatureWithUsage | null
  showNudge: (featureId: string) => void
  dismissNudge: (featureId: string) => void
  snoozeNudge: (featureId: string, durationMs: number) => void

  // Computed
  pendingNudges: Feature[]
}

export const AdoptionContext = createContext<AdoptionContextValue | null>(null)

export function useAdoptionContext(): AdoptionContextValue {
  const context = useContext(AdoptionContext)
  if (!context) {
    throw new Error('useAdoptionContext must be used within AdoptionProvider')
  }
  return context
}
