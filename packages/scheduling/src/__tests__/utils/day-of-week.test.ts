import { describe, expect, it } from 'vitest'
import type { DayName, DayOfWeek } from '../../types'
import { DAY_NAMES } from '../../types'
import {
  DAY_GROUPS,
  dayNameToNumber,
  dayNumberToName,
  getDayOfWeek,
  getNextAllowedDay,
  isAllowedDay,
} from '../../utils/day-of-week'

describe('getDayOfWeek', () => {
  it('maps a Sunday UTC instant to 0 and a Monday to 1', () => {
    expect(getDayOfWeek(new Date('2025-06-15T12:00:00Z'), 'UTC')).toBe(0)
    expect(getDayOfWeek(new Date('2025-06-16T12:00:00Z'), 'UTC')).toBe(1)
  })

  it('shifts the weekday across the date line by timezone', () => {
    // Mon 2025-06-16T14:30Z is still Mon in NY but already 23:30 Mon in Tokyo.
    // Sun 2025-06-15T23:00Z is Sun in UTC but Mon 08:00 in Tokyo.
    const instant = new Date('2025-06-15T23:00:00Z')
    expect(getDayOfWeek(instant, 'UTC')).toBe(0) // Sunday
    expect(getDayOfWeek(instant, 'Asia/Tokyo')).toBe(1) // Monday (+9h)
  })
})

describe('isAllowedDay', () => {
  it('returns true when the resolved day is in the list, false otherwise', () => {
    const sun = new Date('2025-06-15T12:00:00Z')
    expect(isAllowedDay(sun, [0, 6], 'UTC')).toBe(true)
    expect(isAllowedDay(sun, [1, 2, 3, 4, 5], 'UTC')).toBe(false)
  })
})

describe('dayNameToNumber / dayNumberToName round-trip', () => {
  it('maps each name to its index and back', () => {
    DAY_NAMES.forEach((name, index) => {
      expect(dayNameToNumber(name as DayName)).toBe(index as DayOfWeek)
      expect(dayNumberToName(index as DayOfWeek)).toBe(name)
    })
  })

  it('maps boundary days sunday(0) and saturday(6)', () => {
    expect(dayNameToNumber('sunday')).toBe(0)
    expect(dayNameToNumber('saturday')).toBe(6)
    expect(dayNumberToName(0)).toBe('sunday')
    expect(dayNumberToName(6)).toBe('saturday')
  })
})

describe('getNextAllowedDay', () => {
  // 2025-06-15 is Sunday (0) in UTC.
  const SUN = new Date('2025-06-15T12:00:00Z')

  it('returns undefined when no days are allowed', () => {
    expect(getNextAllowedDay(SUN, [], 'UTC')).toBeUndefined()
  })

  it('finds the nearest upcoming day and resets to local midnight', () => {
    // From Sunday, next weekday is Monday → 1 day ahead.
    const next = getNextAllowedDay(SUN, [1, 2, 3, 4, 5], 'UTC')
    expect(next).toBeInstanceOf(Date)
    expect(next!.getHours()).toBe(0)
    expect(next!.getMinutes()).toBe(0)
    // One day ahead of the Sunday instant.
    expect(next!.getTime()).toBeGreaterThan(SUN.getTime())
  })

  it('wraps to next week when the only allowed day is today (daysAhead<=0 → +7)', () => {
    // Today is Sunday(0); allowing only Sunday means the next match is 7 days out.
    const next = getNextAllowedDay(SUN, [0], 'UTC')
    expect(next).toBeInstanceOf(Date)
    const days = Math.round((next!.getTime() - SUN.getTime()) / 86_400_000)
    // 6 or 7 depending on the midnight reset; it must be in the next week, > 5.
    expect(days).toBeGreaterThan(5)
  })

  it('picks the minimum gap when several days are allowed', () => {
    // From Sunday, allowed {Saturday(6), Tuesday(2)} → Tuesday is nearer (2 vs 6).
    const next = getNextAllowedDay(SUN, [6, 2], 'UTC')
    const days = Math.round((next!.getTime() - SUN.getTime()) / 86_400_000)
    expect(days).toBeLessThan(4)
  })
})

describe('DAY_GROUPS', () => {
  it('exposes weekday, weekend and full-week presets', () => {
    expect(DAY_GROUPS.weekdays).toEqual([1, 2, 3, 4, 5])
    expect(DAY_GROUPS.weekends).toEqual([0, 6])
    expect(DAY_GROUPS.all).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
