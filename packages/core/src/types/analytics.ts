/**
 * Analytics event names emitted by Tour Kit packages.
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
  | 'announcement_shown'
  | 'announcement_dismissed'
  | 'announcement_completed'
  | 'checklist_task_completed'
  | 'checklist_completed'
  | 'feature_used'
  | 'feature_adopted'
  | 'feature_churned'
  | 'nudge_shown'
  | 'nudge_clicked'
  | 'nudge_dismissed'
  | 'schedule_evaluated'

/**
 * Analytics event payload delivered to destination plugins.
 */
export interface TourEvent {
  eventName: TourEventName
  timestamp: number
  sessionId: string
  tourId: string
  stepId?: string
  stepIndex?: number
  totalSteps?: number
  userId?: string
  userProperties?: Record<string, unknown>
  duration?: number
  interactionCount?: number
  metadata?: Record<string, unknown>
}

/**
 * Event data before tracker-generated fields are applied.
 */
export type TourEventData = Omit<TourEvent, 'timestamp' | 'sessionId' | 'eventName'>

/**
 * Implement this to create custom analytics integrations.
 */
export interface AnalyticsPlugin {
  name: string
  init?: () => void | Promise<void>
  track: (event: TourEvent) => void | Promise<void>
  identify?: (userId: string, properties?: Record<string, unknown>) => void
  flush?: () => void | Promise<void>
  destroy?: () => void
}

/**
 * Configuration consumed by the Pro tracker implementation.
 */
export interface AnalyticsConfig {
  enabled?: boolean
  plugins: AnalyticsPlugin[]
  debug?: boolean
  offlineQueue?: boolean
  batchSize?: number
  batchInterval?: number
  userId?: string
  userProperties?: Record<string, unknown>
  globalProperties?: Record<string, unknown>
}

/**
 * Minimal runtime surface shared between MIT packages and the Pro tracker.
 */
export interface AnalyticsTracker {
  track(eventName: TourEventName, data?: TourEventData): void
  identify(userId: string, properties?: Record<string, unknown>): void
  flush(): void | Promise<void>
  destroy(): void
  tourStarted(tourId: string, totalSteps: number, metadata?: Record<string, unknown>): void
  tourCompleted(tourId: string, metadata?: Record<string, unknown>): void
  tourSkipped(
    tourId: string,
    stepIndex: number,
    stepId?: string,
    metadata?: Record<string, unknown>
  ): void
  tourAbandoned(
    tourId: string,
    stepIndex: number,
    stepId?: string,
    metadata?: Record<string, unknown>
  ): void
  stepViewed(
    tourId: string,
    stepId: string,
    stepIndex: number,
    totalSteps: number,
    metadata?: Record<string, unknown>
  ): void
  stepCompleted(
    tourId: string,
    stepId: string,
    stepIndex: number,
    metadata?: Record<string, unknown>
  ): void
  stepSkipped(
    tourId: string,
    stepId: string,
    stepIndex: number,
    metadata?: Record<string, unknown>
  ): void
  stepInteraction(
    tourId: string,
    stepId: string,
    interactionType: string,
    metadata?: Record<string, unknown>
  ): void
  hintShown(hintId: string, metadata?: Record<string, unknown>): void
  hintDismissed(hintId: string, metadata?: Record<string, unknown>): void
  hintClicked(hintId: string, metadata?: Record<string, unknown>): void
}
