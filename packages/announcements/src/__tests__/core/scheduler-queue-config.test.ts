import { describe, expect, it } from 'vitest'
import { AnnouncementScheduler } from '../../core/scheduler'
import type { QueueConfig } from '../../types/queue'
import { DEFAULT_QUEUE_CONFIG } from '../../types/queue'

describe('AnnouncementScheduler.queueConfig — Phase 3 public getter', () => {
  it('returns the active config (default)', () => {
    const scheduler = new AnnouncementScheduler(DEFAULT_QUEUE_CONFIG)

    expect(scheduler.queueConfig.priorityWeights).toEqual(DEFAULT_QUEUE_CONFIG.priorityWeights)
    expect(scheduler.queueConfig.priorityOrder).toBe(DEFAULT_QUEUE_CONFIG.priorityOrder)
  })

  it('returns the custom weights passed to the constructor', () => {
    const customWeights = { critical: 1, high: 10, normal: 100, low: 1000 }
    const customConfig: QueueConfig = {
      ...DEFAULT_QUEUE_CONFIG,
      priorityWeights: customWeights,
      priorityOrder: 'fifo',
    }

    const scheduler = new AnnouncementScheduler(customConfig)

    expect(scheduler.queueConfig.priorityWeights).toEqual(customWeights)
    expect(scheduler.queueConfig.priorityOrder).toBe('fifo')
  })

  it('reflects updates after updateConfig()', () => {
    const scheduler = new AnnouncementScheduler(DEFAULT_QUEUE_CONFIG)
    expect(scheduler.queueConfig.priorityOrder).toBe('priority')

    scheduler.updateConfig({ ...DEFAULT_QUEUE_CONFIG, priorityOrder: 'lifo' })

    expect(scheduler.queueConfig.priorityOrder).toBe('lifo')
  })

  it('exposes a Readonly view (type-level)', () => {
    const scheduler = new AnnouncementScheduler(DEFAULT_QUEUE_CONFIG)
    const cfg = scheduler.queueConfig

    // @ts-expect-error — Readonly<QueueConfig> blocks mutation at the type level
    cfg.priorityOrder = 'lifo'
  })
})
