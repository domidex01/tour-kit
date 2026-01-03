import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

interface MixpanelInstance {
  init: (token: string, config: Record<string, unknown>) => void
  track: (eventName: string, properties: Record<string, unknown>) => void
  identify: (userId: string) => void
  people: {
    set: (properties: Record<string, unknown>) => void
  }
  reset: () => void
}

interface MixpanelPluginOptions {
  /** Mixpanel token */
  token: string
  /** Enable debug mode */
  debug?: boolean
  /** Event name prefix (default: TourKit: ) */
  eventPrefix?: string
}

/**
 * Mixpanel analytics plugin
 *
 * @example
 * ```ts
 * import { mixpanelPlugin } from '@tour-kit/analytics/mixpanel'
 *
 * const analytics = createAnalytics({
 *   plugins: [
 *     mixpanelPlugin({ token: 'xxx' })
 *   ]
 * })
 * ```
 */
export function mixpanelPlugin(options: MixpanelPluginOptions): AnalyticsPlugin {
  let mixpanel: MixpanelInstance | null = null
  const prefix = options.eventPrefix ?? 'TourKit: '

  return {
    name: 'mixpanel',

    async init() {
      if (typeof window === 'undefined') return

      try {
        const mp = await import('mixpanel-browser')
        mixpanel = (mp.default || mp) as MixpanelInstance

        mixpanel.init(options.token, {
          debug: options.debug ?? false,
          track_pageview: false,
          persistence: 'localStorage',
        })
      } catch (error) {
        console.warn('[TourKit Analytics] Mixpanel not available:', error)
      }
    },

    track(event: TourEvent) {
      if (!mixpanel) return

      mixpanel.track(`${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        ...event.metadata,
      })
    },

    identify(userId: string, properties?: Record<string, unknown>) {
      if (!mixpanel) return
      mixpanel.identify(userId)
      if (properties) {
        mixpanel.people.set(properties)
      }
    },

    flush() {
      // Mixpanel auto-flushes
    },

    destroy() {
      if (!mixpanel) return
      mixpanel.reset()
    },
  }
}
