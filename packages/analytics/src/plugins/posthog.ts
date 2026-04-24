import { logger } from '@tour-kit/core'
import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

interface PostHogInstance {
  init: (apiKey: string, options: Record<string, unknown>) => void
  capture: (eventName: string, properties: Record<string, unknown>) => void
  identify: (userId: string, properties?: Record<string, unknown>) => void
  reset: () => void
}

interface PostHogPluginOptions {
  /** PostHog API key */
  apiKey: string
  /** PostHog API host (default: https://app.posthog.com) */
  apiHost?: string
  /** Enable autocapture (default: false) */
  autocapture?: boolean
  /** Event name prefix (default: tourkit_) */
  eventPrefix?: string
}

/**
 * PostHog analytics plugin
 *
 * @example
 * ```ts
 * import { posthogPlugin } from '@tour-kit/analytics/posthog'
 *
 * const analytics = createAnalytics({
 *   plugins: [
 *     posthogPlugin({ apiKey: 'phc_xxx' })
 *   ]
 * })
 * ```
 */
export function posthogPlugin(options: PostHogPluginOptions): AnalyticsPlugin {
  let posthog: PostHogInstance | null = null
  const prefix = options.eventPrefix ?? 'tourkit_'

  return {
    name: 'posthog',

    async init() {
      if (typeof window === 'undefined') return

      try {
        const { default: ph } = await import('posthog-js')
        // posthog-js's default export is typed loosely by the vendor; at runtime
        // it matches our PostHogInstance shape (init/capture/identify/reset).
        posthog = ph as unknown as PostHogInstance

        posthog.init(options.apiKey, {
          api_host: options.apiHost ?? 'https://app.posthog.com',
          autocapture: options.autocapture ?? false,
          capture_pageview: false,
          persistence: 'localStorage',
        })
      } catch (error) {
        logger.warn('Analytics: PostHog not available:', error)
      }
    },

    track(event: TourEvent) {
      if (!posthog) return

      posthog.capture(`${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        session_id: event.sessionId,
        ...event.metadata,
      })
    },

    identify(userId: string, properties?: Record<string, unknown>) {
      if (!posthog) return
      posthog.identify(userId, properties)
    },

    flush() {
      // PostHog auto-flushes
    },

    destroy() {
      if (!posthog) return
      posthog.reset()
    },
  }
}
