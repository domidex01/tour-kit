import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { useAnnouncement } from '../../hooks/use-announcement'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import type { AnnouncementConfig } from '../../types/announcement'

const testConfig: AnnouncementConfig = {
  id: 'test-announcement',
  variant: 'modal',
  title: 'Test Announcement',
  description: 'Test description',
}

function createWrapper(announcements: AnnouncementConfig[] = [testConfig]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnnouncementsProvider announcements={announcements} storage={null}>
        {children}
      </AnnouncementsProvider>
    )
  }
}

describe('useAnnouncement', () => {
  it('returns announcement state and config', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    expect(result.current.state).toBeDefined()
    expect(result.current.config).toBeDefined()
    expect(result.current.config?.title).toBe('Test Announcement')
  })

  it('returns undefined for non-existent announcement', () => {
    const { result } = renderHook(() => useAnnouncement('nonexistent'), {
      wrapper: createWrapper(),
    })

    expect(result.current.state).toBeUndefined()
    expect(result.current.config).toBeUndefined()
  })

  it('shows and hides announcement', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isVisible).toBe(false)

    act(() => {
      result.current.show()
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.isActive).toBe(true)

    act(() => {
      result.current.hide()
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('dismisses announcement', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.show()
    })

    expect(result.current.isDismissed).toBe(false)

    act(() => {
      result.current.dismiss('close_button')
    })

    expect(result.current.isDismissed).toBe(true)
    expect(result.current.isVisible).toBe(false)
  })

  it('completes announcement', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.show()
    })

    act(() => {
      result.current.complete()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.state?.completedAt).not.toBeNull()
  })

  it('resets dismissed announcement', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.show()
      result.current.dismiss()
    })

    expect(result.current.isDismissed).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isDismissed).toBe(false)
  })

  it('tracks view count', () => {
    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper(),
    })

    expect(result.current.viewCount).toBe(0)

    act(() => {
      result.current.show()
    })

    expect(result.current.viewCount).toBe(1)

    act(() => {
      result.current.hide()
      result.current.show()
    })

    expect(result.current.viewCount).toBe(2)
  })

  it('respects frequency rules', () => {
    const onceConfig: AnnouncementConfig = {
      ...testConfig,
      frequency: 'once',
    }

    const { result } = renderHook(() => useAnnouncement('test-announcement'), {
      wrapper: createWrapper([onceConfig]),
    })

    expect(result.current.canShow).toBe(true)

    act(() => {
      result.current.show()
      result.current.hide()
    })

    // After one view, canShow should be false for 'once'
    expect(result.current.canShow).toBe(false)
  })
})
