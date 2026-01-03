import type { TourEvent, TourEventData, TourEventName } from '../types/events'
import type { AnalyticsConfig, AnalyticsPlugin } from '../types/plugin'

/**
 * Main analytics tracker class
 */
export class TourAnalytics {
  private plugins: AnalyticsPlugin[] = []
  private config: AnalyticsConfig
  private sessionId: string
  private stepStartTime = 0
  private tourStartTime = 0
  private initialized = false

  constructor(config: AnalyticsConfig) {
    this.config = config
    this.plugins = config.plugins
    this.sessionId = this.generateSessionId()

    if (config.enabled !== false) {
      this.init()
    }
  }

  private async init() {
    if (this.initialized) return

    for (const plugin of this.plugins) {
      try {
        await plugin.init?.()
      } catch (error) {
        if (this.config.debug) {
          console.error(`[TourKit Analytics] Failed to init plugin ${plugin.name}:`, error)
        }
      }
    }

    if (this.config.userId) {
      this.identify(this.config.userId, this.config.userProperties)
    }

    this.initialized = true
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: Record<string, unknown>) {
    for (const plugin of this.plugins) {
      try {
        plugin.identify?.(userId, properties)
      } catch (error) {
        if (this.config.debug) {
          console.error(`[TourKit Analytics] Failed to identify in ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Track a raw event
   */
  track(eventName: TourEventName, data: TourEventData = { tourId: '' }) {
    const event: TourEvent = {
      eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...data,
      ...(this.config.globalProperties || {}),
    }

    if (this.config.debug) {
      console.log('[TourKit Analytics]', eventName, event)
    }

    for (const plugin of this.plugins) {
      try {
        plugin.track(event)
      } catch (error) {
        if (this.config.debug) {
          console.error(`[TourKit Analytics] Failed to track in ${plugin.name}:`, error)
        }
      }
    }
  }

  // ============================================
  // Convenience methods for tour lifecycle
  // ============================================

  /**
   * Track tour start
   */
  tourStarted(tourId: string, totalSteps: number, metadata?: Record<string, unknown>) {
    this.tourStartTime = Date.now()
    this.track('tour_started', { tourId, totalSteps, metadata })
  }

  /**
   * Track tour completion
   */
  tourCompleted(tourId: string, metadata?: Record<string, unknown>) {
    const duration = Date.now() - this.tourStartTime
    this.track('tour_completed', { tourId, duration, metadata })
  }

  /**
   * Track tour skip
   */
  tourSkipped(
    tourId: string,
    stepIndex: number,
    stepId?: string,
    metadata?: Record<string, unknown>
  ) {
    const duration = Date.now() - this.tourStartTime
    this.track('tour_skipped', {
      tourId,
      stepIndex,
      stepId,
      duration,
      metadata,
    })
  }

  /**
   * Track tour abandonment (e.g., page close during tour)
   */
  tourAbandoned(
    tourId: string,
    stepIndex: number,
    stepId?: string,
    metadata?: Record<string, unknown>
  ) {
    const duration = Date.now() - this.tourStartTime
    this.track('tour_abandoned', {
      tourId,
      stepIndex,
      stepId,
      duration,
      metadata,
    })
  }

  /**
   * Track step view
   */
  stepViewed(
    tourId: string,
    stepId: string,
    stepIndex: number,
    totalSteps: number,
    metadata?: Record<string, unknown>
  ) {
    this.stepStartTime = Date.now()
    this.track('step_viewed', {
      tourId,
      stepId,
      stepIndex,
      totalSteps,
      metadata,
    })
  }

  /**
   * Track step completion
   */
  stepCompleted(
    tourId: string,
    stepId: string,
    stepIndex: number,
    metadata?: Record<string, unknown>
  ) {
    const duration = Date.now() - this.stepStartTime
    this.track('step_completed', {
      tourId,
      stepId,
      stepIndex,
      duration,
      metadata,
    })
  }

  /**
   * Track step skip
   */
  stepSkipped(
    tourId: string,
    stepId: string,
    stepIndex: number,
    metadata?: Record<string, unknown>
  ) {
    const duration = Date.now() - this.stepStartTime
    this.track('step_skipped', {
      tourId,
      stepId,
      stepIndex,
      duration,
      metadata,
    })
  }

  /**
   * Track interaction during a step
   */
  stepInteraction(
    tourId: string,
    stepId: string,
    interactionType: string,
    metadata?: Record<string, unknown>
  ) {
    this.track('step_interaction', {
      tourId,
      stepId,
      metadata: { interactionType, ...metadata },
    })
  }

  // ============================================
  // Hint tracking methods
  // ============================================

  /**
   * Track hint shown
   */
  hintShown(hintId: string, metadata?: Record<string, unknown>) {
    this.track('hint_shown', { tourId: hintId, metadata })
  }

  /**
   * Track hint dismissed
   */
  hintDismissed(hintId: string, metadata?: Record<string, unknown>) {
    this.track('hint_dismissed', { tourId: hintId, metadata })
  }

  /**
   * Track hint clicked
   */
  hintClicked(hintId: string, metadata?: Record<string, unknown>) {
    this.track('hint_clicked', { tourId: hintId, metadata })
  }

  // ============================================
  // Utility methods
  // ============================================

  /**
   * Flush all queued events
   */
  async flush() {
    for (const plugin of this.plugins) {
      try {
        await plugin.flush?.()
      } catch (error) {
        if (this.config.debug) {
          console.error(`[TourKit Analytics] Failed to flush ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Destroy tracker and clean up
   */
  destroy() {
    for (const plugin of this.plugins) {
      try {
        plugin.destroy?.()
      } catch (error) {
        if (this.config.debug) {
          console.error(`[TourKit Analytics] Failed to destroy ${plugin.name}:`, error)
        }
      }
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }
}

/**
 * Create a new analytics tracker
 */
export function createAnalytics(config: AnalyticsConfig): TourAnalytics {
  return new TourAnalytics(config)
}
