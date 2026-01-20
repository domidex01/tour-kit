import { describe, expect, it } from 'vitest'
import { canShowByFrequency, getViewLimit } from '../../core/frequency'
import type { AnnouncementState } from '../../types/announcement'

function createState(overrides: Partial<AnnouncementState> = {}): AnnouncementState {
  return {
    id: 'test',
    isActive: false,
    isVisible: false,
    isDismissed: false,
    viewCount: 0,
    lastViewedAt: null,
    dismissedAt: null,
    dismissalReason: null,
    completedAt: null,
    ...overrides,
  }
}

describe('canShowByFrequency', () => {
  describe('once', () => {
    it('allows showing when never viewed', () => {
      const state = createState({ viewCount: 0 })
      expect(canShowByFrequency(state, 'once')).toBe(true)
    })

    it('blocks showing after first view', () => {
      const state = createState({ viewCount: 1 })
      expect(canShowByFrequency(state, 'once')).toBe(false)
    })
  })

  describe('session', () => {
    it('allows showing when not dismissed', () => {
      const state = createState({ isDismissed: false })
      expect(canShowByFrequency(state, 'session')).toBe(true)
    })

    it('blocks showing when dismissed', () => {
      const state = createState({ isDismissed: true })
      expect(canShowByFrequency(state, 'session')).toBe(false)
    })
  })

  describe('always', () => {
    it('allows showing when not dismissed', () => {
      const state = createState({ viewCount: 100, isDismissed: false })
      expect(canShowByFrequency(state, 'always')).toBe(true)
    })

    it('blocks showing when dismissed', () => {
      const state = createState({ isDismissed: true })
      expect(canShowByFrequency(state, 'always')).toBe(false)
    })
  })

  describe('times', () => {
    it('allows showing within limit', () => {
      const state = createState({ viewCount: 2 })
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(true)
    })

    it('blocks showing at limit', () => {
      const state = createState({ viewCount: 3 })
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(false)
    })

    it('blocks showing over limit', () => {
      const state = createState({ viewCount: 5 })
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(false)
    })
  })

  describe('interval', () => {
    it('allows showing when never viewed', () => {
      const state = createState({ viewCount: 0 })
      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(true)
    })

    it('allows showing when interval has passed', () => {
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

      const state = createState({
        viewCount: 1,
        lastViewedAt: eightDaysAgo,
      })

      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(true)
    })

    it('blocks showing when interval has not passed', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const state = createState({
        viewCount: 1,
        lastViewedAt: twoDaysAgo,
      })

      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(false)
    })
  })

  describe('no rule', () => {
    it('allows showing when no rule specified', () => {
      const state = createState({ viewCount: 100 })
      expect(canShowByFrequency(state, undefined)).toBe(true)
    })
  })
})

describe('getViewLimit', () => {
  it('returns 1 for once', () => {
    expect(getViewLimit('once')).toBe(1)
  })

  it('returns Infinity for session', () => {
    expect(getViewLimit('session')).toBe(Number.POSITIVE_INFINITY)
  })

  it('returns Infinity for always', () => {
    expect(getViewLimit('always')).toBe(Number.POSITIVE_INFINITY)
  })

  it('returns count for times', () => {
    expect(getViewLimit({ type: 'times', count: 5 })).toBe(5)
  })

  it('returns Infinity for interval', () => {
    expect(getViewLimit({ type: 'interval', days: 7 })).toBe(Number.POSITIVE_INFINITY)
  })

  it('returns Infinity for undefined', () => {
    expect(getViewLimit(undefined)).toBe(Number.POSITIVE_INFINITY)
  })
})
