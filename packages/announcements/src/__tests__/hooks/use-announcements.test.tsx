import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import { useAnnouncement } from '../../hooks/use-announcement'
import { useAnnouncements } from '../../hooks/use-announcements'
import type { AnnouncementConfig } from '../../types/announcement'

const configs: AnnouncementConfig[] = [
  { id: 'modal-a', variant: 'modal', title: 'Modal A', autoShow: false },
  { id: 'banner-b', variant: 'banner', title: 'Banner B', autoShow: false },
  { id: 'toast-c', variant: 'toast', title: 'Toast C', autoShow: false },
]

function createWrapper(announcements: AnnouncementConfig[] = configs) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnnouncementsProvider announcements={announcements} storage={null}>
        {children}
      </AnnouncementsProvider>
    )
  }
}

describe('useAnnouncements', () => {
  it('exposes every registered announcement state and ids', () => {
    const { result } = renderHook(() => useAnnouncements(), { wrapper: createWrapper() })

    expect(result.current.count).toBe(3)
    expect(result.current.announcements.size).toBe(3)
    expect(result.current.ids.sort()).toEqual(['banner-b', 'modal-a', 'toast-c'])
    expect(result.current.activeId).toBeNull()
  })

  it('getFiltered narrows by variant', () => {
    const { result } = renderHook(() => useAnnouncements(), { wrapper: createWrapper() })

    const modals = result.current.getFiltered({ variant: 'modal' })
    expect(modals).toHaveLength(1)
    expect(modals[0]?.id).toBe('modal-a')

    const modalOrBanner = result.current.getFiltered({ variant: ['modal', 'banner'] })
    expect(modalOrBanner.map((s) => s.id).sort()).toEqual(['banner-b', 'modal-a'])
  })

  it('getFiltered honors a custom filter predicate against state + config', () => {
    const { result } = renderHook(() => useAnnouncements(), { wrapper: createWrapper() })

    const onlyToast = result.current.getFiltered({
      filter: (_state, config) => config.variant === 'toast',
    })
    expect(onlyToast.map((s) => s.id)).toEqual(['toast-c'])
  })

  it('visible / dismissed views and activeId reflect provider transitions', () => {
    const { result } = renderHook(
      () => ({ all: useAnnouncements(), one: useAnnouncement('modal-a') }),
      { wrapper: createWrapper() }
    )

    expect(result.current.all.visible).toHaveLength(0)
    expect(result.current.all.dismissed).toHaveLength(0)

    act(() => {
      result.current.one.show()
    })

    expect(result.current.all.visible.map((s) => s.id)).toEqual(['modal-a'])
    expect(result.current.all.activeId).toBe('modal-a')

    act(() => {
      result.current.one.dismiss('close_button')
    })

    expect(result.current.all.visible).toHaveLength(0)
    expect(result.current.all.dismissed.map((s) => s.id)).toEqual(['modal-a'])
  })

  it('resetAll clears dismissed flags across all announcements', () => {
    const { result } = renderHook(
      () => ({
        all: useAnnouncements(),
        a: useAnnouncement('modal-a'),
        b: useAnnouncement('banner-b'),
      }),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.a.show()
      result.current.a.dismiss()
      result.current.b.show()
      result.current.b.dismiss()
    })

    expect(result.current.all.dismissed).toHaveLength(2)

    act(() => {
      result.current.all.resetAll()
    })

    expect(result.current.all.dismissed).toHaveLength(0)
  })
})
