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

describe('getScheduleStatus — active schedule', () => {
  // Mon 2025-06-16 10:30 NY, no constraints → active.
  const MON_1430Z = new Date('2025-06-16T14:30:00Z')

  it('returns isActive true, no reason, and the active message; no nextActiveAt', () => {
    const status = getScheduleStatus({}, { now: MON_1430Z, userTimezone: 'UTC' })
    expect(status.isActive).toBe(true)
    expect(status.reason).toBeUndefined()
    expect(status.message).toBe('Schedule is currently active')
    expect(status.nextActiveAt).toBeUndefined()
  })

  it('populates the debug block with the resolved timezone, local time and day', () => {
    // 14:30 UTC → 10:30 in America/New_York (EDT, UTC-4) on a Monday (dayOfWeek 1).
    const status = getScheduleStatus({ timezone: 'America/New_York' }, { now: MON_1430Z })
    expect(status.debug?.timezone).toBe('America/New_York')
    expect(status.debug?.localTime).toBe('10:30')
    expect(status.debug?.dayOfWeek).toBe(1)
    expect(status.debug?.evaluatedAt).toEqual(MON_1430Z)
  })
})

describe('getScheduleStatus — disabled', () => {
  it('reason disabled, message, and no nextActiveAt (cannot predict)', () => {
    const status = getScheduleStatus(
      { enabled: false },
      { now: new Date('2025-06-16T14:30:00Z'), userTimezone: 'UTC' }
    )
    expect(status.isActive).toBe(false)
    expect(status.reason).toBe('disabled')
    expect(status.message).toBe('Schedule is disabled')
    expect(status.nextActiveAt).toBeUndefined()
  })
})

describe('getScheduleStatus — not_started', () => {
  const now = new Date('2025-06-16T14:30:00Z')

  it('string startAt: message names the date and nextActiveAt is the start day', () => {
    const status = getScheduleStatus({ startAt: '2025-07-01' }, { now, userTimezone: 'UTC' })
    expect(status.reason).toBe('not_started')
    expect(status.message).toBe('Schedule starts on 2025-07-01')
    // getDateRangeStart('2025-07-01') → midnight UTC of that day.
    expect(status.nextActiveAt).toEqual(new Date('2025-07-01T00:00:00Z'))
  })

  it('Date startAt: message formats the Date in the schedule timezone', () => {
    const startAt = new Date('2025-07-01T00:00:00Z')
    const status = getScheduleStatus({ startAt, timezone: 'UTC' }, { now })
    expect(status.reason).toBe('not_started')
    expect(status.message).toBe('Schedule starts on 2025-07-01')
    expect(status.nextActiveAt).toEqual(startAt)
  })
})

describe('getScheduleStatus — ended', () => {
  const now = new Date('2025-06-16T14:30:00Z')

  it('string endAt: message names the date; nextActiveAt undefined (never reactivates)', () => {
    const status = getScheduleStatus({ endAt: '2025-06-01' }, { now, userTimezone: 'UTC' })
    expect(status.reason).toBe('ended')
    expect(status.message).toBe('Schedule ended on 2025-06-01')
    expect(status.nextActiveAt).toBeUndefined()
  })

  it('Date endAt: message formats the Date in the schedule timezone', () => {
    const endAt = new Date('2025-06-01T00:00:00Z')
    const status = getScheduleStatus({ endAt, timezone: 'UTC' }, { now })
    expect(status.message).toBe('Schedule ended on 2025-06-01')
  })
})

describe('getScheduleStatus — wrong_day', () => {
  // 2025-06-15 is a Sunday in UTC.
  const SUN = new Date('2025-06-15T14:30:00Z')

  it('message names the current weekday and nextActiveAt is the next allowed day', () => {
    const status = getScheduleStatus(
      { daysOfWeek: [1, 2, 3, 4, 5] },
      { now: SUN, userTimezone: 'UTC' }
    )
    expect(status.reason).toBe('wrong_day')
    expect(status.message).toBe('Not available on Sunday')
    // Next allowed weekday after Sunday is Monday at local midnight (one day ahead).
    expect(status.nextActiveAt).toBeInstanceOf(Date)
    expect(status.nextActiveAt!.getTime()).toBeGreaterThan(SUN.getTime())
  })
})

