/**
 * @tour-kit/adoption - Nudge Scheduler Tests
 *
 * Tests for the nudge scheduling engine functions.
 * These are pure unit tests with no React dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dismissNudge,
  markNudgeShown,
  selectFeaturesForNudge,
  snoozeNudge,
} from '../../engine/nudge-scheduler'
import type { Feature, FeatureUsage, NudgeState } from '../../types'

// -----------------------------------------------------------------------------
// Mock Factories
// -----------------------------------------------------------------------------

function createMockFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'test-feature',
    name: 'Test Feature',
    trigger: '#test-button',
    description: 'A test feature',
    priority: 0,
    ...overrides,
  }
}

function createMockUsage(overrides: Partial<FeatureUsage> = {}): FeatureUsage {
  return {
    featureId: 'test-feature',
    firstUsed: null,
    lastUsed: null,
    useCount: 0,
    status: 'not_started',
    ...overrides,
  }
}

function createMockNudgeState(overrides: Partial<NudgeState> = {}): NudgeState {
  return {
    lastShown: null,
    sessionCount: 0,
    dismissed: [],
    snoozed: {},
    ...overrides,
  }
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('selectFeaturesForNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Session Limits', () => {
    it('returns shouldNudge false when session limit reached', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      const nudgeState = createMockNudgeState({ sessionCount: 3 })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.features).toEqual([])
      expect(decision.reason).toBe('Session limit reached')
    })

    it('allows nudge when session count is below limit', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      const nudgeState = createMockNudgeState({ sessionCount: 2 })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
    })

    it('respects custom maxPerSession config', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      const nudgeState = createMockNudgeState({ sessionCount: 5 })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState, {
        maxPerSession: 10,
      })

      expect(decision.shouldNudge).toBe(true)
    })
  })

  describe('Cooldown Logic', () => {
    it('returns shouldNudge false when cooldown is active', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      // 1 hour ago (within default 24h cooldown)
      const nudgeState = createMockNudgeState({
        lastShown: '2024-01-15T09:00:00.000Z',
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('Cooldown active')
    })

    it('allows nudge when cooldown has expired', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      // 25 hours ago (past default 24h cooldown)
      const nudgeState = createMockNudgeState({
        lastShown: '2024-01-14T09:00:00.000Z',
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
    })

    it('allows nudge when lastShown is null', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      const nudgeState = createMockNudgeState({ lastShown: null })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
    })

    it('respects custom cooldown config', () => {
      const features = [createMockFeature()]
      const usageMap = {}
      // 2 hours ago
      const nudgeState = createMockNudgeState({
        lastShown: '2024-01-15T08:00:00.000Z',
      })

      // 1 hour cooldown
      const decision = selectFeaturesForNudge(features, usageMap, nudgeState, {
        cooldown: 60 * 60 * 1000,
      })

      expect(decision.shouldNudge).toBe(true)
    })
  })

  describe('Feature Selection', () => {
    it('includes features with no usage record', () => {
      const features = [createMockFeature({ id: 'new-feature' })]
      const usageMap = {}
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
      expect(decision.features).toHaveLength(1)
      expect(decision.features[0].id).toBe('new-feature')
    })

    it('includes features with not_started status', () => {
      const features = [createMockFeature({ id: 'unused-feature' })]
      const usageMap = {
        'unused-feature': createMockUsage({
          featureId: 'unused-feature',
          status: 'not_started',
        }),
      }
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
      expect(decision.features[0].id).toBe('unused-feature')
    })

    it('includes features with churned status', () => {
      const features = [createMockFeature({ id: 'churned-feature' })]
      const usageMap = {
        'churned-feature': createMockUsage({
          featureId: 'churned-feature',
          status: 'churned',
        }),
      }
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
      expect(decision.features[0].id).toBe('churned-feature')
    })

    it('excludes features with exploring status', () => {
      const features = [createMockFeature({ id: 'exploring-feature' })]
      const usageMap = {
        'exploring-feature': createMockUsage({
          featureId: 'exploring-feature',
          status: 'exploring',
        }),
      }
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('No features need nudging')
    })

    it('excludes features with adopted status', () => {
      const features = [createMockFeature({ id: 'adopted-feature' })]
      const usageMap = {
        'adopted-feature': createMockUsage({
          featureId: 'adopted-feature',
          status: 'adopted',
        }),
      }
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('No features need nudging')
    })
  })

  describe('Dismissed Features', () => {
    it('excludes dismissed features', () => {
      const features = [createMockFeature({ id: 'dismissed-feature' })]
      // Need usage record so the dismiss check is reached (after status check)
      const usageMap = {
        'dismissed-feature': createMockUsage({
          featureId: 'dismissed-feature',
          status: 'not_started',
        }),
      }
      const nudgeState = createMockNudgeState({
        dismissed: ['dismissed-feature'],
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('No features need nudging')
    })

    it('includes non-dismissed features when others are dismissed', () => {
      const features = [
        createMockFeature({ id: 'dismissed-feature' }),
        createMockFeature({ id: 'active-feature' }),
      ]
      // Need usage records so the dismiss check is reached
      const usageMap = {
        'dismissed-feature': createMockUsage({
          featureId: 'dismissed-feature',
          status: 'not_started',
        }),
        'active-feature': createMockUsage({
          featureId: 'active-feature',
          status: 'not_started',
        }),
      }
      const nudgeState = createMockNudgeState({
        dismissed: ['dismissed-feature'],
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
      expect(decision.features).toHaveLength(1)
      expect(decision.features[0].id).toBe('active-feature')
    })
  })

  describe('Snoozed Features', () => {
    it('excludes snoozed features during snooze period', () => {
      const features = [createMockFeature({ id: 'snoozed-feature' })]
      // Need usage record so the snooze check is reached
      const usageMap = {
        'snoozed-feature': createMockUsage({
          featureId: 'snoozed-feature',
          status: 'not_started',
        }),
      }
      // Snoozed until 1 hour from now
      const nudgeState = createMockNudgeState({
        snoozed: { 'snoozed-feature': '2024-01-15T11:00:00.000Z' },
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('No features need nudging')
    })

    it('includes features after snooze period expires', () => {
      const features = [createMockFeature({ id: 'snoozed-feature' })]
      // Need usage record so the snooze check is reached
      const usageMap = {
        'snoozed-feature': createMockUsage({
          featureId: 'snoozed-feature',
          status: 'not_started',
        }),
      }
      // Snooze expired 1 hour ago
      const nudgeState = createMockNudgeState({
        snoozed: { 'snoozed-feature': '2024-01-15T09:00:00.000Z' },
      })

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(true)
      expect(decision.features[0].id).toBe('snoozed-feature')
    })
  })

  describe('Priority Sorting', () => {
    it('sorts features by priority (highest first)', () => {
      const features = [
        createMockFeature({ id: 'low', priority: 1 }),
        createMockFeature({ id: 'high', priority: 10 }),
        createMockFeature({ id: 'medium', priority: 5 }),
      ]
      const usageMap = {}
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState, {
        maxFeatures: 3,
      })

      expect(decision.features.map((f) => f.id)).toEqual(['high', 'medium', 'low'])
    })

    it('treats undefined priority as 0', () => {
      const features = [
        createMockFeature({ id: 'no-priority', priority: undefined }),
        createMockFeature({ id: 'has-priority', priority: 1 }),
      ]
      const usageMap = {}
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState, {
        maxFeatures: 2,
      })

      expect(decision.features[0].id).toBe('has-priority')
    })
  })

  describe('Max Features Limit', () => {
    it('limits to default maxFeatures (1)', () => {
      const features = [
        createMockFeature({ id: 'feature-1' }),
        createMockFeature({ id: 'feature-2' }),
        createMockFeature({ id: 'feature-3' }),
      ]
      const usageMap = {}
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.features).toHaveLength(1)
    })

    it('respects custom maxFeatures config', () => {
      const features = [
        createMockFeature({ id: 'feature-1' }),
        createMockFeature({ id: 'feature-2' }),
        createMockFeature({ id: 'feature-3' }),
      ]
      const usageMap = {}
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState, {
        maxFeatures: 2,
      })

      expect(decision.features).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty features array', () => {
      const decision = selectFeaturesForNudge([], {}, createMockNudgeState())

      expect(decision.shouldNudge).toBe(false)
      expect(decision.features).toEqual([])
      expect(decision.reason).toBe('No features need nudging')
    })

    it('handles all features being excluded', () => {
      const features = [
        createMockFeature({ id: 'adopted' }),
        createMockFeature({ id: 'exploring' }),
      ]
      const usageMap = {
        adopted: createMockUsage({ featureId: 'adopted', status: 'adopted' }),
        exploring: createMockUsage({ featureId: 'exploring', status: 'exploring' }),
      }
      const nudgeState = createMockNudgeState()

      const decision = selectFeaturesForNudge(features, usageMap, nudgeState)

      expect(decision.shouldNudge).toBe(false)
      expect(decision.reason).toBe('No features need nudging')
    })
  })
})

describe('markNudgeShown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates lastShown to current time', () => {
    const state = createMockNudgeState()
    const updated = markNudgeShown(state)

    expect(updated.lastShown).toBe('2024-01-15T10:00:00.000Z')
  })

  it('increments sessionCount by 1', () => {
    const state = createMockNudgeState({ sessionCount: 2 })
    const updated = markNudgeShown(state)

    expect(updated.sessionCount).toBe(3)
  })

  it('preserves other state properties', () => {
    const state = createMockNudgeState({
      dismissed: ['feature-1'],
      snoozed: { 'feature-2': '2024-01-20T00:00:00.000Z' },
    })
    const updated = markNudgeShown(state)

    expect(updated.dismissed).toEqual(['feature-1'])
    expect(updated.snoozed).toEqual({ 'feature-2': '2024-01-20T00:00:00.000Z' })
  })

  it('returns a new object (immutable)', () => {
    const state = createMockNudgeState()
    const updated = markNudgeShown(state)

    expect(updated).not.toBe(state)
  })
})

describe('dismissNudge', () => {
  it('adds featureId to dismissed array', () => {
    const state = createMockNudgeState()
    const updated = dismissNudge(state, 'feature-1')

    expect(updated.dismissed).toContain('feature-1')
  })

  it('preserves existing dismissed features', () => {
    const state = createMockNudgeState({ dismissed: ['feature-1'] })
    const updated = dismissNudge(state, 'feature-2')

    expect(updated.dismissed).toEqual(['feature-1', 'feature-2'])
  })

  it('preserves other state properties', () => {
    const state = createMockNudgeState({
      sessionCount: 5,
      lastShown: '2024-01-15T10:00:00.000Z',
    })
    const updated = dismissNudge(state, 'feature-1')

    expect(updated.sessionCount).toBe(5)
    expect(updated.lastShown).toBe('2024-01-15T10:00:00.000Z')
  })

  it('returns a new object (immutable)', () => {
    const state = createMockNudgeState()
    const updated = dismissNudge(state, 'feature-1')

    expect(updated).not.toBe(state)
    expect(updated.dismissed).not.toBe(state.dismissed)
  })
})

describe('snoozeNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds snooze expiry for feature', () => {
    const state = createMockNudgeState()
    const oneHour = 60 * 60 * 1000
    const updated = snoozeNudge(state, 'feature-1', oneHour)

    expect(updated.snoozed['feature-1']).toBe('2024-01-15T11:00:00.000Z')
  })

  it('updates existing snooze expiry', () => {
    const state = createMockNudgeState({
      snoozed: { 'feature-1': '2024-01-15T09:00:00.000Z' },
    })
    const twoHours = 2 * 60 * 60 * 1000
    const updated = snoozeNudge(state, 'feature-1', twoHours)

    expect(updated.snoozed['feature-1']).toBe('2024-01-15T12:00:00.000Z')
  })

  it('preserves other snoozed features', () => {
    const state = createMockNudgeState({
      snoozed: { 'feature-1': '2024-01-15T12:00:00.000Z' },
    })
    const oneDay = 24 * 60 * 60 * 1000
    const updated = snoozeNudge(state, 'feature-2', oneDay)

    expect(updated.snoozed['feature-1']).toBe('2024-01-15T12:00:00.000Z')
    expect(updated.snoozed['feature-2']).toBe('2024-01-16T10:00:00.000Z')
  })

  it('preserves other state properties', () => {
    const state = createMockNudgeState({
      sessionCount: 3,
      dismissed: ['feature-a'],
    })
    const updated = snoozeNudge(state, 'feature-1', 1000)

    expect(updated.sessionCount).toBe(3)
    expect(updated.dismissed).toEqual(['feature-a'])
  })

  it('returns a new object (immutable)', () => {
    const state = createMockNudgeState()
    const updated = snoozeNudge(state, 'feature-1', 1000)

    expect(updated).not.toBe(state)
    expect(updated.snoozed).not.toBe(state.snoozed)
  })
})
