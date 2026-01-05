/**
 * Tour analytics event names
 */
export type TourEventName =
  | 'tour_started'
  | 'tour_completed'
  | 'tour_skipped'
  | 'tour_abandoned'
  | 'step_viewed'
  | 'step_completed'
  | 'step_skipped'
  | 'step_interaction'
  | 'hint_shown'
  | 'hint_dismissed'
  | 'hint_clicked'
  // Feature adoption events
  | 'feature_used'
  | 'feature_adopted'
  | 'feature_churned'
  | 'nudge_shown'
  | 'nudge_clicked'
  | 'nudge_dismissed'

/**
 * Tour analytics event payload
 */
export interface TourEvent {
  /** Event type */
  eventName: TourEventName

  /** Unix timestamp */
  timestamp: number

  /** Unique session identifier */
  sessionId: string

  /** Tour identifier */
  tourId: string

  /** Current step identifier */
  stepId?: string

  /** Current step index (0-based) */
  stepIndex?: number

  /** Total number of steps in tour */
  totalSteps?: number

  /** User identifier (if known) */
  userId?: string

  /** Additional user properties */
  userProperties?: Record<string, unknown>

  /** Duration in milliseconds */
  duration?: number

  /** Number of interactions during step */
  interactionCount?: number

  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * Event data without auto-generated fields
 */
export type TourEventData = Omit<TourEvent, 'timestamp' | 'sessionId' | 'eventName'>
