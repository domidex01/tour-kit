import * as React from 'react'
import { useAdoptionContext } from '../context/adoption-context'
import type { Feature } from '../types'

export interface UseNudgeReturn {
  /** Features that should be nudged */
  pendingNudges: Feature[]
  /** Whether there are any pending nudges */
  hasNudges: boolean
  /** Show nudge for a feature (marks as shown) */
  showNudge: (featureId: string) => void
  /** Dismiss nudge permanently */
  dismissNudge: (featureId: string) => void
  /** Snooze nudge for a duration */
  snoozeNudge: (featureId: string, durationMs: number) => void
  /** Handle nudge click (tracks usage and dismisses) */
  handleNudgeClick: (featureId: string) => void
}

/**
 * Hook to manage nudge state and actions
 */
export function useNudge(): UseNudgeReturn {
  const { pendingNudges, showNudge, dismissNudge, snoozeNudge, trackUsage } = useAdoptionContext()

  const handleNudgeClick = React.useCallback(
    (featureId: string) => {
      trackUsage(featureId)
      dismissNudge(featureId)
    },
    [trackUsage, dismissNudge]
  )

  return {
    pendingNudges,
    hasNudges: pendingNudges.length > 0,
    showNudge,
    dismissNudge,
    snoozeNudge,
    handleNudgeClick,
  }
}
