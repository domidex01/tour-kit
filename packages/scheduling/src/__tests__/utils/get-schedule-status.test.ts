import { describe, expect, it } from 'vitest'
import type { Schedule } from '../../types'
import { BUSINESS_HOURS_PRESETS } from '../../types/business-hours'
import { getScheduleStatus } from '../../utils/get-schedule-status'

describe('getScheduleStatus — outside_business_hours', () => {
  // 2025-06-16T14:30Z is Mon 23:30 in Tokyo → outside the standard 9-17 window.
  const MON_1430Z = new Date('2025-06-16T14:30:00Z')

  it('surfaces reason + message and leaves nextActiveAt undefined', () => {
    const schedule: Schedule = {
      businessHours: BUSINESS_HOURS_PRESETS.standard,
      timezone: 'Asia/Tokyo',
    }
    const status = getScheduleStatus(schedule, { now: MON_1430Z })
    expect(status.reason).toBe('outside_business_hours')
    expect(status.message).toBe('Outside of business hours')
    // Documented gap: next-open prediction is not computed for this reason.
    expect(status.nextActiveAt).toBeUndefined()
  })
})
