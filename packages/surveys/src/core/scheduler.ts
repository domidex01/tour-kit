import type {
  IsScheduleActive,
  EngineSurveyConfig as SurveyConfig,
  SurveyQueueConfig,
  SurveyState,
} from '../lib/surveys-engine/types'
import { matchesAudience } from './audience'
import { canShowByFrequency } from './frequency'
import { SurveyPriorityQueue } from './priority-queue'
import { resolveScheduleActive } from './resolve-schedule'

export class SurveyScheduler {
  private queue: SurveyPriorityQueue
  private config: SurveyQueueConfig
  private activeCount = 0
  /** Injected optional-peer loader; `undefined` keeps the default require path. */
  private loadScheduling: (() => { isScheduleActive: IsScheduleActive }) | undefined

  /**
   * `isScheduleActive` is the optional scheduling peer, injected (v3 Phase 3,
   * plan Decision 7b). A SECOND, optional argument so every existing caller and
   * the existing scheduler suites are untouched.
   *
   * Left undefined, `resolveScheduleActive` falls back to its call-time
   * `require`, which degrades OPEN whenever that is absent — i.e. in every ESM
   * build. An ESM consumer of `/engine` passes the real evaluator to get gating.
   */
  constructor(config: SurveyQueueConfig, isScheduleActive?: IsScheduleActive) {
    this.config = config
    this.queue = new SurveyPriorityQueue(config)
    // NOTE: `resolveScheduleActive`'s third parameter is a LOADER, not an
    // `IsScheduleActive` (§0 C15). Passing the function directly would have
    // `load()` call it with no arguments; it throws, the resolver's `catch`
    // swallows it, and the gate is silently always-active.
    this.loadScheduling = isScheduleActive ? () => ({ isScheduleActive }) : undefined
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
    if (config.schedule && !resolveScheduleActive(config.schedule, now, this.loadScheduling))
      return false
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
