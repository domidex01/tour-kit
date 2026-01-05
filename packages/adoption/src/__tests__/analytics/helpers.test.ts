/**
 * @tour-kit/adoption - Analytics Helpers Tests
 *
 * Tests for the analytics event builder functions that create
 * properly formatted event payloads for tracking.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildFeatureAdoptedEvent,
  buildFeatureChurnedEvent,
  buildFeatureUsedEvent,
  buildNudgeClickedEvent,
  buildNudgeDismissedEvent,
  buildNudgeShownEvent,
} from '../../analytics/helpers'
import type { Feature, FeatureUsage } from '../../types'

// Mock feature factory
function createMockFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'test-feature',
    name: 'Test Feature',
    trigger: '#test-button',
    category: 'core',
    priority: 1,
    description: 'A test feature',
    premium: false,
    ...overrides,
  }
}

// Mock usage factory
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

describe('buildFeatureUsedEvent', () => {
  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'my-feature' })
    const usage = createMockUsage()
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.feature_id).toBe('my-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'My Feature' })
    const usage = createMockUsage()
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.feature_name).toBe('My Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'advanced' })
    const usage = createMockUsage()
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.feature_category).toBe('advanced')
  })

  it('includes use_count', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ useCount: 5 })
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.use_count).toBe(5)
  })

  it('includes status', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ status: 'exploring' })
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.status).toBe('exploring')
  })

  it('includes previous_status', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ status: 'adopted' })
    const event = buildFeatureUsedEvent(feature, usage, 'exploring')

    expect(event.previous_status).toBe('exploring')
  })

  it('includes first_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ firstUsed: '2024-01-01T10:00:00.000Z' })
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.first_used).toBe('2024-01-01T10:00:00.000Z')
  })

  it('includes last_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ lastUsed: '2024-01-15T10:00:00.000Z' })
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.last_used).toBe('2024-01-15T10:00:00.000Z')
  })

  it('includes is_premium defaulting to false', () => {
    const feature = createMockFeature({ premium: undefined })
    const usage = createMockUsage()
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.is_premium).toBe(false)
  })

  it('includes is_premium when true', () => {
    const feature = createMockFeature({ premium: true })
    const usage = createMockUsage()
    const event = buildFeatureUsedEvent(feature, usage, 'not_started')

    expect(event.is_premium).toBe(true)
  })
})

describe('buildFeatureAdoptedEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'adopted-feature' })
    const usage = createMockUsage()
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.feature_id).toBe('adopted-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'Adopted Feature' })
    const usage = createMockUsage()
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.feature_name).toBe('Adopted Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'pro' })
    const usage = createMockUsage()
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.feature_category).toBe('pro')
  })

  it('includes use_count', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ useCount: 10 })
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.use_count).toBe(10)
  })

  it('includes first_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ firstUsed: '2024-01-01T10:00:00.000Z' })
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.first_used).toBe('2024-01-01T10:00:00.000Z')
  })

  it('includes last_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ lastUsed: '2024-01-15T10:00:00.000Z' })
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.last_used).toBe('2024-01-15T10:00:00.000Z')
  })

  it('calculates days_to_adoption', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({
      firstUsed: '2024-01-01T10:00:00.000Z',
      lastUsed: '2024-01-15T10:00:00.000Z',
    })
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.days_to_adoption).toBe(14)
  })

  it('handles null dates for days_to_adoption', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({
      firstUsed: null,
      lastUsed: null,
    })
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.days_to_adoption).toBeNull()
  })

  it('includes is_premium', () => {
    const feature = createMockFeature({ premium: true })
    const usage = createMockUsage()
    const event = buildFeatureAdoptedEvent(feature, usage)

    expect(event.is_premium).toBe(true)
  })
})

describe('buildFeatureChurnedEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'churned-feature' })
    const usage = createMockUsage()
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.feature_id).toBe('churned-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'Churned Feature' })
    const usage = createMockUsage()
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.feature_name).toBe('Churned Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'legacy' })
    const usage = createMockUsage()
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.feature_category).toBe('legacy')
  })

  it('includes use_count', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ useCount: 8 })
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.use_count).toBe(8)
  })

  it('includes last_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ lastUsed: '2023-12-01T10:00:00.000Z' })
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.last_used).toBe('2023-12-01T10:00:00.000Z')
  })

  it('calculates days_since_last_use', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({
      lastUsed: '2023-12-31T10:00:00.000Z', // 15 days before Jan 15
    })
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.days_since_last_use).toBe(15)
  })

  it('handles null last_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ lastUsed: null })
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.days_since_last_use).toBeNull()
  })

  it('includes first_used', () => {
    const feature = createMockFeature()
    const usage = createMockUsage({ firstUsed: '2023-11-01T10:00:00.000Z' })
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.first_used).toBe('2023-11-01T10:00:00.000Z')
  })

  it('includes is_premium', () => {
    const feature = createMockFeature({ premium: true })
    const usage = createMockUsage()
    const event = buildFeatureChurnedEvent(feature, usage)

    expect(event.is_premium).toBe(true)
  })
})

describe('buildNudgeShownEvent', () => {
  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'nudge-feature' })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.feature_id).toBe('nudge-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'Nudge Feature' })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.feature_name).toBe('Nudge Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'new' })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.feature_category).toBe('new')
  })

  it('includes feature_priority', () => {
    const feature = createMockFeature({ priority: 10 })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.feature_priority).toBe(10)
  })

  it('includes default priority of 0', () => {
    const feature = createMockFeature({ priority: undefined })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.feature_priority).toBe(0)
  })

  it('includes session_count', () => {
    const feature = createMockFeature()
    const event = buildNudgeShownEvent(feature, 5)

    expect(event.session_count).toBe(5)
  })

  it('includes reason', () => {
    const feature = createMockFeature()
    const event = buildNudgeShownEvent(feature, 1, 'low_adoption')

    expect(event.reason).toBe('low_adoption')
  })

  it('includes is_premium', () => {
    const feature = createMockFeature({ premium: true })
    const event = buildNudgeShownEvent(feature, 1)

    expect(event.is_premium).toBe(true)
  })
})

describe('buildNudgeClickedEvent', () => {
  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'clicked-feature' })
    const event = buildNudgeClickedEvent(feature)

    expect(event.feature_id).toBe('clicked-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'Clicked Feature' })
    const event = buildNudgeClickedEvent(feature)

    expect(event.feature_name).toBe('Clicked Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'action' })
    const event = buildNudgeClickedEvent(feature)

    expect(event.feature_category).toBe('action')
  })

  it('includes is_premium', () => {
    const feature = createMockFeature({ premium: true })
    const event = buildNudgeClickedEvent(feature)

    expect(event.is_premium).toBe(true)
  })
})

describe('buildNudgeDismissedEvent', () => {
  it('includes feature_id', () => {
    const feature = createMockFeature({ id: 'dismissed-feature' })
    const event = buildNudgeDismissedEvent(feature)

    expect(event.feature_id).toBe('dismissed-feature')
  })

  it('includes feature_name', () => {
    const feature = createMockFeature({ name: 'Dismissed Feature' })
    const event = buildNudgeDismissedEvent(feature)

    expect(event.feature_name).toBe('Dismissed Feature')
  })

  it('includes feature_category', () => {
    const feature = createMockFeature({ category: 'optional' })
    const event = buildNudgeDismissedEvent(feature)

    expect(event.feature_category).toBe('optional')
  })

  it('includes permanent defaulting to true', () => {
    const feature = createMockFeature()
    const event = buildNudgeDismissedEvent(feature)

    expect(event.permanent).toBe(true)
  })

  it('includes permanent when false', () => {
    const feature = createMockFeature()
    const event = buildNudgeDismissedEvent(feature, false)

    expect(event.permanent).toBe(false)
  })

  it('includes is_premium', () => {
    const feature = createMockFeature({ premium: true })
    const event = buildNudgeDismissedEvent(feature)

    expect(event.is_premium).toBe(true)
  })
})
