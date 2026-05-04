import type { AnnouncementConfig, AnnouncementState } from '../types/announcement'
import type { QueueConfig } from '../types/queue'
import { matchesAudience } from './audience'
import { canShowByFrequency } from './frequency'
import { PriorityQueue } from './priority-queue'

/**
 * Announcement scheduler manages the queue and determines when announcements should show
 */
export class AnnouncementScheduler {
  private queue: PriorityQueue
  private config: QueueConfig
  private activeCount = 0

  constructor(config: QueueConfig) {
    this.config = config
    this.queue = new PriorityQueue(config)
  }

  /**
   * Check if an announcement can be shown
   */
  canShow(
    config: AnnouncementConfig,
    state: AnnouncementState,
    userContext?: Record<string, unknown>
  ): boolean {
    // Check if already dismissed
    if (state.isDismissed) {
      return false
    }

    // Check frequency rules
    if (!canShowByFrequency(state, config.frequency)) {
      return false
    }

    // Check audience targeting — only the legacy array shape goes through
    // `matchesAudience` here. The segment-shape `{ segment: string }` branch is
    // resolved upstream by `useFilteredAnnouncements` (Phase 3c) which prunes
    // ineligible announcements before they reach the scheduler. Treating an
    // array+undefined as "match" keeps backward compat unchanged.
    if (Array.isArray(config.audience) && !matchesAudience(config.audience, userContext)) {
      return false
    }

    // Schedule check would be done externally with @tour-kit/scheduling
    // The provider handles that integration

    return true
  }

  /**
   * Try to queue an announcement
   * Returns true if queued, false if should show immediately or can't show
   */
  shouldQueue(
    config: AnnouncementConfig,
    state: AnnouncementState,
    userContext?: Record<string, unknown>
  ): boolean {
    if (!this.canShow(config, state, userContext)) {
      return false
    }

    // If already in queue, don't add again
    if (this.queue.has(config.id)) {
      return false
    }

    // If at max concurrent and stackBehavior is 'queue', should queue
    if (this.activeCount >= this.config.maxConcurrent) {
      if (this.config.stackBehavior === 'queue') {
        return true
      }
      // 'replace' behavior means show immediately (replace current)
      // 'stack' behavior means show immediately (stack on top)
      return false
    }

    return false
  }

  /**
   * Add an announcement to the queue
   */
  enqueue(config: AnnouncementConfig): number {
    const priority = config.priority ?? 'normal'
    this.queue.enqueue(config.id, priority)
    return this.queue.getPosition(config.id)
  }

  /**
   * Get the next announcement to show
   */
  getNext(): string | undefined {
    const item = this.queue.dequeue()
    return item?.id
  }

  /**
   * Peek at the next announcement without removing
   */
  peekNext(): string | undefined {
    const item = this.queue.peek()
    return item?.id
  }

  /**
   * Remove an announcement from the queue
   */
  remove(id: string): boolean {
    return this.queue.remove(id)
  }

  /**
   * Check if an announcement is queued
   */
  isQueued(id: string): boolean {
    return this.queue.has(id)
  }

  /**
   * Get queue position for an announcement (0-indexed, -1 if not queued)
   */
  getQueuePosition(id: string): number {
    return this.queue.getPosition(id)
  }

  /**
   * Get all queued announcement IDs in order
   */
  getQueuedIds(): string[] {
    return this.queue.getIds()
  }

  /**
   * Get queue size
   */
  get queueSize(): number {
    return this.queue.size
  }

  /**
   * Check if more announcements can be shown
   */
  canShowMore(): boolean {
    return this.activeCount < this.config.maxConcurrent
  }

  /**
   * Mark an announcement as active (being shown)
   */
  markActive(): void {
    this.activeCount++
  }

  /**
   * Mark an announcement as inactive (hidden/dismissed)
   */
  markInactive(): void {
    this.activeCount = Math.max(0, this.activeCount - 1)
  }

  /**
   * Get current active count
   */
  get currentActiveCount(): number {
    return this.activeCount
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue.clear()
  }

  /**
   * Reset active count
   */
  resetActive(): void {
    this.activeCount = 0
  }

  /**
   * Update configuration
   */
  updateConfig(config: QueueConfig): void {
    this.config = config
    this.queue.updateConfig(config)
  }

  /**
   * Get delay between announcements
   */
  get delayBetween(): number {
    return this.config.delayBetween
  }

  /**
   * Check if auto-show is enabled
   */
  get autoShow(): boolean {
    return this.config.autoShow
  }
}
