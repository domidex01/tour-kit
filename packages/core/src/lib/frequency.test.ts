import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type FrequencyState,
  canShowAfterDismissal,
  canShowByFrequency,
  getViewLimit,
} from './frequency'

const fresh = (): FrequencyState => ({
  viewCount: 0,
  isDismissed: false,
  lastViewedAt: null,
})

describe('canShowByFrequency', () => {
  describe('rule = undefined', () => {
    it('always shows when no rule is configured', () => {
      expect(canShowByFrequency(fresh(), undefined)).toBe(true)
      expect(canShowByFrequency({ ...fresh(), isDismissed: true }, undefined)).toBe(true)
    })
  })

  describe("rule = 'once'", () => {
    it('shows when viewCount is 0', () => {
      expect(canShowByFrequency(fresh(), 'once')).toBe(true)
    })

    it('does not show after first view', () => {
      expect(canShowByFrequency({ ...fresh(), viewCount: 1 }, 'once')).toBe(false)
    })
  })

  describe("rule = 'session'", () => {
    it('shows until dismissed', () => {
      expect(canShowByFrequency(fresh(), 'session')).toBe(true)
      expect(canShowByFrequency({ ...fresh(), isDismissed: true }, 'session')).toBe(false)
    })
  })

  describe("rule = 'always'", () => {
    it('shows when not dismissed', () => {
      expect(canShowByFrequency(fresh(), 'always')).toBe(true)
    })

    it('does not show while currently dismissed', () => {
      expect(canShowByFrequency({ ...fresh(), isDismissed: true }, 'always')).toBe(false)
    })
  })

  describe("rule = { type: 'times', count: N }", () => {
    it('boundary: viewCount = N - 1 still shows', () => {
      const state = { ...fresh(), viewCount: 2 }
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(true)
    })

    it('boundary: viewCount = N blocks the next show', () => {
      const state = { ...fresh(), viewCount: 3 }
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(false)
    })

    it('boundary: viewCount = N + 1 blocks', () => {
      const state = { ...fresh(), viewCount: 4 }
      expect(canShowByFrequency(state, { type: 'times', count: 3 })).toBe(false)
    })
  })

  describe("rule = { type: 'interval', days: N }", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-08T00:00:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows when viewCount = 0 even if lastViewedAt is null', () => {
      expect(canShowByFrequency(fresh(), { type: 'interval', days: 7 })).toBe(true)
    })

    it('shows when viewed but lastViewedAt is null (data corruption fallback)', () => {
      const state = { ...fresh(), viewCount: 1, lastViewedAt: null }
      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(true)
    })

    it('boundary: exactly at threshold shows', () => {
      const state = {
        ...fresh(),
        viewCount: 1,
        lastViewedAt: new Date('2026-01-01T00:00:00Z'),
      }
      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(true)
    })

    it('boundary: 6 days into window suppresses', () => {
      const state = {
        ...fresh(),
        viewCount: 1,
        lastViewedAt: new Date('2026-01-02T00:00:00Z'),
      }
      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(false)
    })

    it('boundary: 8 days after last view shows', () => {
      const state = {
        ...fresh(),
        viewCount: 1,
        lastViewedAt: new Date('2025-12-31T00:00:00Z'),
      }
      expect(canShowByFrequency(state, { type: 'interval', days: 7 })).toBe(true)
    })
  })
})

describe('canShowAfterDismissal', () => {
  it('undefined rule allows reshow', () => {
    expect(canShowAfterDismissal(undefined)).toBe(true)
  })

  it("'once' blocks reshow", () => {
    expect(canShowAfterDismissal('once')).toBe(false)
  })

  it("'session' blocks reshow", () => {
    expect(canShowAfterDismissal('session')).toBe(false)
  })

  it("'always' allows reshow", () => {
    expect(canShowAfterDismissal('always')).toBe(true)
  })

  it('object rules allow reshow', () => {
    expect(canShowAfterDismissal({ type: 'times', count: 3 })).toBe(true)
    expect(canShowAfterDismissal({ type: 'interval', days: 7 })).toBe(true)
  })
})

describe('getViewLimit', () => {
  it('undefined rule = unbounded', () => {
    expect(getViewLimit(undefined)).toBe(Number.POSITIVE_INFINITY)
  })

  it("'once' = 1", () => {
    expect(getViewLimit('once')).toBe(1)
  })

  it("'session' / 'always' = unbounded", () => {
    expect(getViewLimit('session')).toBe(Number.POSITIVE_INFINITY)
    expect(getViewLimit('always')).toBe(Number.POSITIVE_INFINITY)
  })

  it("{ type: 'times', count } returns count", () => {
    expect(getViewLimit({ type: 'times', count: 5 })).toBe(5)
  })

  it("{ type: 'interval' } = unbounded", () => {
    expect(getViewLimit({ type: 'interval', days: 30 })).toBe(Number.POSITIVE_INFINITY)
  })
})
