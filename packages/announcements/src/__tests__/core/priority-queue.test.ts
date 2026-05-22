import { describe, expect, it } from 'vitest'
import { PriorityQueue, createAnnouncementComparator } from '../../core/priority-queue'
import type { AnnouncementConfig, AnnouncementPriority } from '../../types/announcement'
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

// Phase 3 (refactor train) — comparator used by the provider's auto-show
// effect to replace an inline `priorityOrder` literal that ignored
// `QueueConfig.priorityWeights` and `priorityOrder: 'fifo' | 'lifo'`.
describe('createAnnouncementComparator', () => {
  const ann = (
    id: string,
    priority: AnnouncementPriority
  ): Pick<AnnouncementConfig, 'id' | 'priority'> => ({ id, priority })

  const sequenceById = (ids: string[]) => new Map(ids.map((id, i) => [id, i]))

  const defaultWeights = DEFAULT_QUEUE_CONFIG.priorityWeights

  describe("order: 'priority' with default weights (critical=1000 > high=100 > normal=10 > low=1)", () => {
    it('sorts higher-priority items first', () => {
      const cmp = createAnnouncementComparator(
        'priority',
        defaultWeights,
        sequenceById(['a', 'b', 'c', 'd'])
      )
      const list = [ann('a', 'normal'), ann('b', 'critical'), ann('c', 'low'), ann('d', 'high')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['b', 'd', 'a', 'c'])
    })

    it("treats missing priority as 'normal'", () => {
      const cmp = createAnnouncementComparator('priority', defaultWeights, sequenceById(['a', 'b']))
      const list = [{ id: 'a' } as Pick<AnnouncementConfig, 'id' | 'priority'>, ann('b', 'low')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['a', 'b']) // normal > low
    })

    it('breaks priority ties by insertion sequence (FIFO)', () => {
      const cmp = createAnnouncementComparator(
        'priority',
        defaultWeights,
        sequenceById(['a', 'b', 'c'])
      )
      const list = [ann('c', 'normal'), ann('a', 'normal'), ann('b', 'normal')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('custom weights override defaults (regression: not hardcoded)', () => {
    it('respects inverted weights — low first, critical last', () => {
      const cmp = createAnnouncementComparator(
        'priority',
        { critical: 1, high: 10, normal: 100, low: 1000 },
        sequenceById(['a', 'b', 'c', 'd'])
      )
      const list = [ann('a', 'critical'), ann('b', 'low'), ann('c', 'normal'), ann('d', 'high')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['b', 'c', 'd', 'a'])
    })
  })

  describe("order: 'fifo'", () => {
    it('sorts purely by insertion sequence, ignoring priority', () => {
      const cmp = createAnnouncementComparator(
        'fifo',
        defaultWeights,
        sequenceById(['first', 'second', 'third'])
      )
      const list = [ann('third', 'critical'), ann('second', 'low'), ann('first', 'normal')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['first', 'second', 'third'])
    })
  })

  describe("order: 'lifo'", () => {
    it('reverses insertion sequence, ignoring priority', () => {
      const cmp = createAnnouncementComparator(
        'lifo',
        defaultWeights,
        sequenceById(['first', 'second', 'third'])
      )
      const list = [ann('first', 'critical'), ann('second', 'low'), ann('third', 'normal')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['third', 'second', 'first'])
    })
  })

  describe('parity with PriorityQueue for ties', () => {
    it("'priority' order matches PriorityQueue ordering for equal priorities", () => {
      const queue = new PriorityQueue(DEFAULT_QUEUE_CONFIG)
      queue.enqueue('a', 'normal')
      queue.enqueue('b', 'normal')
      queue.enqueue('c', 'normal')

      const cmp = createAnnouncementComparator(
        'priority',
        defaultWeights,
        sequenceById(['a', 'b', 'c'])
      )
      const list = [ann('a', 'normal'), ann('b', 'normal'), ann('c', 'normal')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(queue.getIds())
    })
  })
})
