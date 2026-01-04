import type { Feature, FeatureUsage, NudgeConfig, NudgeState } from '../types'

const DEFAULT_COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours
const DEFAULT_MAX_PER_SESSION = 3
const DEFAULT_MAX_FEATURES = 1

export interface NudgeDecision {
  shouldNudge: boolean
  features: Feature[]
  reason?: string
}

/**
 * Determine which features should be nudged
 */
export function selectFeaturesForNudge(
  features: Feature[],
  usageMap: Record<string, FeatureUsage>,
  nudgeState: NudgeState,
  config: NudgeConfig = {}
): NudgeDecision {
  const maxPerSession = config.maxPerSession ?? DEFAULT_MAX_PER_SESSION
  const maxFeatures = config.maxFeatures ?? DEFAULT_MAX_FEATURES
  const cooldown = config.cooldown ?? DEFAULT_COOLDOWN

  // Check session limit
  if (nudgeState.sessionCount >= maxPerSession) {
    return {
      shouldNudge: false,
      features: [],
      reason: 'Session limit reached',
    }
  }

  // Check cooldown
  if (nudgeState.lastShown) {
    const lastShownTime = new Date(nudgeState.lastShown).getTime()
    const now = Date.now()
    if (now - lastShownTime < cooldown) {
      return { shouldNudge: false, features: [], reason: 'Cooldown active' }
    }
  }

  // Filter features that need nudging
  const nudgeable = features
    .filter((feature) => {
      const usage = usageMap[feature.id]
      if (!usage) return true // Never tracked = needs nudge

      // Only nudge not_started or churned
      if (usage.status !== 'not_started' && usage.status !== 'churned') {
        return false
      }

      // Check if dismissed
      if (nudgeState.dismissed.includes(feature.id)) {
        return false
      }

      // Check if snoozed
      const snoozeExpiry = nudgeState.snoozed[feature.id]
      if (snoozeExpiry && new Date(snoozeExpiry) > new Date()) {
        return false
      }

      return true
    })
    // Sort by priority (higher first)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    // Take top N
    .slice(0, maxFeatures)

  if (nudgeable.length === 0) {
    return {
      shouldNudge: false,
      features: [],
      reason: 'No features need nudging',
    }
  }

  return { shouldNudge: true, features: nudgeable }
}

/**
 * Update nudge state after showing a nudge
 */
export function markNudgeShown(state: NudgeState): NudgeState {
  return {
    ...state,
    lastShown: new Date().toISOString(),
    sessionCount: state.sessionCount + 1,
  }
}

/**
 * Dismiss a feature from future nudges
 */
export function dismissNudge(state: NudgeState, featureId: string): NudgeState {
  return {
    ...state,
    dismissed: [...state.dismissed, featureId],
  }
}

/**
 * Snooze a feature nudge for a duration
 */
export function snoozeNudge(state: NudgeState, featureId: string, durationMs: number): NudgeState {
  const expiresAt = new Date(Date.now() + durationMs).toISOString()
  return {
    ...state,
    snoozed: { ...state.snoozed, [featureId]: expiresAt },
  }
}
