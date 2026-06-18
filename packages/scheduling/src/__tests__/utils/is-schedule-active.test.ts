import { describe, expect, it } from 'vitest'
import type { Schedule } from '../../types'
import { BUSINESS_HOURS_PRESETS } from '../../types/business-hours'
import { isScheduleActive } from '../../utils/is-schedule-active'

describe('isScheduleActive', () => {
  const fixedDate = new Date('2025-06-15T14:30:00Z') // Sunday, June 15, 2025, 2:30 PM UTC

  describe('basic functionality', () => {
    it('returns active for empty schedule', () => {
      const schedule: Schedule = {}
      const result = isScheduleActive(schedule, { now: fixedDate })
      expect(result.isActive).toBe(true)
    })

    it('returns inactive when explicitly disabled', () => {
      const schedule: Schedule = { enabled: false }
      const result = isScheduleActive(schedule, { now: fixedDate })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('disabled')
    })
  })

  describe('date range', () => {
    it('returns inactive when before start date', () => {
      const schedule: Schedule = {
        startAt: '2025-07-01',
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('not_started')
    })

    it('returns inactive when after end date', () => {
      const schedule: Schedule = {
        endAt: '2025-06-01',
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('ended')
    })

    it('returns active when within date range', () => {
      const schedule: Schedule = {
        startAt: '2025-06-01',
        endAt: '2025-06-30',
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(true)
    })
  })

  describe('day of week', () => {
    it('returns inactive on wrong day of week', () => {
      // fixedDate is Sunday (0)
      const schedule: Schedule = {
        daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('wrong_day')
    })

    it('returns active on allowed day of week', () => {
      // fixedDate is Sunday (0)
      const schedule: Schedule = {
        daysOfWeek: [0, 6], // Weekends
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(true)
    })
  })

  describe('time of day', () => {
    it('returns inactive outside time range', () => {
      const schedule: Schedule = {
        timeOfDay: { start: '09:00', end: '12:00' },
      }
      // fixedDate is 14:30 UTC
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('wrong_time')
    })

    it('returns active within time range', () => {
      const schedule: Schedule = {
        timeOfDay: { start: '09:00', end: '17:00' },
      }
      // fixedDate is 14:30 UTC
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(true)
    })
  })

  describe('blackout periods', () => {
    it('returns inactive during blackout', () => {
      const schedule: Schedule = {
        blackouts: [
          {
            id: 'maintenance',
            start: '2025-06-15',
            end: '2025-06-15',
            reason: 'Scheduled maintenance',
          },
        ],
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('blackout')
    })

    it('returns active outside blackout', () => {
      const schedule: Schedule = {
        blackouts: [
          {
            id: 'maintenance',
            start: '2025-06-20',
            end: '2025-06-21',
          },
        ],
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(true)
    })
  })

  describe('business hours', () => {
    // Same UTC instant, evaluated in two timezones, must yield opposite verdicts.
    const MON_1430Z = new Date('2025-06-16T14:30:00Z') // Mon — NY 10:30 (in), Tokyo 23:30 (out)
    const SUN_1430Z = new Date('2025-06-15T14:30:00Z') // Sun — closed under default { open: false }
    const DST_MON = new Date('2025-03-10T14:30:00Z') // Mon after US spring-forward — NY 10:30 EDT

    it('active in-window for New York', () => {
      const schedule: Schedule = {
        businessHours: BUSINESS_HOURS_PRESETS.standard,
        timezone: 'America/New_York',
      }
      expect(isScheduleActive(schedule, { now: MON_1430Z }).isActive).toBe(true)
    })

    it('INACTIVE for the SAME instant in Tokyo → outside_business_hours', () => {
      const schedule: Schedule = {
        businessHours: BUSINESS_HOURS_PRESETS.standard,
        timezone: 'Asia/Tokyo',
      }
      const result = isScheduleActive(schedule, { now: MON_1430Z })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('outside_business_hours') // verdict flips vs NY
    })

    it('businessHours.timezone overrides schedule.timezone', () => {
      const schedule: Schedule = {
        timezone: 'Asia/Tokyo', // schedule says "out"…
        businessHours: { ...BUSINESS_HOURS_PRESETS.standard, timezone: 'America/New_York' }, // …bh pins NY → "in"
      }
      expect(isScheduleActive(schedule, { now: MON_1430Z }).isActive).toBe(true)
    })

    it('closed day: Sunday under standard preset → outside_business_hours', () => {
      const schedule: Schedule = {
        businessHours: BUSINESS_HOURS_PRESETS.standard, // default { open: false }
        timezone: 'UTC',
      }
      const result = isScheduleActive(schedule, { now: SUN_1430Z })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('outside_business_hours')
    })

    it('businessHours and timeOfDay are independent (timeOfDay precedence: wrong_time first)', () => {
      const schedule: Schedule = {
        timezone: 'America/New_York',
        timeOfDay: { start: '00:00', end: '01:00' }, // 10:30 NY is outside this
        businessHours: BUSINESS_HOURS_PRESETS.standard,
      }
      // timeOfDay (step 5) is checked before business hours (step 5.5)
      expect(isScheduleActive(schedule, { now: MON_1430Z }).reason).toBe('wrong_time')
    })

    it('DST edge: NY window holds across spring-forward', () => {
      const schedule: Schedule = {
        businessHours: BUSINESS_HOURS_PRESETS.standard,
        timezone: 'America/New_York',
      }
      expect(isScheduleActive(schedule, { now: DST_MON }).isActive).toBe(true)
    })

    it('no businessHours field → behavior unchanged (active)', () => {
      expect(isScheduleActive({}, { now: MON_1430Z }).isActive).toBe(true)
    })
  })

  describe('combined constraints', () => {
    it('validates all constraints in order', () => {
      const schedule: Schedule = {
        startAt: '2025-06-01',
        endAt: '2025-06-30',
        daysOfWeek: [0, 6], // Weekends
        timeOfDay: { start: '10:00', end: '18:00' },
      }
      const result = isScheduleActive(schedule, { now: fixedDate, userTimezone: 'UTC' })
      expect(result.isActive).toBe(true)
    })

    it('fails fast on first constraint violation', () => {
      const schedule: Schedule = {
        enabled: false,
        startAt: '2025-06-01',
        daysOfWeek: [0],
      }
      const result = isScheduleActive(schedule, { now: fixedDate })
      expect(result.isActive).toBe(false)
      expect(result.reason).toBe('disabled')
    })
  })
})
