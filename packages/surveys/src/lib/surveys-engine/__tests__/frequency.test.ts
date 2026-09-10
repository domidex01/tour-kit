/**
 * v3 Phase 3 Task 3.7 — the six fatigue gates, now React-free leaves.
 *
 * Every one is a pure predicate over numbers and dates, and `userRoll` is a
 * parameter rather than a `Math.random()` call — which is what makes these
 * deterministic at all.
 */
import { describe, expect, it } from 'vitest'
import {
  daysBetween,
  passesFrequencyGates,
  passesGlobalCooldown,
  passesSampling,
  passesSessionLimit,
  passesSnoozeLimit,
} from '../frequency'
import { createInitialSurveyState } from '../reducer'
import type { EngineSurveyConfig } from '../types'

const NOW = new Date('2026-09-10T12:00:00Z')
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000)

describe('daysBetween', () => {
  it('floors whole days and is symmetric', () => {
    expect(daysBetween(daysAgo(3), NOW)).toBe(3)
    expect(daysBetween(NOW, daysAgo(3))).toBe(3)
    expect(daysBetween(daysAgo(0.9), NOW)).toBe(0)
  })
})

describe('passesSampling', () => {
  it('is a strict less-than, so rate 0 admits nobody and rate 1 admits everyone', () => {
    expect(passesSampling(0, 0)).toBe(false)
    expect(passesSampling(1, 0.999999)).toBe(true)
    expect(passesSampling(0.5, 0.49)).toBe(true)
    expect(passesSampling(0.5, 0.5)).toBe(false)
  })
})

describe('passesGlobalCooldown', () => {
  it('passes when there is no cooldown or nothing has been shown', () => {
    expect(passesGlobalCooldown(undefined, daysAgo(0), NOW)).toBe(true)
    expect(passesGlobalCooldown(7, null, NOW)).toBe(true)
  })

  it('is inclusive at the boundary', () => {
    expect(passesGlobalCooldown(7, daysAgo(6), NOW)).toBe(false)
    expect(passesGlobalCooldown(7, daysAgo(7), NOW)).toBe(true)
  })
})

describe('passesSessionLimit and passesSnoozeLimit', () => {
  it('treat undefined as no limit', () => {
    expect(passesSessionLimit(undefined, 999)).toBe(true)
    expect(passesSnoozeLimit(undefined, 999)).toBe(true)
  })

  it('are strict less-than against the count already used', () => {
    expect(passesSessionLimit(2, 1)).toBe(true)
    expect(passesSessionLimit(2, 2)).toBe(false)
    expect(passesSnoozeLimit(3, 2)).toBe(true)
    expect(passesSnoozeLimit(3, 3)).toBe(false)
  })
})

describe('passesFrequencyGates', () => {
  const base = (config: Partial<EngineSurveyConfig> = {}, over = {}) => ({
    config: { id: 'a', ...config } as EngineSurveyConfig,
    surveyState: createInitialSurveyState('a'),
    userRoll: 0,
    providerSamplingRate: 1,
    providerGlobalCooldownDays: undefined,
    providerMaxPerSession: undefined,
    lastShownAt: null,
    sessionShowCount: 0,
    now: NOW,
    ...over,
  })

  it('passes with no limits configured at all', () => {
    expect(passesFrequencyGates(base())).toBe(true)
  })

  it('takes the MINIMUM of provider and config sampling rate', () => {
    // The stricter of the two wins, so a provider-wide 10% cannot be widened
    // by a survey asking for 100%.
    expect(
      passesFrequencyGates(base({ samplingRate: 1 }, { providerSamplingRate: 0.1, userRoll: 0.5 }))
    ).toBe(false)
    expect(
      passesFrequencyGates(base({ samplingRate: 0.1 }, { providerSamplingRate: 1, userRoll: 0.5 }))
    ).toBe(false)
    expect(
      passesFrequencyGates(base({ samplingRate: 1 }, { providerSamplingRate: 1, userRoll: 0.5 }))
    ).toBe(true)
  })

  it('lets the CONFIG override the provider for cooldown and session limit', () => {
    // `config.x ?? provider.x` — the survey's own value wins where it has one.
    expect(
      passesFrequencyGates(
        base({ globalCooldownDays: 1 }, { providerGlobalCooldownDays: 30, lastShownAt: daysAgo(2) })
      )
    ).toBe(true)
    expect(
      passesFrequencyGates(
        base({ maxPerSession: 5 }, { providerMaxPerSession: 1, sessionShowCount: 2 })
      )
    ).toBe(true)
  })

  it('falls back to the provider value when the config has none', () => {
    expect(
      passesFrequencyGates(base({}, { providerGlobalCooldownDays: 30, lastShownAt: daysAgo(2) }))
    ).toBe(false)
    expect(passesFrequencyGates(base({}, { providerMaxPerSession: 1, sessionShowCount: 1 }))).toBe(
      false
    )
  })

  it('refuses once the snooze limit is spent', () => {
    const state = { ...createInitialSurveyState('a'), snoozeCount: 3 }
    expect(passesFrequencyGates(base({ maxSnoozeCount: 3 }, { surveyState: state }))).toBe(false)
    expect(passesFrequencyGates(base({ maxSnoozeCount: 4 }, { surveyState: state }))).toBe(true)
  })

  it('is an AND — the first refusing gate is enough', () => {
    expect(
      passesFrequencyGates(
        base({ samplingRate: 0 }, { providerMaxPerSession: 99, sessionShowCount: 0 })
      )
    ).toBe(false)
  })
})
