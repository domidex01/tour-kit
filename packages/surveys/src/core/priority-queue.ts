import type { SurveyQueueConfig, SurveyQueueItem } from '../types/queue'
import type { SurveyPriority } from '../types/survey'

export class SurveyPriorityQueue {
  private items: SurveyQueueItem[] = []
  private config: SurveyQueueConfig
  private sequenceCounter = 0

  constructor(config: SurveyQueueConfig) {
    this.config = config
  }

  enqueue(id: string, priority: SurveyPriority): void {
    const weight = this.config.priorityWeights[priority]
    this.items.push({
      id,
      priority,
      addedAt: Date.now(),
      weight,
      sequence: this.sequenceCounter++,
    })
    this.sort()
  }

  dequeue(): SurveyQueueItem | undefined {
    return this.items.shift()
  }

  peek(): SurveyQueueItem | undefined {
    return this.items[0]
  }

  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) return false
    this.items.splice(index, 1)
    return true
  }

  has(id: string): boolean {
    return this.items.some((item) => item.id === id)
  }

  getIds(): string[] {
    return this.items.map((item) => item.id)
  }

  getPosition(id: string): number {
    return this.items.findIndex((item) => item.id === id)
  }

  get size(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  clear(): void {
    this.items = []
  }

  updateConfig(config: SurveyQueueConfig): void {
    this.config = config
    this.items = this.items.map((item) => ({
      ...item,
      weight: this.config.priorityWeights[item.priority],
    }))
    this.sort()
  }

  private sort(): void {
    const order = this.config.priorityOrder
    this.items.sort((a, b) => {
      switch (order) {
        case 'priority':
          if (a.weight !== b.weight) return b.weight - a.weight
          return a.sequence - b.sequence
        case 'fifo':
          return a.sequence - b.sequence
        case 'lifo':
          return b.sequence - a.sequence
        default:
          return 0
      }
    })
  }
}
