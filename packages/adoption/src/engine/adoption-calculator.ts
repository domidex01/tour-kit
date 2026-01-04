import type { AdoptionCriteria, AdoptionStatus, FeatureUsage } from '../types'

const DEFAULT_MIN_USES = 3
const DEFAULT_RECENCY_DAYS = 30

/**
 * Calculate adoption status for a feature based on usage data
 */
export function calculateAdoptionStatus(
  usage: FeatureUsage,
  criteria: AdoptionCriteria = {}
): AdoptionStatus {
  const minUses = criteria.minUses ?? DEFAULT_MIN_USES
  const recencyDays = criteria.recencyDays ?? DEFAULT_RECENCY_DAYS

  // Custom check takes precedence
  if (criteria.custom) {
    return criteria.custom(usage) ? 'adopted' : 'exploring'
  }

  // Never used
  if (usage.useCount === 0) {
    return 'not_started'
  }

  // Check if meets minimum uses
  const meetsMinUses = usage.useCount >= minUses

  // Check recency
  const isRecent = usage.lastUsed ? isWithinDays(new Date(usage.lastUsed), recencyDays) : false

  if (meetsMinUses) {
    // Was adopted but churned
    if (!isRecent) {
      return 'churned'
    }
    return 'adopted'
  }

  return 'exploring'
}

/**
 * Check if a date is within N days of now
 */
function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= days
}

/**
 * Create initial usage state for a feature
 */
export function createInitialUsage(featureId: string): FeatureUsage {
  return {
    featureId,
    firstUsed: null,
    lastUsed: null,
    useCount: 0,
    status: 'not_started',
  }
}

/**
 * Update usage after feature is used
 */
export function trackFeatureUsage(
  current: FeatureUsage,
  criteria: AdoptionCriteria = {}
): FeatureUsage {
  const now = new Date().toISOString()

  const updated: FeatureUsage = {
    ...current,
    firstUsed: current.firstUsed ?? now,
    lastUsed: now,
    useCount: current.useCount + 1,
    status: current.status,
  }

  // Recalculate status
  updated.status = calculateAdoptionStatus(updated, criteria)

  return updated
}

/**
 * Check if feature status changed
 */
export function didStatusChange(
  previous: AdoptionStatus,
  current: AdoptionStatus
): { adopted: boolean; churned: boolean } {
  return {
    adopted: previous !== 'adopted' && current === 'adopted',
    churned: previous === 'adopted' && current === 'churned',
  }
}
