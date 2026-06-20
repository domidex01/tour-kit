import { describe, expect, it } from 'vitest'
import type { RecurringPattern } from '../../types'
import { matchesRecurringPattern } from '../../utils/recurring'

describe('matchesRecurringPattern', () => {
  describe('daily', () => {
    it('matches every day when interval is 1 (default)', () => {
      const pattern: RecurringPattern = { type: 'daily' }
      expect(matchesRecurringPattern(new Date('2025-06-15T14:30:00Z'), pattern, 'UTC')).toBe(true)
      expect(matchesRecurringPattern(new Date('2025-06-16T01:00:00Z'), pattern, 'UTC')).toBe(true)
    })

    it('matches only on the interval boundary from startDate', () => {
      const pattern: RecurringPattern = { type: 'daily', interval: 2 }
      // start 2025-06-01; +2 days = 2025-06-03 matches, +1 day does not
      expect(
        matchesRecurringPattern(new Date('2025-06-03T00:00:00Z'), pattern, 'UTC', '2025-06-01')
      ).toBe(true)
      expect(
        matchesRecurringPattern(new Date('2025-06-02T00:00:00Z'), pattern, 'UTC', '2025-06-01')
      ).toBe(false)
    })
  })

  describe('weekly', () => {
    it('matches when the day of week is allowed', () => {
      // 2025-06-15 is a Sunday (0) in UTC
      const pattern: RecurringPattern = { type: 'weekly', daysOfWeek: [0] }
      expect(matchesRecurringPattern(new Date('2025-06-15T14:30:00Z'), pattern, 'UTC')).toBe(true)
    })

    it('does not match when the day of week is not allowed', () => {
      // 2025-06-16 is a Monday (1) in UTC
      const pattern: RecurringPattern = { type: 'weekly', daysOfWeek: [0] }
      expect(matchesRecurringPattern(new Date('2025-06-16T14:30:00Z'), pattern, 'UTC')).toBe(false)
    })
  })

  describe('monthly', () => {
    it('matches on the configured day of month', () => {
      const pattern: RecurringPattern = { type: 'monthly', dayOfMonth: 15 }
      expect(matchesRecurringPattern(new Date('2025-06-15T14:30:00Z'), pattern, 'UTC')).toBe(true)
      expect(matchesRecurringPattern(new Date('2025-06-14T14:30:00Z'), pattern, 'UTC')).toBe(false)
    })
  })

  describe('yearly', () => {
    it('matches on the configured month and day', () => {
      const pattern: RecurringPattern = { type: 'yearly', month: 6, dayOfMonth: 15 }
      expect(matchesRecurringPattern(new Date('2025-06-15T14:30:00Z'), pattern, 'UTC')).toBe(true)
      expect(matchesRecurringPattern(new Date('2025-07-15T14:30:00Z'), pattern, 'UTC')).toBe(false)
    })
  })

  describe('endDate (inclusive, timezone-aware)', () => {
    it('matches throughout the whole end-date day, not just at midnight UTC', () => {
      // Regression: a raw `date > parseDateString(endDate)` rejected any time
      // after 00:00 UTC on the final day. The end date is inclusive of the day.
      const pattern: RecurringPattern = { type: 'daily', endDate: '2025-06-15' }
      expect(matchesRecurringPattern(new Date('2025-06-15T00:00:00Z'), pattern, 'UTC')).toBe(true)
      expect(matchesRecurringPattern(new Date('2025-06-15T14:30:00Z'), pattern, 'UTC')).toBe(true)
      expect(matchesRecurringPattern(new Date('2025-06-15T23:59:59Z'), pattern, 'UTC')).toBe(true)
    })

    it('does not match after the end-date day', () => {
      const pattern: RecurringPattern = { type: 'daily', endDate: '2025-06-15' }
      expect(matchesRecurringPattern(new Date('2025-06-16T00:00:00Z'), pattern, 'UTC')).toBe(false)
    })

    it('evaluates the end date in the schedule timezone, not UTC', () => {
      // 2025-01-01T03:00:00Z is still 2024-12-31 22:00 in America/New_York (UTC-5),
      // so a pattern ending 2024-12-31 is still active there but not in UTC.
      const pattern: RecurringPattern = { type: 'daily', endDate: '2024-12-31' }
      const instant = new Date('2025-01-01T03:00:00Z')
      expect(matchesRecurringPattern(instant, pattern, 'America/New_York')).toBe(true)
      expect(matchesRecurringPattern(instant, pattern, 'UTC')).toBe(false)
    })
  })

  // Slice 5 (I1) — `maxOccurrences` was typed but never enforced; the Studio
  // emits it from the ScheduleEditor. Count-and-cap, in the schedule timezone.
  describe('maxOccurrences cap', () => {
    const START = '2025-06-01' // recurrence start (DateString); counted from here

    it('daily { maxOccurrences: 3 }: matches occurrences 0,1,2 and NOT 3+', () => {
      const pattern: RecurringPattern = { type: 'daily', maxOccurrences: 3 }
      expect(matchesRecurringPattern(new Date('2025-06-01T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      ) // #0
      expect(matchesRecurringPattern(new Date('2025-06-02T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      ) // #1
      expect(matchesRecurringPattern(new Date('2025-06-03T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      ) // #2
      expect(matchesRecurringPattern(new Date('2025-06-04T12:00:00Z'), pattern, 'UTC', START)).toBe(
        false
      ) // #3
      expect(matchesRecurringPattern(new Date('2025-06-10T12:00:00Z'), pattern, 'UTC', START)).toBe(
        false
      ) // far
    })

    it('weekly { daysOfWeek:[1], maxOccurrences: 2 }: matches the first two Mondays only', () => {
      // 2025-06-02, 06-09 are the first two Mondays from START; 06-16 is the third.
      const pattern: RecurringPattern = { type: 'weekly', daysOfWeek: [1], maxOccurrences: 2 }
      expect(matchesRecurringPattern(new Date('2025-06-02T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      ) // Mon #0
      expect(matchesRecurringPattern(new Date('2025-06-09T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      ) // Mon #1
      expect(matchesRecurringPattern(new Date('2025-06-16T12:00:00Z'), pattern, 'UTC', START)).toBe(
        false
      ) // Mon #2
    })

    it('maxOccurrences undefined ⇒ behavior unchanged (regression guard)', () => {
      const pattern: RecurringPattern = { type: 'daily' }
      expect(matchesRecurringPattern(new Date('2025-12-31T12:00:00Z'), pattern, 'UTC', START)).toBe(
        true
      )
    })

    it('no-op when startDate is omitted (cannot count occurrences)', () => {
      const pattern: RecurringPattern = { type: 'daily', maxOccurrences: 1 }
      // Without a start there is no anchor to count from → cap cannot apply.
      expect(matchesRecurringPattern(new Date('2025-12-31T12:00:00Z'), pattern, 'UTC')).toBe(true)
    })

    it('counts occurrences in the schedule timezone, not UTC', () => {
      // 2025-06-04T03:00:00Z is 2025-06-03 23:00 in America/New_York (UTC-4 in June),
      // so under START=2025-06-01 it is occurrence #2 in NY (within cap 3 → true)
      // but occurrence #3 in UTC (count 3 >= 3 → capped → false). The verdict flips.
      const pattern: RecurringPattern = { type: 'daily', maxOccurrences: 3 }
      const instant = new Date('2025-06-04T03:00:00Z')
      expect(matchesRecurringPattern(instant, pattern, 'America/New_York', START)).toBe(true)
      expect(matchesRecurringPattern(instant, pattern, 'UTC', START)).toBe(false)
    })
  })
})
