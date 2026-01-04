import type { FeatureUsage } from './feature'

/**
 * Storage configuration
 */
export interface StorageConfig {
  /**
   * Storage type
   * @default 'localStorage'
   */
  type: 'localStorage' | 'sessionStorage' | 'memory'

  /**
   * Storage key prefix
   * @default 'tourkit-adoption'
   */
  key?: string
}

/**
 * Persisted adoption state
 */
export interface PersistedState {
  version: number
  userId?: string
  features: Record<string, FeatureUsage>
  nudges: NudgeState
  updatedAt: string
}

/**
 * Nudge tracking state
 */
export interface NudgeState {
  /** Last time any nudge was shown */
  lastShown: string | null
  /** Feature IDs that have been permanently dismissed */
  dismissed: string[]
  /** Feature IDs with snooze expiry times */
  snoozed: Record<string, string>
  /** Count of nudges shown this session */
  sessionCount: number
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  load(): PersistedState | null
  save(state: PersistedState): void
  clear(): void
}
