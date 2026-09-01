import { act, renderHook, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { useAnnouncementsContext } from '../../context/announcements-context'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import { useAnnouncementQueue } from '../../hooks/use-announcement-queue'
import type { AnnouncementConfig } from '../../types/announcement'
import type { QueueConfig } from '../../types/queue'

function makeWrapper(announcements: AnnouncementConfig[], queueConfig?: Partial<QueueConfig>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnnouncementsProvider announcements={announcements} queueConfig={queueConfig} storage={null}>
        {children}
      </AnnouncementsProvider>
    )
  }
}

const high: AnnouncementConfig = {
  id: 'first',
  variant: 'modal',
  title: 'First',
  priority: 'critical',
}
const low: AnnouncementConfig = {
  id: 'second',
  variant: 'modal',
  title: 'Second',
  priority: 'high',
}

describe('useAnnouncementQueue', () => {
  it('reports an empty queue and the active config when nothing is pending', () => {
    const { result } = renderHook(() => useAnnouncementQueue(), {
      wrapper: makeWrapper([{ id: 'solo', variant: 'banner', autoShow: false }]),
    })

    expect(result.current.queue).toEqual([])
    expect(result.current.size).toBe(0)
    expect(result.current.isEmpty).toBe(true)
    // queueConfig is surfaced from the provider (defaults merged)
    expect(result.current.config.maxConcurrent).toBeGreaterThanOrEqual(1)
    expect(result.current.isQueued('solo')).toBe(false)
    expect(result.current.getPosition('solo')).toBe(-1)
  })

  it('reflects an enqueued announcement once one is active at maxConcurrent', async () => {
    const { result } = renderHook(() => useAnnouncementQueue(), {
      wrapper: makeWrapper([high, low], {
        maxConcurrent: 1,
        stackBehavior: 'queue',
        delayBetween: 1_000_000, // keep the queued item pending for assertions
      }),
    })

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(false)
    })

    expect(result.current.queue).toContain('second')
    expect(result.current.size).toBe(1)
    expect(result.current.isQueued('second')).toBe(true)
    expect(result.current.getPosition('second')).toBe(0)
    expect(result.current.isQueued('first')).toBe(false)
  })

  it('clear() empties the queue', async () => {
    const { result } = renderHook(() => useAnnouncementQueue(), {
      wrapper: makeWrapper([high, low], {
        maxConcurrent: 1,
        stackBehavior: 'queue',
        delayBetween: 1_000_000,
      }),
    })

    await waitFor(() => {
      expect(result.current.queue).toContain('second')
    })

    act(() => {
      result.current.clear()
    })

    expect(result.current.queue).toEqual([])
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.isQueued('second')).toBe(false)
  })

  it('showNext() promotes a queued announcement once a slot is free', async () => {
    const { result } = renderHook(
      () => ({ queue: useAnnouncementQueue(), ctx: useAnnouncementsContext() }),
      {
        wrapper: makeWrapper([high, low], {
          maxConcurrent: 1,
          stackBehavior: 'queue',
          delayBetween: 1_000_000, // suppress the auto-advance timer
        }),
      }
    )

    await waitFor(() => {
      expect(result.current.queue.queue).toContain('second')
    })

    // Free the single concurrency slot by dismissing the active announcement.
    act(() => {
      result.current.ctx.dismiss('first')
    })

    // Now showNext() can dequeue + display 'second', removing it from the queue.
    act(() => {
      result.current.queue.showNext()
    })

    await waitFor(() => {
      expect(result.current.queue.queue).not.toContain('second')
    })
  })
})
