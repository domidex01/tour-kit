import type { TourEvent, TourEventName } from '../types/events'

/**
 * Configuration for the event queue
 */
export interface EventQueueConfig {
  /** Number of events to buffer before flushing */
  batchSize: number
  /** Maximum time in ms before auto-flush */
  batchInterval: number
  /** Callback to handle flushed events */
  onFlush: (events: TourEvent[]) => void
  /** Events that bypass batching and flush immediately */
  criticalEvents?: TourEventName[]
}

/**
 * Event queue interface
 */
export interface EventQueue {
  /** Add an event to the queue */
  push: (event: TourEvent) => void
  /** Flush all queued events immediately */
  flush: () => void
  /** Clear and destroy the queue */
  destroy: () => void
  /** Get the number of queued events */
  size: () => number
}

/**
 * Default critical events that should never be batched
 * These events indicate tour completion states and should be sent immediately
 */
const DEFAULT_CRITICAL_EVENTS: TourEventName[] = [
  'tour_completed',
  'tour_abandoned',
  'tour_skipped',
]

/**
 * Creates an event queue for batching analytics events.
 * Events are buffered until either the batch size is reached or the interval expires.
 * Critical events (like tour_completed) bypass batching and flush immediately.
 *
 * @example
 * ```ts
 * const queue = createEventQueue({
 *   batchSize: 10,
 *   batchInterval: 5000,
 *   onFlush: (events) => {
 *     for (const event of events) {
 *       plugin.track(event)
 *     }
 *   },
 * })
 *
 * // Add events to queue
 * queue.push(event)
 *
 * // Force flush
 * queue.flush()
 *
 * // Cleanup
 * queue.destroy()
 * ```
 */
export function createEventQueue(config: EventQueueConfig): EventQueue {
  const { batchSize, batchInterval, onFlush } = config
  const criticalEvents = config.criticalEvents ?? DEFAULT_CRITICAL_EVENTS

  let queue: TourEvent[] = []
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const scheduleFlush = () => {
    if (timeoutId === null && queue.length > 0) {
      timeoutId = setTimeout(() => {
        timeoutId = null
        flushQueue()
      }, batchInterval)
    }
  }

  const flushQueue = () => {
    if (queue.length === 0) return

    const events = queue
    queue = []

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    onFlush(events)
  }

  const push = (event: TourEvent) => {
    // Critical events bypass batching
    if (criticalEvents.includes(event.eventName)) {
      // Flush existing queue first to maintain event order
      if (queue.length > 0) {
        flushQueue()
      }
      // Then immediately send the critical event
      onFlush([event])
      return
    }

    queue.push(event)

    // Check if we've reached batch size
    if (queue.length >= batchSize) {
      flushQueue()
    } else {
      scheduleFlush()
    }
  }

  const flush = () => {
    flushQueue()
  }

  const destroy = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    queue = []
  }

  const size = () => queue.length

  return {
    push,
    flush,
    destroy,
    size,
  }
}
