'use client'

import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import { useAdoptionAnalytics } from '../analytics'
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
import { createStorageAdapter } from '../storage'
import type {
  AdoptionProviderProps,
  Feature,
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

interface UsageAnalyticsTransition {
  adoptionAnalytics: ReturnType<typeof useAdoptionAnalytics>
  feature: Feature
  previous: FeatureUsage
  current: FeatureUsage
  onAdoption?: (feature: Feature) => void
  onChurn?: (feature: Feature) => void
}

function emitUsageAnalyticsTransition({
  adoptionAnalytics,
  feature,
  previous,
  current,
  onAdoption,
  onChurn,
}: UsageAnalyticsTransition) {
  if (previous.useCount !== current.useCount) {
    adoptionAnalytics.trackUsed(feature, current, previous.status)
  }

  if (previous.status === current.status) return

  const { adopted, churned } = didStatusChange(previous.status, current.status)
  if (adopted) {
    adoptionAnalytics.trackAdopted(feature, current)
    onAdoption?.(feature)
  }
  if (churned) {
    adoptionAnalytics.trackChurned(feature, current)
    onChurn?.(feature)
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
  const adoptionAnalytics = useAdoptionAnalytics()

  // Primitive deps — an inline `storage={{ type: 'localStorage' }}` prop would
  // otherwise invalidate this memo every render and trigger a storage-load loop.
  // biome-ignore lint/correctness/useExhaustiveDependencies: depend on stable primitives instead of the unstable `storage` object reference
  const storageAdapter = React.useMemo(
    () => createStorageAdapter(storage),
    [storage.type, storage.key]
  )

  // State
  const [usageMap, setUsageMap] = React.useState<Record<string, FeatureUsage>>({})
  const [nudgeState, setNudgeState] = React.useState<NudgeState>(createInitialNudgeState)
  const [initialized, setInitialized] = React.useState(false)
  const prevUsageRef = React.useRef(usageMap)

  // Load persisted state on mount
  React.useEffect(() => {
    const persisted = storageAdapter.load()
    if (persisted) {
      prevUsageRef.current = persisted.features
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

  // Pure state update — side effects for adopted/churned transitions live in the
  // effect below, so StrictMode / concurrent re-invocations of the updater don't
  // double-fire callbacks.
  const trackUsage = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      setUsageMap((prev) => {
        const current = prev[featureId] ?? createInitialUsage(featureId)
        const updated = trackFeatureUsage(current, feature.adoptionCriteria)
        return { ...prev, [featureId]: updated }
      })
    },
    [features]
  )

  // Fire onAdoption / onChurn when a feature's status transitions.
  React.useEffect(() => {
    for (const id of Object.keys(usageMap)) {
      const prev = prevUsageRef.current[id] ?? createInitialUsage(id)
      const curr = usageMap[id]
      if (!curr) continue
      const feature = features.find((f) => f.id === id)
      if (!feature) continue
      emitUsageAnalyticsTransition({
        adoptionAnalytics,
        feature,
        previous: prev,
        current: curr,
        onAdoption,
        onChurn,
      })
    }
    prevUsageRef.current = usageMap
  }, [usageMap, features, adoptionAnalytics, onAdoption, onChurn])

  // Stable subscription: tracking effect only resubscribes when `features` change.
  // `trackUsage` is read through a ref so callback-prop updates don't tear down
  // and rebuild DOM/event listeners.
  const trackUsageRef = React.useRef(trackUsage)
  React.useEffect(() => {
    trackUsageRef.current = trackUsage
  }, [trackUsage])

  React.useEffect(() => {
    const cleanups = features.map((feature) =>
      setupFeatureTracking(feature, (featureId) => {
        trackUsageRef.current(featureId)
      })
    )

    return () => {
      for (const cleanup of cleanups) {
        cleanup()
      }
    }
  }, [features])

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
      adoptionAnalytics.trackNudgeShown(feature, nudgeState.sessionCount + 1, 'manual')
      onNudge?.(feature, 'shown')
    },
    [features, nudgeState.sessionCount, adoptionAnalytics, onNudge]
  )

  // Dismiss nudge
  const dismissNudge = React.useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      setNudgeState((prev) => dismissNudgeState(prev, featureId))
      adoptionAnalytics.trackNudgeDismissed(feature, true)
      onNudge?.(feature, 'dismissed')
    },
    [features, adoptionAnalytics, onNudge]
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
    <LicenseGate require="pro">
      <AdoptionContext.Provider value={contextValue}>{children}</AdoptionContext.Provider>
    </LicenseGate>
  )
}
