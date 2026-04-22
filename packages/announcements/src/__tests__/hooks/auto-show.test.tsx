import { act, renderHook, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnnouncementsContext } from '../../context/announcements-context'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { AnnouncementConfig } from '../../types/announcement'
import type { QueueConfig } from '../../types/queue'

interface WrapperOpts {
  userContext?: Record<string, unknown>
  queueConfig?: Partial<QueueConfig>
  storage?: Storage | null
  storageKey?: string
}

function makeWrapper(announcements: AnnouncementConfig[], opts: WrapperOpts = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnnouncementsProvider
        announcements={announcements}
        userContext={opts.userContext}
        queueConfig={opts.queueConfig}
        storage={opts.storage ?? null}
        storageKey={opts.storageKey}
      >
        {children}
      </AnnouncementsProvider>
    )
  }
}

describe('AnnouncementsProvider — autoShow', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows a registered modal announcement on mount', async () => {
    const config: AnnouncementConfig = {
      id: 'welcome',
      variant: 'modal',
      title: 'Welcome',
    }

    const { result } = renderHook(() => useAnnouncement('welcome'), {
      wrapper: makeWrapper([config]),
    })

    await waitFor(() => {
      expect(result.current.state?.isVisible).toBe(true)
    })
    expect(result.current.state?.viewCount).toBe(1)
  })

  it('does not show when autoShow is false', async () => {
    const config: AnnouncementConfig = {
      id: 'manual',
      variant: 'modal',
      title: 'Manual',
      autoShow: false,
    }

    const { result } = renderHook(() => useAnnouncement('manual'), {
      wrapper: makeWrapper([config]),
    })

    // Let any pending effects flush
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.state?.isVisible).toBe(false)
    expect(result.current.state?.viewCount).toBe(0)

    // Imperative show() still works
    act(() => {
      result.current.show()
    })
    await waitFor(() => {
      expect(result.current.state?.isVisible).toBe(true)
    })
  })

  it('respects audience targeting — not shown when user does not match', async () => {
    const config: AnnouncementConfig = {
      id: 'pro-only',
      variant: 'modal',
      title: 'Pro Feature',
      audience: [
        {
          type: 'user_property',
          key: 'plan',
          operator: 'equals',
          value: 'pro',
        },
      ],
    }

    const { result } = renderHook(() => useAnnouncement('pro-only'), {
      wrapper: makeWrapper([config], { userContext: { plan: 'free' } }),
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.state?.isVisible).toBe(false)
  })

  it('respects audience targeting — shown when user matches', async () => {
    const config: AnnouncementConfig = {
      id: 'pro-only',
      variant: 'modal',
      title: 'Pro Feature',
      audience: [
        {
          type: 'user_property',
          key: 'plan',
          operator: 'equals',
          value: 'pro',
        },
      ],
    }

    const { result } = renderHook(() => useAnnouncement('pro-only'), {
      wrapper: makeWrapper([config], { userContext: { plan: 'pro' } }),
    })

    await waitFor(() => {
      expect(result.current.state?.isVisible).toBe(true)
    })
  })

  it('frequency "once" suppresses re-show on remount when persisted', async () => {
    const config: AnnouncementConfig = {
      id: 'seen-once',
      variant: 'modal',
      title: 'Seen',
      frequency: 'once',
    }

    // Seed persisted state as if the announcement was already viewed once
    const storage = window.localStorage
    const storageKey = 'tour-kit:announcements:'
    storage.setItem(
      `${storageKey}seen-once`,
      JSON.stringify({
        viewCount: 1,
        lastViewedAt: new Date().toISOString(),
        isDismissed: false,
        dismissedAt: null,
        dismissalReason: null,
        completedAt: null,
      })
    )

    const { result } = renderHook(() => useAnnouncement('seen-once'), {
      wrapper: makeWrapper([config], { storage, storageKey }),
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.state?.isVisible).toBe(false)
    // Restored viewCount should still be 1, not 2
    await waitFor(() => {
      expect(result.current.state?.viewCount).toBe(1)
    })
  })

  it('queues lower-priority announcement when higher-priority active', async () => {
    const high: AnnouncementConfig = {
      id: 'critical',
      variant: 'modal',
      title: 'Critical',
      priority: 'high',
    }
    const low: AnnouncementConfig = {
      id: 'minor',
      variant: 'modal',
      title: 'Minor',
      priority: 'low',
    }

    const { result } = renderHook(() => useAnnouncementsContext(), {
      wrapper: makeWrapper([high, low], {
        queueConfig: { maxConcurrent: 1, stackBehavior: 'queue' },
      }),
    })

    await waitFor(() => {
      expect(result.current.activeAnnouncement).toBe('critical')
    })
    // The low-priority one should be in the queue, not active
    expect(result.current.queue).toContain('minor')
  })

  it('autoShow:false never fires until show() is called explicitly', async () => {
    const onShow = vi.fn()
    const config: AnnouncementConfig = {
      id: 'opt-in',
      variant: 'modal',
      title: 'Opt in',
      autoShow: false,
      onShow,
    }

    const { result } = renderHook(() => useAnnouncement('opt-in'), {
      wrapper: makeWrapper([config]),
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onShow).not.toHaveBeenCalled()
    expect(result.current.state?.isVisible).toBe(false)

    act(() => {
      result.current.show()
    })

    await waitFor(() => {
      expect(onShow).toHaveBeenCalledTimes(1)
    })
  })
})
