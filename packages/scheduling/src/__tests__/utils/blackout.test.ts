import { describe, expect, it } from 'vitest'
import type { BlackoutPeriod } from '../../types'
import {
  getBlackoutEndTime,
  getCurrentBlackout,
  isInAnyBlackout,
  isInBlackoutPeriod,
} from '../../utils/blackout'

describe('blackout utilities', () => {
  describe('isInBlackoutPeriod', () => {
    it('does not mutate a Date-form blackout when called', () => {
      const start = new Date('2025-06-15T00:00:00Z')
      const end = new Date('2025-06-16T10:00:00Z')
      const startTime = start.getTime()
      const endTime = end.getTime()

      const blackout: BlackoutPeriod = { id: 'maint', start, end }
      isInBlackoutPeriod(new Date('2025-06-15T12:00:00Z'), blackout)

      expect(start.getTime()).toBe(startTime)
      expect(end.getTime()).toBe(endTime)
      expect(blackout.start).toBe(start)
      expect(blackout.end).toBe(end)
    })

    it('is idempotent across repeated calls with a Date-form blackout', () => {
      const start = new Date('2025-06-15T00:00:00Z')
      const end = new Date('2025-06-16T10:00:00Z')
      const endTimeBefore = end.getTime()

      const blackout: BlackoutPeriod = { id: 'maint', start, end }
      const inside = new Date('2025-06-15T12:00:00Z')
      const firstResult = isInBlackoutPeriod(inside, blackout)
      const secondResult = isInBlackoutPeriod(inside, blackout)

      expect(firstResult).toBe(secondResult)
      expect(end.getTime()).toBe(endTimeBefore)
    })

    it('returns true when date is within a DateString-form blackout', () => {
      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: '2025-06-15',
        end: '2025-06-15',
      }
      expect(isInBlackoutPeriod(new Date('2025-06-15T12:00:00Z'), blackout)).toBe(true)
    })

    it('returns false when date is after a DateString-form blackout', () => {
      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: '2025-06-15',
        end: '2025-06-15',
      }
      expect(isInBlackoutPeriod(new Date('2025-06-17T00:00:00Z'), blackout)).toBe(false)
    })

    it('treats end date as end of day (inclusive through 23:59:59.999 UTC)', () => {
      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: '2025-06-15',
        end: '2025-06-15',
      }
      expect(isInBlackoutPeriod(new Date('2025-06-15T23:59:59.999Z'), blackout)).toBe(true)
      expect(isInBlackoutPeriod(new Date('2025-06-16T00:00:00Z'), blackout)).toBe(false)
    })
  })

  describe('getBlackoutEndTime', () => {
    it('does not mutate the caller Date when end is a Date', () => {
      const end = new Date('2025-06-16T10:00:00Z')
      const endTimeBefore = end.getTime()

      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: new Date('2025-06-15T00:00:00Z'),
        end,
      }
      getBlackoutEndTime(blackout)

      expect(end.getTime()).toBe(endTimeBefore)
      expect(blackout.end).toBe(end)
    })

    it('returns end-of-day UTC for the blackout end', () => {
      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: '2025-06-15',
        end: '2025-06-16',
      }
      const endTime = getBlackoutEndTime(blackout)

      expect(endTime.getUTCHours()).toBe(23)
      expect(endTime.getUTCMinutes()).toBe(59)
      expect(endTime.getUTCSeconds()).toBe(59)
      expect(endTime.getUTCMilliseconds()).toBe(999)
    })
  })

  describe('getCurrentBlackout / isInAnyBlackout', () => {
    it('does not mutate Date-form blackouts in the array', () => {
      const start = new Date('2025-06-15T00:00:00Z')
      const end = new Date('2025-06-16T10:00:00Z')
      const endTimeBefore = end.getTime()

      const blackouts: BlackoutPeriod[] = [{ id: 'maint', start, end }]
      getCurrentBlackout(new Date('2025-06-15T12:00:00Z'), blackouts)
      isInAnyBlackout(new Date('2025-06-15T12:00:00Z'), blackouts)

      expect(end.getTime()).toBe(endTimeBefore)
      expect(blackouts[0].end).toBe(end)
    })

    it('finds the matching blackout and returns the same object reference', () => {
      const blackout: BlackoutPeriod = {
        id: 'maint',
        start: '2025-06-15',
        end: '2025-06-15',
      }
      const current = getCurrentBlackout(new Date('2025-06-15T12:00:00Z'), [blackout])
      expect(current).toBe(blackout)
    })
  })
})