describe('getScheduleStatus — wrong_time', () => {
  // 14:30 UTC, window 09:00–12:00 → outside.
  const now = new Date('2025-06-16T14:30:00Z')

  it('message names the window and nextActiveAt is the next start instant', () => {
    const status = getScheduleStatus(
      { timeOfDay: { start: '09:00', end: '12:00' } },
      { now, userTimezone: 'UTC' }
    )
    expect(status.reason).toBe('wrong_time')
    expect(status.message).toBe('Available between 09:00 and 12:00')
    // Next 09:00 is tomorrow; the prediction is a future Date.
    expect(status.nextActiveAt).toBeInstanceOf(Date)
    expect(status.nextActiveAt!.getTime()).toBeGreaterThan(now.getTime())
  })
})

describe('getScheduleStatus — blackout', () => {
  const now = new Date('2025-06-15T14:30:00Z')

  it('surfaces currentBlackout details, a reason-bearing message and a post-blackout nextActiveAt', () => {
    const schedule: Schedule = {
      blackouts: [
        {
          id: 'maint',
          start: '2025-06-15',
          end: '2025-06-15',
          reason: 'Scheduled maintenance',
        },
      ],
    }
    const status = getScheduleStatus(schedule, { now, userTimezone: 'UTC' })
    expect(status.reason).toBe('blackout')
    expect(status.message).toBe('Unavailable: Scheduled maintenance')
    expect(status.currentBlackout).toBeDefined()
    expect(status.currentBlackout?.id).toBe('maint')
    expect(status.currentBlackout?.reason).toBe('Scheduled maintenance')
    expect(status.currentBlackout?.endsAt).toBeInstanceOf(Date)
    // nextActiveAt = blackout end + 1s.
    expect(status.nextActiveAt).toBeInstanceOf(Date)
    expect(status.nextActiveAt!.getTime()).toBe(status.currentBlackout!.endsAt.getTime() + 1000)
  })

  it('blackout without a reason falls back to the generic message', () => {
    const schedule: Schedule = {
      blackouts: [{ id: 'maint', start: '2025-06-15', end: '2025-06-15' }],
    }
    const status = getScheduleStatus(schedule, { now, userTimezone: 'UTC' })
    expect(status.reason).toBe('blackout')
    expect(status.message).toBe('Currently in a blackout period')
  })
})

describe('getScheduleStatus — recurring_mismatch', () => {
  it('surfaces reason and message when the recurring pattern excludes the day', () => {
    // 2025-06-16 is Monday (1); pattern only allows Sunday (0).
    const schedule: Schedule = {
      recurring: { type: 'weekly', daysOfWeek: [0] },
    }
    const status = getScheduleStatus(schedule, {
      now: new Date('2025-06-16T14:30:00Z'),
      userTimezone: 'UTC',
    })
    expect(status.reason).toBe('recurring_mismatch')
    expect(status.message).toBe('Does not match recurring schedule')
    // No predictor for recurring → nextActiveAt undefined.
    expect(status.nextActiveAt).toBeUndefined()
  })
})

describe('getScheduleStatus — useUserTimezone false forces UTC', () => {
  it('resolves to UTC when useUserTimezone is false and no schedule.timezone', () => {
    const status = getScheduleStatus(
      { useUserTimezone: false },
      { now: new Date('2025-06-16T14:30:00Z'), userTimezone: 'America/New_York' }
    )
    // userTimezone is ignored; debug timezone is UTC, localTime is 14:30.
    expect(status.debug?.timezone).toBe('UTC')
    expect(status.debug?.localTime).toBe('14:30')
  })
})
