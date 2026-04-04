import * as React from 'react'
import {
  createInitialUsage,
  didStatusChange,
  dismissNudge as dismissNudgeState,
  markNudgeShown,
  selectFeaturesForNudge,
  setupFeatureTracking,
  snoozeNudge as snoozeNudgeState,
  trackFeatureUsage,
} from '../engine'
import { ProGate } from '@tour-kit/license'
import { createStorageAdapter } from '../storage'
import type {
  AdoptionProviderProps,
  FeatureUsage,
  NudgeConfig,
  NudgeState,
  PersistedState,
  StorageConfig,
} from '../types'
import { AdoptionContext, type AdoptionContextValue } from './adoption-context'

const DEFAULT_STORAGE: StorageConfig = { type: 'localStorage' }
const DEFAULT_NUDGE: NudgeConfig = { enabled: true }

function createInitialNudgeState(): NudgeState {
  return {
    lastShown: null,
    dismissed: [],
    snoozed: {},
    sessionCount: 0,
  }
}

export function AdoptionProvider({
  children,
  features,
  storage = DEFAULT_STORAGE,
  nudge = DEFAULT_NUDGE,
  userId,
  onAdoption,
  onChurn,
  onNudge,
}: AdoptionProviderProps) {
  const storageAdapter = React.useMemo(() => createStorageAdapter(storage), [storage])

  // State
  const [usageMap, setUsageMap] = React.useState<Record<string, FeatureUsage>>({})
  const [nudgeState, setNudgeState] = React.useState<NudgeState>(createInitialNudgeState)
  const [initialized, setInitialized] = React.useState(false)

  // Load persisted state on mount
  React.useEffect(() => {
    const persisted = storageAdapter.load()
    if (persisted) {
      setUsageMap(persisted.features)
      setNudgeState(persisted.nudges)
    }
    setInitialized(true)
  }, [storageAdapter])

  // Save state on changes
  React.useEffect(() => {
    if (!initialized) return

    const state: PersistedState = {
      version: 1,
      userId,
      features: usageMap,
      nudges: nudgeState,
      updatedAt: new Date().toISOString(),
    }
    storageAdapter.save(state)
  }, [usageMap, nudgeState, userId, initialized, storageAdapter])

  // Set up click/event tracking for features
  React.useEffect(() => {
    const cleanups = features.map((feature) =>
      setupFeatureTracking(feature, (featureId) => {
        trackUsage(featureId)
      })
    )

    return () => {
      for (const cleanup of cleanups) {
        cleanup()
      }
    }
  }, [features])

  // Track feature usage
  const trackUsage = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      setUsageMap((prev) => {
        const current = prev[featureId] ?? createInitialUsage(featureId)
        const updated = trackFeatureUsage(current, feature.adoptionCriteria)

        // Check for status changes
        const changes = didStatusChange(current.status, updated.status)

        if (changes.adopted) {
          onAdoption?.(feature)
        }
        if (changes.churned) {
          onChurn?.(feature)
        }

        return { ...prev, [featureId]: updated }
      })
    },
    [features, onAdoption, onChurn]
  )

  // Get feature with usage
  const getFeature = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return null

      const usage = usageMap[featureId] ?? createInitialUsage(featureId)
      return { ...feature, usage }
    },
    [features, usageMap]
  )

  // Calculate pending nudges
  const pendingNudges = React.useMemo(() => {
    if (!nudge.enabled) return []

    const decision = selectFeaturesForNudge(features, usageMap, nudgeState, nudge)
    return decision.features
  }, [features, usageMap, nudgeState, nudge])

  // Show nudge
  const showNudge = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      setNudgeState((prev) => markNudgeShown(prev))
      onNudge?.(feature, 'shown')
    },
    [features, onNudge]
  )

  // Dismiss nudge
  const dismissNudge = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      setNudgeState((prev) => dismissNudgeState(prev, featureId))
      onNudge?.(feature, 'dismissed')
    },
    [features, onNudge]
  )

  // Snooze nudge
  const snoozeNudge = React.useCallback((featureId: string, durationMs: number) => {
    setNudgeState((prev) => snoozeNudgeState(prev, featureId, durationMs))
  }, [])

  const contextValue: AdoptionContextValue = {
    features,
    usageMap,
    nudgeState,
    trackUsage,
    getFeature,
    showNudge,
    dismissNudge,
    snoozeNudge,
    pendingNudges,
  }

  return (
    <ProGate package="@tour-kit/adoption">
      <AdoptionContext.Provider value={contextValue}>
        {children}
      </AdoptionContext.Provider>
    </ProGate>
  )
}
