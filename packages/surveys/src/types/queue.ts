import type { SurveyPriority } from './survey'

/** Queue priority ordering strategy */
export type PriorityOrder = 'priority' | 'fifo' | 'lifo'

/** Behavior when a new survey is added while one is active */
export type StackBehavior = 'queue' | 'replace' | 'stack'

/** Survey queue configuration */
export interface SurveyQueueConfig {
  /** Maximum concurrent surveys (default: 1) */
  maxConcurrent: number
  /** Queue ordering strategy */
  priorityOrder: PriorityOrder
  /** Behavior when adding surveys while one is active */
  stackBehavior: StackBehavior
  /** Delay in ms between consecutive surveys */
  delayBetween: number
  /** Priority weights for ordering */
  priorityWeights: Record<SurveyPriority, number>
  /** Whether to auto-show queued surveys */
  autoShow: boolean
}

/** Default queue configuration */
export const DEFAULT_SURVEY_QUEUE_CONFIG: SurveyQueueConfig = {
  maxConcurrent: 1,
  priorityOrder: 'priority',
  stackBehavior: 'queue',
  delayBetween: 500,
  priorityWeights: {
    critical: 1000,
    high: 100,
    normal: 10,
    low: 1,
  },
  autoShow: true,
}

/** Queue item with metadata */
export interface SurveyQueueItem {
  id: string
  priority: SurveyPriority
  addedAt: number
  weight: number
  sequence: number
}
