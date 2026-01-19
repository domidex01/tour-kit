import { describe, expect, it } from 'vitest'
import { PriorityQueue } from '../../core/priority-queue'
import { DEFAULT_QUEUE_CONFIG } from '../../types/queue'

describe('PriorityQueue', () => {
  describe('enqueue and dequeue', () => {
    it('adds and removes items', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'normal')

      expect(queue.size).toBe(2)
      expect(queue.dequeue()?.id).toBe('a')
      expect(queue.size).toBe(1)
    })

    it('orders by priority (higher weight first)', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('low', 'low')
      queue.enqueue('critical', 'critical')
      queue.enqueue('normal', 'normal')
      queue.enqueue('high', 'high')

      expect(queue.dequeue()?.id).toBe('critical')
      expect(queue.dequeue()?.id).toBe('high')
      expect(queue.dequeue()?.id).toBe('normal')
      expect(queue.dequeue()?.id).toBe('low')
    })

    it('uses FIFO for same priority', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'normal')
      queue.enqueue('c', 'normal')

      expect(queue.dequeue()?.id).toBe('a')
      expect(queue.dequeue()?.id).toBe('b')
      expect(queue.dequeue()?.id).toBe('c')
    })
  })

  describe('FIFO ordering', () => {
    it('orders by insertion time', () => {
      const queue = new PriorityQueue({
        ...DEFAULT_QUEUE_CONFIG,
        priorityOrder: 'fifo',
      })

      queue.enqueue('critical', 'critical')
      queue.enqueue('low', 'low')
      queue.enqueue('normal', 'normal')

      // FIFO ignores priority
      expect(queue.dequeue()?.id).toBe('critical')
      expect(queue.dequeue()?.id).toBe('low')
      expect(queue.dequeue()?.id).toBe('normal')
    })
  })

  describe('LIFO ordering', () => {
    it('orders by insertion time (reversed)', () => {
      const queue = new PriorityQueue({
        ...DEFAULT_QUEUE_CONFIG,
        priorityOrder: 'lifo',
      })

      queue.enqueue('first', 'normal')
      queue.enqueue('second', 'normal')
      queue.enqueue('third', 'normal')

      // LIFO = last in, first out
      expect(queue.dequeue()?.id).toBe('third')
      expect(queue.dequeue()?.id).toBe('second')
      expect(queue.dequeue()?.id).toBe('first')
    })
  })

  describe('peek', () => {
    it('returns the next item without removing it', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'high')

      expect(queue.peek()?.id).toBe('b')
      expect(queue.size).toBe(2)
    })

    it('returns undefined for empty queue', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)
      expect(queue.peek()).toBeUndefined()
    })
  })

  describe('remove', () => {
    it('removes a specific item by ID', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'normal')
      queue.enqueue('c', 'normal')

      expect(queue.remove('b')).toBe(true)
      expect(queue.size).toBe(2)
      expect(queue.has('b')).toBe(false)
    })

    it('returns false if item not found', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)
      expect(queue.remove('nonexistent')).toBe(false)
    })
  })

  describe('has', () => {
    it('checks if an item exists', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')

      expect(queue.has('a')).toBe(true)
      expect(queue.has('b')).toBe(false)
    })
  })

  describe('getPosition', () => {
    it('returns position in queue (0-indexed)', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('low', 'low')
      queue.enqueue('high', 'high')
      queue.enqueue('normal', 'normal')

      expect(queue.getPosition('high')).toBe(0)
      expect(queue.getPosition('normal')).toBe(1)
      expect(queue.getPosition('low')).toBe(2)
    })

    it('returns -1 if not found', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)
      expect(queue.getPosition('nonexistent')).toBe(-1)
    })
  })

  describe('getIds', () => {
    it('returns all IDs in order', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('c', 'low')
      queue.enqueue('a', 'high')
      queue.enqueue('b', 'normal')

      expect(queue.getIds()).toEqual(['a', 'b', 'c'])
    })
  })

  describe('clear', () => {
    it('removes all items', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'normal')
      queue.clear()

      expect(queue.isEmpty).toBe(true)
      expect(queue.size).toBe(0)
    })
  })

  describe('updateConfig', () => {
    it('updates config and re-sorts', () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)

      queue.enqueue('a', 'low')
      queue.enqueue('b', 'high')

      // Invert priority weights
      queue.updateConfig({
        ...DEFAULT_QUEUE_CONFIG,
        priorityWeights: {
          critical: 1,
          high: 10,
          normal: 100,
          low: 1000,
        },
      })

      // Now low has higher weight
      expect(queue.dequeue()?.id).toBe('a')
    })
  })
})
