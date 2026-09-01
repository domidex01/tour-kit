import { describe, expect, it } from 'vitest'
import type { TimeRange } from '../../types'
import {
  getNextTimeRangeStart,
  isWithinAnyTimeRange,
  isWithinTimeRange,
} from '../../utils/time-of-day'

describe('isWithinTimeRange', () => {
  const range: TimeRange = { start: '09:00', end: '17:00' }

  it('is true inside the window and false outside', () => {
    expect(isWithinTimeRange(new Date('2025-06-16T12:00:00Z'), range, 'UTC')).toBe(true)
    expect(isWithinTimeRange(new Date('2025-06-16T18:00:00Z'), range, 'UTC')).toBe(false)
    expect(isWithinTimeRange(new Date('2025-06-16T08:00:00Z'), range, 'UTC')).toBe(false)
  })

  it('is inclusive at both boundaries', () => {
    expect(isWithinTimeRange(new Date('2025-06-16T09:00:00Z'), range, 'UTC')).toBe(true)
    expect(isWithinTimeRange(new Date('2025-06-16T17:00:00Z'), range, 'UTC')).toBe(true)
  })

  it('handles an overnight range that crosses midnight', () => {
    // 22:00 → 06:00 spans midnight; 23:00 and 02:00 are inside, 12:00 is outside.
    const overnight: TimeRange = { start: '22:00', end: '06:00' }
    expect(isWithinTimeRange(new Date('2025-06-16T23:00:00Z'), overnight, 'UTC')).toBe(true)
    expect(isWithinTimeRange(new Date('2025-06-16T02:00:00Z'), overnight, 'UTC')).toBe(true)
    expect(isWithinTimeRange(new Date('2025-06-16T12:00:00Z'), overnight, 'UTC')).toBe(false)
  })

  it('resolves the current time in the supplied timezone', () => {
    // 14:30 UTC is 10:30 in NY (inside 09–17) but 23:30 in Tokyo (outside).
    const instant = new Date('2025-06-16T14:30:00Z')
    expect(isWithinTimeRange(instant, range, 'America/New_York')).toBe(true)
    expect(isWithinTimeRange(instant, range, 'Asia/Tokyo')).toBe(false)
  })
})

describe('isWithinAnyTimeRange', () => {
  const ranges: TimeRange[] = [
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '17:00' },
  ]

  it('is true when inside any one range and false in the gap between them', () => {
    expect(isWithinAnyTimeRange(new Date('2025-06-16T10:00:00Z'), ranges, 'UTC')).toBe(true)
    expect(isWithinAnyTimeRange(new Date('2025-06-16T14:00:00Z'), ranges, 'UTC')).toBe(true)
    // 12:30 falls in the lunch gap → outside both windows.
    expect(isWithinAnyTimeRange(new Date('2025-06-16T12:30:00Z'), ranges, 'UTC')).toBe(false)
  })
})

describe('getNextTimeRangeStart', () => {
  const range: TimeRange = { start: '09:00', end: '17:00' }

  it('returns undefined when already in range', () => {
    expect(getNextTimeRangeStart(new Date('2025-06-16T10:00:00Z'), range, 'UTC')).toBeUndefined()
  })

  it('returns today’s start when before the window opens', () => {
    // 06:00 UTC, next 09:00 is +3h same day.
    const now = new Date('2025-06-16T06:00:00Z')
    const next = getNextTimeRangeStart(now, range, 'UTC')
    expect(next).toBeInstanceOf(Date)
    expect(next!.getTime() - now.getTime()).toBe(3 * 60 * 60 * 1000)
  })

  it('rolls to tomorrow’s start when past the window', () => {
    // 18:00 UTC, next 09:00 is 15h away (tomorrow).
    const now = new Date('2025-06-16T18:00:00Z')
    const next = getNextTimeRangeStart(now, range, 'UTC')
    expect(next).toBeInstanceOf(Date)
    expect(next!.getTime() - now.getTime()).toBe(15 * 60 * 60 * 1000)
  })
})
