import type { Feature } from './feature'

export type {
  Feature,
  FeatureTrigger,
  AdoptionCriteria,
  FeatureResources,
  FeatureUsage,
  AdoptionStatus,
  FeatureWithUsage,
} from './feature'

export type {
  StorageConfig,
  PersistedState,
  NudgeState,
  StorageAdapter,
} from './storage'

/**
 * Nudge configuration
 */
export interface NudgeConfig {
  /**
   * Enable automatic nudging
   * @default true
   */
  enabled?: boolean

  /**
   * Delay before first nudge (ms)
   * @default 5000
   */
  initialDelay?: number

  /**
   * Minimum time between nudges (ms)
   * @default 86400000 (24 hours)
   */
  cooldown?: number

  /**
   * Maximum nudges per session
   * @default 3
   */
  maxPerSession?: number

  /**
   * Maximum features to show nudges for at once
   * @default 1
   */
  maxFeatures?: number
}

/**
 * Adoption provider props
 */
export interface AdoptionProviderProps {
  children: React.ReactNode
  features: Feature[]
  storage?: import('./storage').StorageConfig
  nudge?: NudgeConfig
  userId?: string
  onAdoption?: (feature: Feature) => void
  onChurn?: (feature: Feature) => void
  onNudge?: (feature: Feature, action: 'shown' | 'clicked' | 'dismissed') => void
}
