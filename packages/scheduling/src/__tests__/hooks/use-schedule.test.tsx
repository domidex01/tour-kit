import { act, renderHook } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSchedule } from '../../hooks/use-schedule'
import type { Schedule } from '../../types'

describe('useSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T14:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns inactive when no schedule provided', () => {
    const { result } = renderHook(() => useSchedule(null))
    expect(result.current.isActive).toBe(false)
    expect(result.current.reason).toBe('disabled')
  })

  it('returns active for empty schedule', () => {
    const schedule: Schedule = {}
    const { result } = renderHook(() => useSchedule(schedule))
    expect(result.current.isActive).toBe(true)
  })

  it('returns inactive when schedule is disabled', () => {
    const schedule: Schedule = { enabled: false }
    const { result } = renderHook(() => useSchedule(schedule))
    expect(result.current.isActive).toBe(false)
    expect(result.current.reason).toBe('disabled')
  })

  it('respects date range constraints', () => {
    const schedule: Schedule = {
      startAt: '2025-07-01',
    }
    const { result } = renderHook(() => useSchedule(schedule, { timezone: 'UTC' }))
    expect(result.current.isActive).toBe(false)
    expect(result.current.reason).toBe('not_started')
  })

  it('provides refresh function', () => {
    const schedule: Schedule = {}
    const { result } = renderHook(() => useSchedule(schedule))

    const initialCheckedAt = result.current.lastCheckedAt

    act(() => {
      vi.advanceTimersByTime(1000)
      result.current.refresh()
    })

    expect(result.current.lastCheckedAt.getTime()).toBeGreaterThan(initialCheckedAt.getTime())
  })

  it('auto-refreshes at specified interval', () => {
    const schedule: Schedule = {}
    const { result } = renderHook(() => useSchedule(schedule, { refreshInterval: 30000 }))

    const initialCheckedAt = result.current.lastCheckedAt

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(result.current.lastCheckedAt.getTime()).toBeGreaterThan(initialCheckedAt.getTime())
  })

  it('can disable auto-refresh', () => {
    const schedule: Schedule = {}
    const { result } = renderHook(() => useSchedule(schedule, { disableAutoRefresh: true }))

    const initialCheckedAt = result.current.lastCheckedAt

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(result.current.lastCheckedAt.getTime()).toBe(initialCheckedAt.getTime())
  })

  it('emits analytics when the schedule is evaluated', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const plugin: AnalyticsPlugin = { name: 'test', track }
    const schedule: Schedule = { enabled: false }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnalyticsProvider config={{ plugins: [plugin] }}>{children}</AnalyticsProvider>
    )

    const { result } = renderHook(() => useSchedule(schedule, { timezone: 'UTC' }), {
      wrapper,
    })

    act(() => {
      result.current.refresh()
    })

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'schedule_evaluated',
        tourId: 'schedule',
        metadata: expect.objectContaining({
          active: false,
          reason: 'disabled',
          timezone: 'UTC',
        }),
      })
    )
  })
})
