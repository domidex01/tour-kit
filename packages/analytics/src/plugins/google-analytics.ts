import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

type GtagCommand = 'event' | 'set' | 'config' | 'consent'
type GtagFunction = (command: GtagCommand, ...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFunction
  }
}

interface GoogleAnalyticsPluginOptions {
  /** GA4 Measurement ID (G-XXXXXXXXXX) */
  measurementId: string
  /** Event name prefix (default: tourkit_) */
  eventPrefix?: string
}

/**
 * Google Analytics 4 plugin
 *
 * Requires gtag.js to be loaded on the page.
 *
 * @example
 * ```ts
 * import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'
 *
 * const analytics = createAnalytics({
 *   plugins: [
 *     googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXXXX' })
 *   ]
 * })
 * ```
 */
export function googleAnalyticsPlugin(options: GoogleAnalyticsPluginOptions): AnalyticsPlugin {
  const prefix = options.eventPrefix ?? 'tourkit_'

  const getGtag = (): GtagFunction | null => {
    if (typeof window !== 'undefined' && window.gtag) {
      return window.gtag
    }
    return null
  }

  return {
    name: 'google-analytics',

    init() {
      if (!getGtag()) {
        console.warn(
          '[TourKit Analytics] gtag not found. Make sure Google Analytics is loaded on the page.'
        )
      }
    },

    track(event: TourEvent) {
      const g = getGtag()
      if (!g) return

      g('event', `${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        ...event.metadata,
      })
    },

    identify(userId: string) {
      const g = getGtag()
      if (!g) return

      g('set', { user_id: userId })
    },

    flush() {
      // GA auto-flushes
    },

    destroy() {
      // Nothing to clean up
    },
  }
}
