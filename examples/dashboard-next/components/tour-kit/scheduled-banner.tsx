'use client'

import { AnnouncementBanner, useAnnouncement } from '@tour-kit/announcements'
import { type Schedule, useSchedule } from '@tour-kit/scheduling'
import { useEffect, useRef } from 'react'

const businessHours: Schedule = {
  daysOfWeek: [1, 2, 3, 4, 5],
  timeOfDay: { start: '09:00', end: '17:00' },
  useUserTimezone: true,
}

export function ScheduledBanner() {
  const schedule = useSchedule(businessHours)
  const { show } = useAnnouncement('maintenance')
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    shown.current = true
    show()
  }, [show])

  useEffect(() => {
    if (!schedule.isActive) {
      console.log('[tour-kit] maintenance banner silent this hour')
    }
  }, [schedule.isActive])

  if (!schedule.isActive) return null
  return <AnnouncementBanner id="maintenance" useConfig />
}
