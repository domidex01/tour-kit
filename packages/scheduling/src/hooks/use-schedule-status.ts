'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Schedule, ScheduleStatus } from '../types'
import { getScheduleStatus } from '../utils/get-schedule-status'
import { useUserTimezone } from './use-user-timezone'

export interface UseScheduleStatusOptions {
  /** Refresh interval in milliseconds (default: 60000 = 1 minute) */
  refreshInterval?: number
  /** Disable auto-refresh */
  disableAutoRefresh?: boolean
  /** Override timezone */
  timezone?: string
  /** Include debug information in status */
  debug?: boolean
}

export interface UseScheduleStatusReturn extends ScheduleStatus {
  /** Manually refresh the schedule status */
  refresh: () => void
}

/**
 * Hook to get detailed schedule status with predictions
 *
 * @param schedule - The schedule configuration
 * @param options - Hook options
 * @returns Detailed schedule status with refresh function
 */
export function useScheduleStatus(
  schedule: Schedule | undefined | null,
  options: UseScheduleStatusOptions = {}
): UseScheduleStatusReturn {
  const {
    refreshInterval = 60000,
    disableAutoRefresh = false,
    timezone: timezoneOverride,
    debug = false,
  } = options

  const timezone = useUserTimezone(timezoneOverride ?? schedule?.timezone)

  const getInitialStatus = useCallback((): ScheduleStatus => {
    if (!schedule) {
      return {
        isActive: false,
        reason: 'disabled',
        message: 'No schedule configured',
      }
    }
    const status = getScheduleStatus(schedule, { userTimezone: timezone })
    if (!debug) {
      status.debug = undefined
    }
    return status
  }, [schedule, timezone, debug])

  const [status, setStatus] = useState<ScheduleStatus>(getInitialStatus)

  const refresh = useCallback(() => {
    if (!schedule) {
      setStatus({
        isActive: false,
        reason: 'disabled',
        message: 'No schedule configured',
      })
      return
    }

    const now = new Date()
    const newStatus = getScheduleStatus(schedule, { now, userTimezone: timezone })
    if (!debug) {
      newStatus.debug = undefined
    }
    setStatus(newStatus)
  }, [schedule, timezone, debug])

  // Initial evaluation and when dependencies change
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
    ...status,
    refresh,
  }
}
