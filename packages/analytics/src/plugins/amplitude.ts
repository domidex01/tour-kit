import { logger } from '@tour-kit/core'
import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

interface AmplitudeIdentify {
  set: (key: string, value: unknown) => AmplitudeIdentify
}

interface AmplitudeInstance {
  init: (apiKey: string, options: Record<string, unknown>) => void
  track: (eventName: string, properties: Record<string, unknown>) => void
  setUserId: (userId: string) => void
  identify: (identify: AmplitudeIdentify) => void
  Identify: new () => AmplitudeIdentify
  flush: () => void
}

interface AmplitudePluginOptions {
  /** Amplitude API key */
  apiKey: string
  /** Event name prefix (default: tourkit_) */
  eventPrefix?: string
  /** Server URL for EU data residency */
  serverUrl?: string
}

/**
 * Amplitude analytics plugin
 *
 * @example
 * ```ts
 * import { amplitudePlugin } from '@tour-kit/analytics/amplitude'
 *
 * const analytics = createAnalytics({
 *   plugins: [
 *     amplitudePlugin({ apiKey: 'xxx' })
 *   ]
 * })
 * ```
 */
export function amplitudePlugin(options: AmplitudePluginOptions): AnalyticsPlugin {
  let amplitude: AmplitudeInstance | null = null
  const prefix = options.eventPrefix ?? 'tourkit_'

  return {
    name: 'amplitude',

    async init() {
      if (typeof window === 'undefined') return

      try {
        const amp = await import('@amplitude/analytics-browser')
        // @amplitude/analytics-browser exports its namespace directly (no default);
        // at runtime the namespace matches our AmplitudeInstance shape.
        amplitude = amp as unknown as AmplitudeInstance

        amplitude.init(options.apiKey, {
          serverUrl: options.serverUrl,
          defaultTracking: false,
        })
      } catch (error) {
        logger.warn('Analytics: Amplitude not available:', error)
      }
    },

    track(event: TourEvent) {
      if (!amplitude) return

      amplitude.track(`${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        ...event.metadata,
      })
    },

    identify(userId: string, properties?: Record<string, unknown>) {
      if (!amplitude) return
      amplitude.setUserId(userId)
      if (properties) {
        const identify = new amplitude.Identify()
        for (const [key, value] of Object.entries(properties)) {
          identify.set(key, value)
        }
        amplitude.identify(identify)
      }
    },

    flush() {
      amplitude?.flush()
    },

    destroy() {
      // Amplitude doesn't have a reset method
    },
  }
}
