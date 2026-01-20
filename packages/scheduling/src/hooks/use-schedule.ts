'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Schedule, ScheduleResult } from '../types'
import { isScheduleActive } from '../utils/is-schedule-active'
import { useUserTimezone } from './use-user-timezone'

export interface UseScheduleOptions {
  /** Refresh interval in milliseconds (default: 60000 = 1 minute) */
  refreshInterval?: number
  /** Disable auto-refresh */
  disableAutoRefresh?: boolean
  /** Override timezone */
  timezone?: string
}

export interface UseScheduleReturn extends ScheduleResult {
  /** Manually refresh the schedule status */
  refresh: () => void
  /** Last evaluation timestamp */
  lastCheckedAt: Date
  /** Current timezone being used */
  timezone: string
}

/**
 * Hook to reactively monitor schedule status
 *
 * @param schedule - The schedule configuration
 * @param options - Hook options
 * @returns Schedule result with refresh function
 */
export function useSchedule(
  schedule: Schedule | undefined | null,
  options: UseScheduleOptions = {}
): UseScheduleReturn {
  const {
    refreshInterval = 60000,
    disableAutoRefresh = false,
    timezone: timezoneOverride,
  } = options

  const timezone = useUserTimezone(timezoneOverride ?? schedule?.timezone)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date>(() => new Date())
  const [result, setResult] = useState<ScheduleResult>(() => {
    if (!schedule) {
      return { isActive: false, reason: 'disabled' }
    }
    return isScheduleActive(schedule, { userTimezone: timezone })
  })

  const refresh = useCallback(() => {
    const now = new Date()
    setLastCheckedAt(now)

    if (!schedule) {
      setResult({ isActive: false, reason: 'disabled' })
      return
    }

    const newResult = isScheduleActive(schedule, { now, userTimezone: timezone })
    setResult(newResult)
  }, [schedule, timezone])

  // Initial evaluation and when schedule/timezone changes
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-refresh interval
  useEffect(() => {
    if (disableAutoRefresh || !schedule) {
      return
    }

    const intervalId = setInterval(refresh, refreshInterval)
    return () => clearInterval(intervalId)
  }, [disableAutoRefresh, refresh, refreshInterval, schedule])

  return {
    ...result,
    refresh,
    lastCheckedAt,
    timezone,
  }
}
