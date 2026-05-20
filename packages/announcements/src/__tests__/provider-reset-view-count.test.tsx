import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AnnouncementsProvider } from '../context/announcements-provider'
import { useAnnouncement } from '../hooks/use-announcement'
import type { AnnouncementConfig } from '../types/announcement'

/**
 * Phase 2.1 regression — `reset(id)` must clear `viewCount`, `lastViewedAt`,
 * and `completedAt` alongside the dismissal record. Before the widening, a
 * `frequency: 'once'` announcement stayed gated after reset because
 * `viewCount >= 1` blocked re-show. Step 4 below is the assertion that fails
 * on `main` and passes after the reducer change.
 */

const config: AnnouncementConfig = {
  id: 'reset-view-count',
  variant: 'modal',
  title: 'Once-only',
  frequency: 'once',
  autoShow: false,
}

function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  } satisfies Storage
}

function buildWrapper(storage: Storage) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnnouncementsProvider announcements={[config]} storage={storage}>
        {children}
      </AnnouncementsProvider>
    )
  }
}

describe('reset(id) clears viewCount (Phase 2.1 regression)', () => {
  it('show → dismiss → reset → show re-displays a frequency:once announcement', () => {
    const storage = makeStorage()
    const removeSpy = vi.spyOn(storage, 'removeItem')
    const { result } = renderHook(() => useAnnouncement(config.id), {
      wrapper: buildWrapper(storage),
    })

    // 1. show — visible
    act(() => {
      result.current.show()
    })
    expect(result.current.isVisible).toBe(true)
    expect(result.current.viewCount).toBe(1)

    // 2. dismiss — hidden, dismissed, viewCount preserved at 1
    act(() => {
      result.current.dismiss('close_button')
    })
    expect(result.current.isVisible).toBe(false)
    expect(result.current.isDismissed).toBe(true)
    expect(result.current.viewCount).toBe(1)
    expect(result.current.state?.lastViewedAt).not.toBeNull()

    // 3. reset — viewCount, lastViewedAt, dismissedAt, completedAt all cleared
    act(() => {
      result.current.reset()
    })
    expect(result.current.viewCount).toBe(0)
    expect(result.current.isDismissed).toBe(false)
    expect(result.current.state?.lastViewedAt).toBeNull()
    expect(result.current.state?.dismissedAt).toBeNull()
    expect(result.current.state?.dismissalReason).toBeNull()
    expect(result.current.state?.completedAt).toBeNull()

    // 4. show again — visible (this assertion fails on main because
    // viewCount=1 left the frequency:'once' guard tripped).
    act(() => {
      result.current.show()
    })
    expect(result.current.isVisible).toBe(true)
    expect(result.current.viewCount).toBe(1)

    // 5. The storage row for this id is also cleared on reset (separate
    // contract: the in-reducer state and the persisted row stay in sync).
    expect(removeSpy).toHaveBeenCalledWith(`tour-kit:announcements:${config.id}`)
  })
})
