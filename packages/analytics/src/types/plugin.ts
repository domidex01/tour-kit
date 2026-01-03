import type { TourEvent } from './events'

/**
 * Analytics plugin interface
 * Implement this to create custom analytics integrations
 */
export interface AnalyticsPlugin {
  /** Unique plugin identifier */
  name: string

  /** Initialize the plugin (called once on setup) */
  init?: () => void | Promise<void>

  /** Track an event */
  track: (event: TourEvent) => void | Promise<void>

  /** Identify a user */
  identify?: (userId: string, properties?: Record<string, unknown>) => void

  /** Flush any queued events */
  flush?: () => void | Promise<void>

  /** Clean up resources */
  destroy?: () => void
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Enable/disable analytics (default: true) */
  enabled?: boolean

  /** Array of analytics plugins */
  plugins: AnalyticsPlugin[]

  /** Enable debug logging to console */
  debug?: boolean

  /** Queue events when offline */
  offlineQueue?: boolean

  /** Batch events before sending */
  batchSize?: number

  /** Batch interval in milliseconds */
  batchInterval?: number

  /** User identification */
  userId?: string

  /** User properties */
  userProperties?: Record<string, unknown>

  /** Global properties added to all events */
  globalProperties?: Record<string, unknown>
}
