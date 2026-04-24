import { describe, expect, it } from 'vitest'
import { canShowAfterDismissal, canShowByFrequency, getViewLimit } from '../core/frequency'
import type { SurveyState } from '../types/survey'

function makeState(overrides: Partial<SurveyState> = {}): SurveyState {
  return {
    id: 'test',
    isActive: false,
    isVisible: false,
    isDismissed: false,
    isSnoozed: false,
    isCompleted: false,
    viewCount: 0,
    lastViewedAt: null,
    dismissedAt: null,
    dismissalReason: null,
    completedAt: null,
    snoozeCount: 0,
    snoozeUntil: null,
    currentStep: 0,
    responses: new Map(),
    ...overrides,
  }
}

describe('canShowByFrequency', () => {
  it('returns true when no rule is given', () => {
    expect(canShowByFrequency(makeState(), undefined)).toBe(true)
  })

  it('"once" allows only when never viewed and never completed', () => {
    expect(canShowByFrequency(makeState(), 'once')).toBe(true)
    expect(canShowByFrequency(makeState({ viewCount: 1 }), 'once')).toBe(false)
    expect(canShowByFrequency(makeState({ isCompleted: true }), 'once')).toBe(false)
  })

  it('"session" allows when not dismissed or completed', () => {
    expect(canShowByFrequency(makeState(), 'session')).toBe(true)
    expect(canShowByFrequency(makeState({ isDismissed: true }), 'session')).toBe(false)
    expect(canShowByFrequency(makeState({ isCompleted: true }), 'session')).toBe(false)
  })

  it('"always" allows unless dismissed', () => {
    expect(canShowByFrequency(makeState(), 'always')).toBe(true)
    expect(canShowByFrequency(makeState({ isCompleted: true }), 'always')).toBe(true)
    expect(canShowByFrequency(makeState({ isDismissed: true }), 'always')).toBe(false)
  })

  it('{times, count} allows up to count views', () => {
    const rule = { type: 'times' as const, count: 3 }
    expect(canShowByFrequency(makeState({ viewCount: 0 }), rule)).toBe(true)
    expect(canShowByFrequency(makeState({ viewCount: 2 }), rule)).toBe(true)
    expect(canShowByFrequency(makeState({ viewCount: 3 }), rule)).toBe(false)
  })

  it('{interval, days} requires enough time to pass', () => {
    const rule = { type: 'interval' as const, days: 7 }
    const now = new Date('2026-05-01')
    expect(canShowByFrequency(makeState({ viewCount: 0 }), rule, now)).toBe(true)
    expect(
      canShowByFrequency(
        makeState({ viewCount: 1, lastViewedAt: new Date('2026-04-29') }),
        rule,
        now
      )
    ).toBe(false)
    expect(
      canShowByFrequency(
        makeState({ viewCount: 1, lastViewedAt: new Date('2026-04-20') }),
        rule,
        now
      )
    ).toBe(true)
  })

  it('blocks when snoozed and snoozeUntil is in the future', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    expect(canShowByFrequency(makeState({ isSnoozed: true, snoozeUntil: future }), 'always')).toBe(
      false
    )
  })
})

describe('canShowAfterDismissal', () => {
  it('only "always" allows re-show', () => {
    expect(canShowAfterDismissal(undefined)).toBe(true)
    expect(canShowAfterDismissal('once')).toBe(false)
    expect(canShowAfterDismissal('session')).toBe(false)
    expect(canShowAfterDismissal('always')).toBe(true)
    expect(canShowAfterDismissal({ type: 'times', count: 3 })).toBe(true)
  })
})

describe('getViewLimit', () => {
  it('maps rule types to their limits', () => {
    expect(getViewLimit(undefined)).toBe(Number.POSITIVE_INFINITY)
    expect(getViewLimit('once')).toBe(1)
    expect(getViewLimit('always')).toBe(Number.POSITIVE_INFINITY)
    expect(getViewLimit({ type: 'times', count: 5 })).toBe(5)
    expect(getViewLimit({ type: 'interval', days: 7 })).toBe(Number.POSITIVE_INFINITY)
  })
})
