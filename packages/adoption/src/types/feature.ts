/**
 * How to detect when a feature is used
 */
export type FeatureTrigger =
  | string // CSS selector - tracks clicks
  | { event: string } // Custom event name
  | { callback: () => boolean } // Programmatic check

/**
 * Criteria for when a feature is considered "adopted"
 */
export interface AdoptionCriteria {
  /**
   * Minimum number of uses to be considered adopted
   * @default 3
   */
  minUses?: number

  /**
   * Feature must be used within this many days to remain adopted
   * If not used within this period, status becomes 'churned'
   * @default 30
   */
  recencyDays?: number

  /**
   * Custom adoption check function
   */
  custom?: (usage: FeatureUsage) => boolean
}

/**
 * Related TourKit resources for this feature
 */
export interface FeatureResources {
  /** Tour ID to trigger for feature discovery */
  tourId?: string
  /** Hint IDs to show as nudges */
  hintIds?: string[]
}

/**
 * Feature definition
 */
export interface Feature {
  /** Unique feature identifier */
  id: string

  /** Human-readable feature name */
  name: string

  /** How to detect feature usage */
  trigger: FeatureTrigger

  /** When is feature considered adopted */
  adoptionCriteria?: AdoptionCriteria

  /** Related tours/hints */
  resources?: FeatureResources

  /**
   * Feature priority for nudging (higher = more important)
   * @default 0
   */
  priority?: number

  /** Feature category for grouping */
  category?: string

  /** Feature description for nudge messages */
  description?: string

  /** Is this a premium feature? */
  premium?: boolean
}

/**
 * Feature usage tracking data
 */
export interface FeatureUsage {
  featureId: string
  firstUsed: string | null // ISO date string
  lastUsed: string | null // ISO date string
  useCount: number
  status: AdoptionStatus
}

/**
 * Adoption status of a feature
 */
export type AdoptionStatus =
  | 'not_started' // Never used
  | 'exploring' // Used but not enough times
  | 'adopted' // Meets adoption criteria
  | 'churned' // Was adopted but hasn't been used recently

/**
 * Feature with its current usage state
 */
export interface FeatureWithUsage extends Feature {
  usage: FeatureUsage
}
