import { describe, expect, it } from 'vitest'
import type { Schedule } from '../../types'
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
