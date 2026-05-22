import type { AnnouncementConfig, AnnouncementPriority } from '../types/announcement'
import type { PriorityOrder, QueueConfig, QueueItem } from '../types/queue'

/**
 * Priority queue implementation for announcement ordering
 */
export class PriorityQueue {
  private items: QueueItem[] = []
  private config: QueueConfig
  private sequenceCounter = 0

  constructor(config: QueueConfig) {
    this.config = config
  }

  /**
   * Add an item to the queue
   */
  enqueue(id: string, priority: AnnouncementPriority): void {
    const weight = this.config.priorityWeights[priority]
    const item: QueueItem = {
      id,
      priority,
      addedAt: Date.now(),
      weight,
      sequence: this.sequenceCounter++,
    }

    this.items.push(item)
    this.sort()
  }

  /**
   * Remove and return the highest priority item
   */
  dequeue(): QueueItem | undefined {
    return this.items.shift()
  }

  /**
   * Peek at the highest priority item without removing
   */
  peek(): QueueItem | undefined {
    return this.items[0]
  }

  /**
   * Remove a specific item by ID
   */
  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Check if an item is in the queue
   */
  has(id: string): boolean {
    return this.items.some((item) => item.id === id)
  }

  /**
   * Get position of an item in the queue (0-indexed)
   */
  getPosition(id: string): number {
    return this.items.findIndex((item) => item.id === id)
  }

  /**
   * Get all item IDs in order
   */
  getIds(): string[] {
    return this.items.map((item) => item.id)
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.items.length
  }

  /**
   * Check if queue is empty
   */
  get isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.items = []
  }

  /**
   * Update configuration and re-sort
   */
  updateConfig(config: QueueConfig): void {
    this.config = config
    // Update weights for existing items
    this.items = this.items.map((item) => ({
      ...item,
      weight: this.config.priorityWeights[item.priority],
    }))
    this.sort()
  }

  /**
   * Sort items based on priority order
   */
  private sort(): void {
    const order = this.config.priorityOrder

    this.items.sort((a, b) => {
      switch (order) {
        case 'priority':
          // Higher weight = higher priority, comes first
          // If same weight, earlier added comes first (use sequence for reliable ordering)
          if (a.weight !== b.weight) {
            return b.weight - a.weight
          }
          return a.sequence - b.sequence

        case 'fifo':
          // First in, first out - lower sequence comes first
          return a.sequence - b.sequence

        case 'lifo':
          // Last in, first out - higher sequence comes first
          return b.sequence - a.sequence

        default:
          return 0
      }
    })
  }
}

/**
 * Create a comparator function for a given priority order
 */
export function createComparator(
  order: PriorityOrder,
  weights: Record<AnnouncementPriority, number>
): (a: QueueItem, b: QueueItem) => number {
  return (a, b) => {
    switch (order) {
      case 'priority': {
        const weightA = weights[a.priority]
        const weightB = weights[b.priority]
        if (weightA !== weightB) {
          return weightB - weightA
        }
        return a.sequence - b.sequence
      }
      case 'fifo':
        return a.sequence - b.sequence
      case 'lifo':
        return b.sequence - a.sequence
      default:
        return 0
    }
  }
}

/**
 * Comparator for announcements at the provider boundary.
 *
 * Phase 3 (refactor train) — replaces the inline `priorityOrder` literal in
 * `<AnnouncementsProvider>` that duplicated `QueueConfig.priorityWeights` and
 * ignored the `priorityOrder: 'priority' | 'fifo' | 'lifo'` setting.
 *
 * Works on a lightweight pick of `AnnouncementConfig` because the provider
 * doesn't have `QueueItem`s yet — they're only minted when the scheduler
 * enqueues. The `sequenceById` map carries the original insertion order from
 * the filtered announcements list so `fifo` / `lifo` can break ties
 * deterministically.
 */
export function createAnnouncementComparator(
  order: PriorityOrder,
  weights: Record<AnnouncementPriority, number>,
  sequenceById: ReadonlyMap<string, number>
): (
  a: Pick<AnnouncementConfig, 'id' | 'priority'>,
  b: Pick<AnnouncementConfig, 'id' | 'priority'>
) => number {
  return (a, b) => {
    const seqA = sequenceById.get(a.id) ?? 0
    const seqB = sequenceById.get(b.id) ?? 0
    switch (order) {
      case 'priority': {
        const weightA = weights[a.priority ?? 'normal']
        const weightB = weights[b.priority ?? 'normal']
        if (weightA !== weightB) {
          // Higher weight = higher priority, comes first
          return weightB - weightA
        }
        // Tie-break by insertion order (FIFO)
        return seqA - seqB
      }
      case 'fifo':
        return seqA - seqB
      case 'lifo':
        return seqB - seqA
      default:
        return 0
    }
  }
}
