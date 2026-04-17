'use client'

import * as React from 'react'
import { useAdoptionContext } from '../context/adoption-context'
import { createInitialUsage } from '../engine'
import type { AdoptionStatus, Feature, FeatureUsage } from '../types'

export interface UseFeatureReturn {
  /** Feature definition */
  feature: Feature | null
  /** Current usage data */
  usage: FeatureUsage
  /** Whether feature is adopted */
  isAdopted: boolean
  /** Current adoption status */
  status: AdoptionStatus
  /** Number of times feature has been used */
  useCount: number
  /** Manually track a feature usage */
  trackUsage: () => void
}

/**
 * Hook to track and query a single feature's adoption state
 */
export function useFeature(featureId: string): UseFeatureReturn {
  const { features, usageMap, trackUsage: contextTrackUsage } = useAdoptionContext()

  const feature = React.useMemo(
    () => features.find((f) => f.id === featureId) ?? null,
    [features, featureId]
  )

  const usage = React.useMemo(
    () => usageMap[featureId] ?? createInitialUsage(featureId),
    [usageMap, featureId]
  )

  const trackUsage = React.useCallback(() => {
    contextTrackUsage(featureId)
  }, [contextTrackUsage, featureId])

  return {
    feature,
    usage,
    isAdopted: usage.status === 'adopted',
    status: usage.status,
    useCount: usage.useCount,
    trackUsage,
  }
}
