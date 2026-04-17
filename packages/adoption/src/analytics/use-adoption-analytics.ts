'use client'

import { useAnalyticsOptional } from '@tour-kit/analytics'

import type { AdoptionStatus, Feature, FeatureUsage } from '../types'
import {
  buildFeatureAdoptedEvent,
  buildFeatureChurnedEvent,
  buildFeatureUsedEvent,
  buildNudgeClickedEvent,
  buildNudgeDismissedEvent,
  buildNudgeShownEvent,
} from './helpers'

/**
 * Hook for easily tracking feature adoption events to analytics
 *
 * @example
 * ```tsx
 * const adoptionAnalytics = useAdoptionAnalytics();
 *
 * <AdoptionProvider
 *   features={features}
 *   onAdoption={(feature) => {
 *     adoptionAnalytics.trackAdopted(feature, feature.usage);
 *   }}
 * >
 * ```
 */
export function useAdoptionAnalytics() {
  const analytics = useAnalyticsOptional()

  /**
   * Track feature usage
   */
  const trackUsed = (feature: Feature, usage: FeatureUsage, previousStatus: AdoptionStatus) => {
    if (!analytics) return

    analytics.track('feature_used', {
      tourId: feature.id,
      metadata: buildFeatureUsedEvent(feature, usage, previousStatus),
    })
  }

  /**
   * Track feature adoption
   */
  const trackAdopted = (feature: Feature, usage: FeatureUsage) => {
    if (!analytics) return

    analytics.track('feature_adopted', {
      tourId: feature.id,
      metadata: buildFeatureAdoptedEvent(feature, usage),
    })
  }

  /**
   * Track feature churn
   */
  const trackChurned = (feature: Feature, usage: FeatureUsage) => {
    if (!analytics) return

    analytics.track('feature_churned', {
      tourId: feature.id,
      metadata: buildFeatureChurnedEvent(feature, usage),
    })
  }

  /**
   * Track nudge shown
   */
  const trackNudgeShown = (feature: Feature, sessionCount: number, reason?: string) => {
    if (!analytics) return

    analytics.track('nudge_shown', {
      tourId: feature.id,
      metadata: buildNudgeShownEvent(feature, sessionCount, reason),
    })
  }

  /**
   * Track nudge clicked
   */
  const trackNudgeClicked = (feature: Feature) => {
    if (!analytics) return

    analytics.track('nudge_clicked', {
      tourId: feature.id,
      metadata: buildNudgeClickedEvent(feature),
    })
  }

  /**
   * Track nudge dismissed
   */
  const trackNudgeDismissed = (feature: Feature, permanent = true) => {
    if (!analytics) return

    analytics.track('nudge_dismissed', {
      tourId: feature.id,
      metadata: buildNudgeDismissedEvent(feature, permanent),
    })
  }

  return {
    trackUsed,
    trackAdopted,
    trackChurned,
    trackNudgeShown,
    trackNudgeClicked,
    trackNudgeDismissed,
    /** Whether analytics is available */
    isAvailable: analytics !== null,
  }
}
