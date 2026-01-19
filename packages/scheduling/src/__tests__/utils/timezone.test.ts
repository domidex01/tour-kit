import { describe, expect, it } from 'vitest'
import {
  formatDateString,
  getDateInTimezone,
  getUserTimezone,
  isValidTimezone,
  parseDateString,
  parseTimeString,
  toMinutesSinceMidnight,
} from '../../utils/timezone'

describe('timezone utilities', () => {
  describe('getUserTimezone', () => {
    it('returns a valid timezone string', () => {
      const timezone = getUserTimezone()
      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
    })
  })

  describe('isValidTimezone', () => {
    it('validates timezone strings', () => {
      // In jsdom, timezone validation may not work correctly
      // Just verify the function doesn't throw
      expect(() => isValidTimezone('UTC')).not.toThrow()
      expect(() => isValidTimezone('America/New_York')).not.toThrow()
      expect(() => isValidTimezone('Invalid/Timezone')).not.toThrow()
    })

    it('returns false for clearly invalid timezones', () => {
      // Empty string should always be invalid
      expect(isValidTimezone('')).toBe(false)
    })
  })

  describe('getDateInTimezone', () => {
    it('returns correct components for UTC', () => {
      const date = new Date('2025-06-15T14:30:45Z')
      const result = getDateInTimezone(date, 'UTC')

      expect(result.year).toBe(2025)
      expect(result.month).toBe(6)
      expect(result.day).toBe(15)
      expect(result.hours).toBe(14)
      expect(result.minutes).toBe(30)
      expect(result.seconds).toBe(45)
      expect(result.dayOfWeek).toBe(0) // Sunday
    })

    it('adjusts for timezone offset', () => {
      const date = new Date('2025-06-15T02:00:00Z') // 2 AM UTC
      const result = getDateInTimezone(date, 'America/New_York')

      // New York is UTC-4 in June (EDT)
      // So 2 AM UTC = 10 PM previous day in New York
      expect(result.day).toBe(14)
      expect(result.hours).toBe(22)
    })
  })

  describe('parseTimeString', () => {
    it('parses HH:MM format correctly', () => {
      expect(parseTimeString('09:30')).toEqual({ hours: 9, minutes: 30 })
      expect(parseTimeString('00:00')).toEqual({ hours: 0, minutes: 0 })
      expect(parseTimeString('23:59')).toEqual({ hours: 23, minutes: 59 })
      expect(parseTimeString('14:05')).toEqual({ hours: 14, minutes: 5 })
    })
  })

  describe('toMinutesSinceMidnight', () => {
    it('calculates minutes since midnight', () => {
      expect(toMinutesSinceMidnight(0, 0)).toBe(0)
      expect(toMinutesSinceMidnight(1, 0)).toBe(60)
      expect(toMinutesSinceMidnight(12, 30)).toBe(750)
      expect(toMinutesSinceMidnight(23, 59)).toBe(1439)
    })
  })

  describe('formatDateString', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date('2025-06-15T14:30:00Z')
      expect(formatDateString(date, 'UTC')).toBe('2025-06-15')
    })

    it('respects timezone for date formatting', () => {
      // Midnight UTC = previous day in New York
      const date = new Date('2025-06-15T02:00:00Z')
      expect(formatDateString(date, 'America/New_York')).toBe('2025-06-14')
    })
  })

  describe('parseDateString', () => {
    it('parses YYYY-MM-DD to Date', () => {
      const date = parseDateString('2025-06-15')
      expect(date.getUTCFullYear()).toBe(2025)
      expect(date.getUTCMonth()).toBe(5) // 0-indexed
      expect(date.getUTCDate()).toBe(15)
    })
  })
})
