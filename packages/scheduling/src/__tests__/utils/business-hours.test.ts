import { describe, expect, it } from 'vitest'
import type { BusinessHours, DayOfWeek } from '../../types'
import { BUSINESS_HOURS_PRESETS } from '../../types/business-hours'
import { getDayBusinessHours, isHoliday, isWithinBusinessHours } from '../../utils/business-hours'

describe('isWithinBusinessHours', () => {
  // Standard preset: Mon-Fri 09:00-17:00, default { open: false }.
  const standard = BUSINESS_HOURS_PRESETS.standard

  it('open weekday inside the window vs outside it', () => {
    // Mon 2025-06-16 in UTC: 12:00 inside 09-17, 18:00 outside.
    expect(isWithinBusinessHours(new Date('2025-06-16T12:00:00Z'), standard, 'UTC')).toBe(true)
    expect(isWithinBusinessHours(new Date('2025-06-16T18:00:00Z'), standard, 'UTC')).toBe(false)
  })

  it('closed day (default open:false) returns false', () => {
    // Sunday is not in the days map → falls back to default { open: false }.
    expect(isWithinBusinessHours(new Date('2025-06-15T12:00:00Z'), standard, 'UTC')).toBe(false)
  })

  it('SAME instant flips verdict across a DST-spanning timezone pair', () => {
    // 2025-06-16T14:30Z (a Monday): 10:30 in New York (inside 09-17) but
    // 23:30 in Tokyo (outside). The verdict MUST differ by timezone.
    const instant = new Date('2025-06-16T14:30:00Z')
    expect(isWithinBusinessHours(instant, standard, 'America/New_York')).toBe(true)
    expect(isWithinBusinessHours(instant, standard, 'Asia/Tokyo')).toBe(false)
  })

  it('holiday date forces closed even during open hours', () => {
    const withHoliday: BusinessHours = {
      ...standard,
      holidays: ['2025-06-16'],
    }
    // Monday 12:00 would otherwise be open, but the date is a holiday.
    expect(isWithinBusinessHours(new Date('2025-06-16T12:00:00Z'), withHoliday, 'UTC')).toBe(false)
    // A non-holiday Monday is still open.
    expect(isWithinBusinessHours(new Date('2025-06-23T12:00:00Z'), withHoliday, 'UTC')).toBe(true)
  })

  it('per-day config overrides the default', () => {
    const config: BusinessHours = {
      default: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
      days: { 1: { open: false } }, // Monday explicitly closed
    }
    // Monday → uses the per-day override (closed).
    expect(isWithinBusinessHours(new Date('2025-06-16T12:00:00Z'), config, 'UTC')).toBe(false)
    // Tuesday → falls back to default (open all day).
    expect(isWithinBusinessHours(new Date('2025-06-17T12:00:00Z'), config, 'UTC')).toBe(true)
  })

  it('open day with no hours array means open all day', () => {
    const config: BusinessHours = {
      days: { 1: { open: true } }, // open, no hours → all day
    }
    expect(isWithinBusinessHours(new Date('2025-06-16T03:00:00Z'), config, 'UTC')).toBe(true)
    expect(isWithinBusinessHours(new Date('2025-06-16T22:00:00Z'), config, 'UTC')).toBe(true)
  })

  it('returns false when no config and no default exist for the day', () => {
    const config: BusinessHours = { days: {} } // no default, Monday unconfigured
    expect(isWithinBusinessHours(new Date('2025-06-16T12:00:00Z'), config, 'UTC')).toBe(false)
  })

  it('honors multiple time-range windows in one day (split hours)', () => {
    const config: BusinessHours = {
      days: {
        1: {
          open: true,
          hours: [
            { start: '09:00', end: '12:00' },
            { start: '13:00', end: '17:00' },
          ],
        },
      },
    }
    expect(isWithinBusinessHours(new Date('2025-06-16T10:00:00Z'), config, 'UTC')).toBe(true) // morning
    expect(isWithinBusinessHours(new Date('2025-06-16T14:00:00Z'), config, 'UTC')).toBe(true) // afternoon
    expect(isWithinBusinessHours(new Date('2025-06-16T12:30:00Z'), config, 'UTC')).toBe(false) // lunch gap
  })

  it('falls back to businessHours.timezone when no explicit timezone is passed', () => {
    const config: BusinessHours = { ...standard, timezone: 'America/New_York' }
    // 14:30Z = 10:30 NY → inside, resolved via businessHours.timezone.
    expect(isWithinBusinessHours(new Date('2025-06-16T14:30:00Z'), config)).toBe(true)
  })
})

describe('getDayBusinessHours', () => {
  it('returns closed with empty hours for a closed day', () => {
    const result = getDayBusinessHours(0 as DayOfWeek, BUSINESS_HOURS_PRESETS.standard)
    expect(result.isOpen).toBe(false)
    expect(result.hours).toEqual([])
  })

  it('returns the configured hours for an open day', () => {
    const result = getDayBusinessHours(1 as DayOfWeek, BUSINESS_HOURS_PRESETS.standard)
    expect(result.isOpen).toBe(true)
    expect(result.hours).toEqual([{ start: '09:00', end: '17:00' }])
  })

  it('defaults to all-day hours when an open day has no hours array', () => {
    const config: BusinessHours = { days: { 2: { open: true } } }
    const result = getDayBusinessHours(2 as DayOfWeek, config)
    expect(result.isOpen).toBe(true)
    expect(result.hours).toEqual([{ start: '00:00', end: '23:59' }])
  })
})

describe('isHoliday', () => {
  it('returns false when no holidays are configured', () => {
    expect(isHoliday(new Date('2025-06-16T12:00:00Z'), { holidays: [] }, 'UTC')).toBe(false)
    expect(isHoliday(new Date('2025-06-16T12:00:00Z'), {}, 'UTC')).toBe(false)
  })

  it('matches a holiday date string in the supplied timezone', () => {
    const config: BusinessHours = { holidays: ['2025-12-25'] }
    expect(isHoliday(new Date('2025-12-25T12:00:00Z'), config, 'UTC')).toBe(true)
    expect(isHoliday(new Date('2025-12-26T12:00:00Z'), config, 'UTC')).toBe(false)
  })

  it('resolves the date in the timezone before comparing (boundary shift)', () => {
    // 2025-12-25T02:00Z is 2025-12-24 21:00 in New York, so it is NOT yet the
    // holiday there, but it IS the holiday in UTC.
    const config: BusinessHours = { holidays: ['2025-12-25'] }
    const instant = new Date('2025-12-25T02:00:00Z')
    expect(isHoliday(instant, config, 'UTC')).toBe(true)
    expect(isHoliday(instant, config, 'America/New_York')).toBe(false)
  })
})
