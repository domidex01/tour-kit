import type * as React from 'react'

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

/**
 * One step in an adoption funnel.
 *
 * The funnel is data-first: consumers compute these from their own analytics
 * (e.g. cohort queries) and hand them to `<AdoptionFunnel steps={...}>` —
 * no provider required. `useFunnelData()` is a convenience selector that
 * derives a CURRENT-STATE funnel from `useAdoptionStats` for in-provider use.
 */
export interface FunnelStep {
  /** Stable identifier for the step (used as React key + onClick payload). */
  id: string
  /** Visible label rendered next to the bar. */
  label: string
  /** Number of subjects that reached this step. */
  entered: number
  /**
   * Number of subjects that completed the step.
   * Defaults to 0 (no one progressed past this step) when omitted.
   */
  completed?: number
}

/**
 * Props for `<AdoptionFunnel>`.
 *
 * Works WITHOUT `<AdoptionProvider>` — data-first by design. Consumers in a
 * provider tree typically combine with `useFunnelData({ featureIds })`.
 */
export interface AdoptionFunnelProps {
  /** Pre-computed funnel data, in display order. */
  steps: readonly FunnelStep[]
  /** Optional header rendered above the bars. */
  title?: React.ReactNode
  /** Click/keyboard activation handler. When omitted, steps are not focusable. */
  onStepClick?: (step: FunnelStep, index: number) => void
  /** Replaces the default "No funnel data yet." message when `steps` is empty. */
  emptyState?: React.ReactNode
  /** Extra className merged onto the root element. */
  className?: string
  /**
   * Overrides the auto-generated chart summary on the `role="img"` element.
   * Default: `Adoption funnel: 100 → 60 → 30, 30% end-to-end retention`.
   */
  ariaLabel?: string
}
