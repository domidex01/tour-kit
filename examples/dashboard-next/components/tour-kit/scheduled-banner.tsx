'use client'

import { AnnouncementBanner, useAnnouncement } from '@tour-kit/announcements'
import { type Schedule, useSchedule } from '@tour-kit/scheduling'
import { useEffect, useRef, useState } from 'react'

const businessHours: Schedule = {
  daysOfWeek: [1, 2, 3, 4, 5],
  timeOfDay: { start: '09:00', end: '17:00' },
  useUserTimezone: true,
}

export function ScheduledBanner() {
  // Announcement registration + schedule evaluation both depend on values
  // SSR cannot match (provider state + current time). The diagnostic `sr-only`
  // aside below would otherwise serialize one branch on the server (e.g.
  // `not_registered`) and another on the client (e.g. `wrong_time`),
  // triggering React's hydration-mismatch warning on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const schedule = useSchedule(businessHours)
  const announcement = useAnnouncement('maintenance')
  const shown = useRef(false)

  useEffect(() => {
    if (!schedule.isActive) {
      shown.current = false
      return
    }
    if (shown.current) return
    if (!announcement.config || !announcement.canShow || announcement.isVisible) return

    shown.current = true
    announcement.show()
  }, [announcement, schedule.isActive])

  useEffect(() => {
    if (!schedule.isActive) {
      console.log('[tour-kit] maintenance banner hidden', {
        reason: schedule.reason ?? 'inactive',
        timezone: schedule.timezone,
      })
    }
  }, [schedule.isActive, schedule.reason, schedule.timezone])

  // SSR pass renders nothing — see mount-guard rationale above.
  if (!mounted) return null

  if (!schedule.isActive) {
    return (
      <aside data-tourkit-schedule-diagnostic className="sr-only">
        Maintenance banner hidden: {schedule.reason ?? 'inactive'}
      </aside>
    )
  }
  if (!announcement.config || (!announcement.canShow && !announcement.isVisible)) {
    return (
      <aside data-tourkit-schedule-diagnostic className="sr-only">
        Maintenance banner hidden: {announcement.config ? 'not_showable' : 'not_registered'}
      </aside>
    )
  }
  return <AnnouncementBanner id="maintenance" useConfig />
}
