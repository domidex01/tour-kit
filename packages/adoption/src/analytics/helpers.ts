import type { AdoptionStatus, Feature, FeatureUsage } from '../types'

/**
 * Calculate days between two dates
 */
function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate days since a date
 */
function calculateDaysSince(dateString: string): number {
  return calculateDaysBetween(dateString, new Date().toISOString())
}

/**
 * Build analytics event data for feature usage
 */
export function buildFeatureUsedEvent(
  feature: Feature,
  usage: FeatureUsage,
  previousStatus: AdoptionStatus
): Record<string, unknown> {
  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    use_count: usage.useCount,
    status: usage.status,
    previous_status: previousStatus,
    first_used: usage.firstUsed,
    last_used: usage.lastUsed,
    is_premium: feature.premium ?? false,
  }
}

/**
 * Build analytics event data for feature adoption
 */
export function buildFeatureAdoptedEvent(
  feature: Feature,
  usage: FeatureUsage
): Record<string, unknown> {
  const daysToAdoption =
    usage.firstUsed && usage.lastUsed ? calculateDaysBetween(usage.firstUsed, usage.lastUsed) : null

  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    use_count: usage.useCount,
    first_used: usage.firstUsed,
    last_used: usage.lastUsed,
    days_to_adoption: daysToAdoption,
    is_premium: feature.premium ?? false,
  }
}

/**
 * Build analytics event data for feature churn
 */
export function buildFeatureChurnedEvent(
  feature: Feature,
  usage: FeatureUsage
): Record<string, unknown> {
  const daysSinceLastUse = usage.lastUsed ? calculateDaysSince(usage.lastUsed) : null

  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    use_count: usage.useCount,
    last_used: usage.lastUsed,
    days_since_last_use: daysSinceLastUse,
    first_used: usage.firstUsed,
    is_premium: feature.premium ?? false,
  }
}

/**
 * Build analytics event data for nudge shown
 */
export function buildNudgeShownEvent(
  feature: Feature,
  sessionCount: number,
  reason?: string
): Record<string, unknown> {
  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    feature_priority: feature.priority ?? 0,
    session_count: sessionCount,
    reason,
    is_premium: feature.premium ?? false,
  }
}

/**
 * Build analytics event data for nudge clicked
 */
export function buildNudgeClickedEvent(feature: Feature): Record<string, unknown> {
  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    is_premium: feature.premium ?? false,
  }
}

/**
 * Build analytics event data for nudge dismissed
 */
export function buildNudgeDismissedEvent(
  feature: Feature,
  permanent = true
): Record<string, unknown> {
  return {
    feature_id: feature.id,
    feature_name: feature.name,
    feature_category: feature.category,
    permanent,
    is_premium: feature.premium ?? false,
  }
}
