import { useMemo } from 'react'
import { useAnnouncementsContext } from '../context/announcements-context'
import type { QueueConfig } from '../types/queue'

/**
 * Return type for useAnnouncementQueue hook
 */
export interface UseAnnouncementQueueReturn {
  /** IDs of announcements in the queue */
  queue: string[]
  /** Number of announcements in the queue */
  size: number
  /** Whether the queue is empty */
  isEmpty: boolean
  /** Current queue configuration */
  config: QueueConfig
  /** Show the next announcement in the queue */
  showNext: () => void
  /** Clear all announcements from the queue */
  clear: () => void
  /** Check if a specific announcement is in the queue */
  isQueued: (id: string) => boolean
  /** Get position of an announcement in the queue (-1 if not queued) */
  getPosition: (id: string) => number
}

/**
 * Hook to interact with the announcement queue
 * @returns Queue state and control methods
 */
export function useAnnouncementQueue(): UseAnnouncementQueueReturn {
  const context = useAnnouncementsContext()

  const isQueued = useMemo(() => (id: string) => context.queue.includes(id), [context.queue])

  const getPosition = useMemo(() => (id: string) => context.queue.indexOf(id), [context.queue])

  return useMemo(
    () => ({
      queue: context.queue,
      size: context.queue.length,
      isEmpty: context.queue.length === 0,
      config: context.queueConfig,
      showNext: context.showNext,
      clear: context.clearQueue,
      isQueued,
      getPosition,
    }),
    [
      context.queue,
      context.queueConfig,
      context.showNext,
      context.clearQueue,
      isQueued,
      getPosition,
    ]
  )
}
