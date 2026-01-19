import type { AnnouncementPriority } from './announcement'

/**
 * Queue priority ordering
 */
export type PriorityOrder = 'priority' | 'fifo' | 'lifo'

/**
 * Behavior when a new announcement is added while one is active
 */
export type StackBehavior = 'queue' | 'replace' | 'stack'

/**
 * Queue configuration
 */
export interface QueueConfig {
  /** Maximum number of announcements that can be shown concurrently */
  maxConcurrent: number

  /** How to order announcements in the queue */
  priorityOrder: PriorityOrder

  /** Behavior when new announcements are added */
  stackBehavior: StackBehavior

  /** Default delay between announcements (ms) */
  delayBetween: number

  /** Priority weights for ordering (higher = more important) */
  priorityWeights: Record<AnnouncementPriority, number>

  /** Whether to auto-show queued announcements */
  autoShow: boolean
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
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

/**
 * Queue item with metadata
 */
export interface QueueItem {
  id: string
  priority: AnnouncementPriority
  addedAt: number
  weight: number
  /** Monotonic sequence number for ordering items with same timestamp */
  sequence: number
}
