import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EventQueueConfig, createEventQueue } from '../../core/event-queue'
import type { TourEvent } from '../../types/events'

/**
 * Factory to create mock events
 */
function createMockEvent(overrides: Partial<TourEvent> = {}): TourEvent {
  return {
    eventName: 'step_viewed',
    timestamp: Date.now(),
    sessionId: 'session-123',
    tourId: 'tour-1',
    ...overrides,
  }
}

/**
 * Factory to create queue config with sensible defaults
 */
function createConfig(overrides: Partial<EventQueueConfig> = {}): EventQueueConfig {
  return {
    batchSize: 10,
    batchInterval: 5000,
    onFlush: vi.fn(),
    ...overrides,
  }
}

describe('createEventQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Operations', () => {
    it('creates a queue with push, flush, destroy, and size methods', () => {
      const queue = createEventQueue(createConfig())

      expect(queue.push).toBeDefined()
      expect(queue.flush).toBeDefined()
      expect(queue.destroy).toBeDefined()
      expect(queue.size).toBeDefined()
    })

    it('starts with size 0', () => {
      const queue = createEventQueue(createConfig())

      expect(queue.size()).toBe(0)
    })

    it('increments size when events are pushed', () => {
      const queue = createEventQueue(createConfig())

      queue.push(createMockEvent())
      expect(queue.size()).toBe(1)

      queue.push(createMockEvent())
      expect(queue.size()).toBe(2)
    })
  })

  describe('Batch Size Flushing', () => {
    it('does not flush before batch size is reached', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 3, onFlush }))

      queue.push(createMockEvent())
      queue.push(createMockEvent())

      expect(onFlush).not.toHaveBeenCalled()
      expect(queue.size()).toBe(2)
    })

    it('flushes when batch size is reached', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 3, onFlush }))

      queue.push(createMockEvent({ stepId: '1' }))
      queue.push(createMockEvent({ stepId: '2' }))
      queue.push(createMockEvent({ stepId: '3' }))

      expect(onFlush).toHaveBeenCalledTimes(1)
      expect(onFlush).toHaveBeenCalledWith([
        expect.objectContaining({ stepId: '1' }),
        expect.objectContaining({ stepId: '2' }),
        expect.objectContaining({ stepId: '3' }),
      ])
      expect(queue.size()).toBe(0)
    })

    it('flushes when batch size is exceeded', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 2, onFlush }))

      queue.push(createMockEvent({ stepId: '1' }))
      queue.push(createMockEvent({ stepId: '2' }))
      expect(onFlush).toHaveBeenCalledTimes(1)

      queue.push(createMockEvent({ stepId: '3' }))
      queue.push(createMockEvent({ stepId: '4' }))
      expect(onFlush).toHaveBeenCalledTimes(2)
    })
  })

  describe('Interval Flushing', () => {
    it('flushes after batch interval expires', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, batchInterval: 5000, onFlush }))

      queue.push(createMockEvent())

      expect(onFlush).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)

      expect(onFlush).toHaveBeenCalledTimes(1)
      expect(queue.size()).toBe(0)
    })

    it('does not flush after interval if queue is empty', () => {
      const onFlush = vi.fn()
      createEventQueue(createConfig({ batchSize: 10, batchInterval: 5000, onFlush }))

      vi.advanceTimersByTime(10000)

      expect(onFlush).not.toHaveBeenCalled()
    })

    it('resets interval timer after batch size flush', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 2, batchInterval: 5000, onFlush }))

      queue.push(createMockEvent())
      queue.push(createMockEvent())
      // Flushed by batch size

      vi.advanceTimersByTime(2500)

      queue.push(createMockEvent())

      vi.advanceTimersByTime(2500)
      // Should not have flushed yet (only 2.5s since last event)
      expect(onFlush).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(2500)
      // Now should have flushed
      expect(onFlush).toHaveBeenCalledTimes(2)
    })
  })

  describe('Critical Events', () => {
    it('flushes immediately for default critical events', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, onFlush }))

      queue.push(createMockEvent({ eventName: 'step_viewed' }))
      expect(onFlush).not.toHaveBeenCalled()

      queue.push(createMockEvent({ eventName: 'tour_completed' }))
      expect(onFlush).toHaveBeenCalledTimes(2) // Queue + critical event
    })

    it('flushes queue before critical event to maintain order', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, onFlush }))

      queue.push(createMockEvent({ stepId: '1', eventName: 'step_viewed' }))
      queue.push(createMockEvent({ stepId: '2', eventName: 'step_completed' }))
      queue.push(createMockEvent({ eventName: 'tour_completed' }))

      expect(onFlush).toHaveBeenCalledTimes(2)
      // First call: queue events
      expect(onFlush).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({ stepId: '1' }),
        expect.objectContaining({ stepId: '2' }),
      ])
      // Second call: critical event
      expect(onFlush).toHaveBeenNthCalledWith(2, [
        expect.objectContaining({ eventName: 'tour_completed' }),
      ])
    })

    it('supports tour_abandoned as critical event', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, onFlush }))

      queue.push(createMockEvent({ eventName: 'tour_abandoned' }))

      expect(onFlush).toHaveBeenCalledTimes(1)
    })

    it('supports tour_skipped as critical event', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, onFlush }))

      queue.push(createMockEvent({ eventName: 'tour_skipped' }))

      expect(onFlush).toHaveBeenCalledTimes(1)
    })

    it('supports custom critical events', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(
        createConfig({
          batchSize: 10,
          onFlush,
          criticalEvents: ['hint_clicked'],
        })
      )

      queue.push(createMockEvent({ eventName: 'hint_clicked' }))

      expect(onFlush).toHaveBeenCalledTimes(1)
    })
  })

  describe('Manual Flush', () => {
    it('flushes all queued events', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, onFlush }))

      queue.push(createMockEvent({ stepId: '1' }))
      queue.push(createMockEvent({ stepId: '2' }))

      queue.flush()

      expect(onFlush).toHaveBeenCalledTimes(1)
      expect(onFlush).toHaveBeenCalledWith([
        expect.objectContaining({ stepId: '1' }),
        expect.objectContaining({ stepId: '2' }),
      ])
      expect(queue.size()).toBe(0)
    })

    it('does nothing when queue is empty', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ onFlush }))

      queue.flush()

      expect(onFlush).not.toHaveBeenCalled()
    })

    it('cancels pending interval timer', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, batchInterval: 5000, onFlush }))

      queue.push(createMockEvent())
      queue.flush()

      vi.advanceTimersByTime(5000)

      // Should only have flushed once (manual flush)
      expect(onFlush).toHaveBeenCalledTimes(1)
    })
  })

  describe('Destroy', () => {
    it('clears all queued events', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ onFlush }))

      queue.push(createMockEvent())
      queue.push(createMockEvent())

      queue.destroy()

      expect(queue.size()).toBe(0)
    })

    it('cancels pending interval timer', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ batchSize: 10, batchInterval: 5000, onFlush }))

      queue.push(createMockEvent())
      queue.destroy()

      vi.advanceTimersByTime(10000)

      expect(onFlush).not.toHaveBeenCalled()
    })

    it('does not flush on destroy', () => {
      const onFlush = vi.fn()
      const queue = createEventQueue(createConfig({ onFlush }))

      queue.push(createMockEvent())
      queue.destroy()

      expect(onFlush).not.toHaveBeenCalled()
    })
  })
})
