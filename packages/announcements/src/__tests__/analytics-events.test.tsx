import { act, renderHook } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementsProvider } from '../context/announcements-provider'
import { useAnnouncement } from '../hooks/use-announcement'
import type { AnnouncementConfig } from '../types/announcement'

function createWrapper(track: AnalyticsPlugin['track'], announcements: AnnouncementConfig[]) {
  const plugin: AnalyticsPlugin = { name: 'test', track }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <AnnouncementsProvider announcements={announcements} storage={null}>
          {children}
        </AnnouncementsProvider>
      </AnalyticsProvider>
    )
  }
}

describe('AnnouncementsProvider analytics', () => {
  it('emits shown and completed events for imperative announcements', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const wrapper = createWrapper(track, [
      {
        id: 'release',
        variant: 'modal',
        title: 'Release',
        priority: 'high',
        autoShow: false,
      },
    ])
    const { result } = renderHook(() => useAnnouncement('release'), { wrapper })

    act(() => {
      result.current.show()
    })
    act(() => {
      result.current.complete()
    })

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'announcement_shown',
        tourId: 'release',
        metadata: expect.objectContaining({
          announcementId: 'release',
          priority: 'high',
          trigger: 'manual',
          variant: 'modal',
        }),
      })
    )
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'announcement_completed',
        tourId: 'release',
        metadata: expect.objectContaining({
          announcementId: 'release',
          variant: 'modal',
        }),
      })
    )
  })

  it('emits dismissed events with the dismissal reason', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const wrapper = createWrapper(track, [
      {
        id: 'dismissible',
        variant: 'banner',
        title: 'Dismissible',
        autoShow: false,
      },
    ])
    const { result } = renderHook(() => useAnnouncement('dismissible'), { wrapper })

    act(() => {
      result.current.show()
    })
    act(() => {
      result.current.dismiss('close_button')
    })

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'announcement_dismissed',
        tourId: 'dismissible',
        metadata: expect.objectContaining({
          announcementId: 'dismissible',
          reason: 'close_button',
          variant: 'banner',
        }),
      })
    )
  })
})
