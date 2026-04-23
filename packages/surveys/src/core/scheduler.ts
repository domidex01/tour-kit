import type { SurveyQueueConfig } from '../types/queue'
import type { SurveyConfig, SurveyState } from '../types/survey'
import { matchesAudience } from './audience'
import { canShowByFrequency } from './frequency'
import { SurveyPriorityQueue } from './priority-queue'

export class SurveyScheduler {
  private queue: SurveyPriorityQueue
  private config: SurveyQueueConfig
  private activeCount = 0

  constructor(config: SurveyQueueConfig) {
    this.config = config
    this.queue = new SurveyPriorityQueue(config)
  }

  canShow(
    config: SurveyConfig,
    state: SurveyState,
    userContext?: Record<string, unknown>,
    now: Date = new Date()
  ): boolean {
    if (state.isCompleted || state.isDismissed) return false
    if (!canShowByFrequency(state, config.frequency, now)) return false
    if (!matchesAudience(config.audience, userContext)) return false
    return true
  }

  enqueue(config: SurveyConfig): number {
    const priority = config.priority ?? 'normal'
    this.queue.enqueue(config.id, priority)
    return this.queue.getPosition(config.id)
  }

  getNext(): string | undefined {
    return this.queue.dequeue()?.id
  }

  peekNext(): string | undefined {
    return this.queue.peek()?.id
  }

  remove(id: string): boolean {
    return this.queue.remove(id)
  }

  isQueued(id: string): boolean {
    return this.queue.has(id)
  }

  getQueuedIds(): string[] {
    return this.queue.getIds()
  }

  get queueSize(): number {
    return this.queue.size
  }

  canShowMore(): boolean {
    return this.activeCount < this.config.maxConcurrent
  }

  markActive(): void {
    this.activeCount++
  }

  markInactive(): void {
    this.activeCount = Math.max(0, this.activeCount - 1)
  }

  get currentActiveCount(): number {
    return this.activeCount
  }

  clearQueue(): void {
    this.queue.clear()
  }

  resetActive(): void {
    this.activeCount = 0
  }

  updateConfig(config: SurveyQueueConfig): void {
    this.config = config
    this.queue.updateConfig(config)
  }

  get delayBetween(): number {
    return this.config.delayBetween
  }

  get autoShow(): boolean {
    return this.config.autoShow
  }

  get stackBehavior(): SurveyQueueConfig['stackBehavior'] {
    return this.config.stackBehavior
  }
}
