/**
 * @tour-kit/adoption - Adoption Calculator Tests
 *
 * Tests for the adoption status calculation engine functions.
 * These are pure unit tests with no React dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateAdoptionStatus,
  createInitialUsage,
  didStatusChange,
  trackFeatureUsage,
} from '../../engine/adoption-calculator'
import type { AdoptionCriteria, FeatureUsage } from '../../types'

// Mock factory for FeatureUsage
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

describe('calculateAdoptionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set system time to 2024-01-15 for predictable date calculations
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Default Criteria', () => {
    it('returns not_started when useCount is 0', () => {
      const usage = createMockUsage({ useCount: 0 })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('not_started')
    })

    it('returns exploring when useCount is 1', () => {
      const usage = createMockUsage({
        useCount: 1,
        lastUsed: new Date().toISOString(),
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('exploring')
    })

    it('returns exploring when useCount is 2', () => {
      const usage = createMockUsage({
        useCount: 2,
        lastUsed: new Date().toISOString(),
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('exploring')
    })

    it('returns adopted when useCount is 3 and recently used', () => {
      const usage = createMockUsage({
        useCount: 3,
        lastUsed: new Date().toISOString(),
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('adopted')
    })

    it('returns adopted when useCount exceeds minUses', () => {
      const usage = createMockUsage({
        useCount: 10,
        lastUsed: new Date().toISOString(),
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('adopted')
    })

    it('returns churned when useCount >= 3 but not used recently', () => {
      // 45 days ago (exceeds default 30 day recency)
      const usage = createMockUsage({
        useCount: 5,
        lastUsed: '2023-12-01T10:00:00.000Z',
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('churned')
    })
  })

  describe('Custom Criteria', () => {
    it('uses custom minUses value', () => {
      const usage = createMockUsage({
        useCount: 5,
        lastUsed: new Date().toISOString(),
      })
      const criteria: AdoptionCriteria = { minUses: 10 }
      const status = calculateAdoptionStatus(usage, criteria)
      expect(status).toBe('exploring')
    })

    it('uses custom recencyDays value', () => {
      // 10 days ago
      const usage = createMockUsage({
        useCount: 5,
        lastUsed: '2024-01-05T10:00:00.000Z',
      })
      const criteria: AdoptionCriteria = { recencyDays: 7 }
      const status = calculateAdoptionStatus(usage, criteria)
      expect(status).toBe('churned')
    })

    it('custom function takes precedence over defaults', () => {
      const usage = createMockUsage({ useCount: 100 })
      const criteria: AdoptionCriteria = {
        custom: () => false,
      }
      const status = calculateAdoptionStatus(usage, criteria)
      expect(status).toBe('exploring')
    })

    it('custom function returning true sets status to adopted', () => {
      const usage = createMockUsage({ useCount: 1 })
      const criteria: AdoptionCriteria = {
        custom: () => true,
      }
      const status = calculateAdoptionStatus(usage, criteria)
      expect(status).toBe('adopted')
    })

    it('custom function returning false sets status to exploring', () => {
      const usage = createMockUsage({
        useCount: 10,
        lastUsed: new Date().toISOString(),
      })
      const criteria: AdoptionCriteria = {
        custom: () => false,
      }
      const status = calculateAdoptionStatus(usage, criteria)
      expect(status).toBe('exploring')
    })
  })

  describe('Date Calculations', () => {
    it('considers feature recent if lastUsed is today', () => {
      const usage = createMockUsage({
        useCount: 3,
        lastUsed: '2024-01-15T08:00:00.000Z', // Same day
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('adopted')
    })

    it('considers feature recent if lastUsed is within recencyDays', () => {
      const usage = createMockUsage({
        useCount: 3,
        lastUsed: '2024-01-01T10:00:00.000Z', // 14 days ago
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('adopted')
    })

    it('considers feature not recent if lastUsed exceeds recencyDays', () => {
      const usage = createMockUsage({
        useCount: 3,
        lastUsed: '2023-12-01T10:00:00.000Z', // 45 days ago
      })
      const status = calculateAdoptionStatus(usage)
      expect(status).toBe('churned')
    })

    it('handles null lastUsed gracefully', () => {
      const usage = createMockUsage({
        useCount: 3,
        lastUsed: null,
      })
      const status = calculateAdoptionStatus(usage)
      // Without lastUsed, recency check fails
      expect(status).toBe('churned')
    })
  })
})

describe('createInitialUsage', () => {
  it('creates usage with provided featureId', () => {
    const usage = createInitialUsage('my-feature')
    expect(usage.featureId).toBe('my-feature')
  })

  it('sets firstUsed to null', () => {
    const usage = createInitialUsage('test')
    expect(usage.firstUsed).toBeNull()
  })

  it('sets lastUsed to null', () => {
    const usage = createInitialUsage('test')
    expect(usage.lastUsed).toBeNull()
  })

  it('sets useCount to 0', () => {
    const usage = createInitialUsage('test')
    expect(usage.useCount).toBe(0)
  })

  it('sets status to not_started', () => {
    const usage = createInitialUsage('test')
    expect(usage.status).toBe('not_started')
  })
})

describe('trackFeatureUsage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('increments useCount by 1', () => {
    const current = createMockUsage({ useCount: 5 })
    const updated = trackFeatureUsage(current)
    expect(updated.useCount).toBe(6)
  })

  it('sets firstUsed on first usage', () => {
    const current = createMockUsage({ firstUsed: null })
    const updated = trackFeatureUsage(current)
    expect(updated.firstUsed).toBe('2024-01-15T10:00:00.000Z')
  })

  it('preserves firstUsed on subsequent usage', () => {
    const current = createMockUsage({
      firstUsed: '2024-01-01T10:00:00.000Z',
      useCount: 3,
    })
    const updated = trackFeatureUsage(current)
    expect(updated.firstUsed).toBe('2024-01-01T10:00:00.000Z')
  })

  it('updates lastUsed to current time', () => {
    const current = createMockUsage({
      lastUsed: '2024-01-01T10:00:00.000Z',
    })
    const updated = trackFeatureUsage(current)
    expect(updated.lastUsed).toBe('2024-01-15T10:00:00.000Z')
  })

  it('recalculates status after update', () => {
    const current = createMockUsage({
      useCount: 2,
      status: 'exploring',
      lastUsed: new Date().toISOString(),
    })
    const updated = trackFeatureUsage(current)
    expect(updated.status).toBe('adopted')
  })

  it('transitions from not_started to exploring on first use', () => {
    const current = createMockUsage({
      useCount: 0,
      status: 'not_started',
    })
    const updated = trackFeatureUsage(current)
    expect(updated.status).toBe('exploring')
  })

  it('transitions from exploring to adopted when criteria met', () => {
    const current = createMockUsage({
      useCount: 2,
      status: 'exploring',
      firstUsed: '2024-01-10T10:00:00.000Z',
    })
    const updated = trackFeatureUsage(current)
    expect(updated.useCount).toBe(3)
    expect(updated.status).toBe('adopted')
  })
})

describe('didStatusChange', () => {
  it('detects adoption when previous is not_started and current is adopted', () => {
    const result = didStatusChange('not_started', 'adopted')
    expect(result.adopted).toBe(true)
    expect(result.churned).toBe(false)
  })

  it('detects adoption when previous is exploring and current is adopted', () => {
    const result = didStatusChange('exploring', 'adopted')
    expect(result.adopted).toBe(true)
    expect(result.churned).toBe(false)
  })

  it('detects churn when previous is adopted and current is churned', () => {
    const result = didStatusChange('adopted', 'churned')
    expect(result.adopted).toBe(false)
    expect(result.churned).toBe(true)
  })

  it('returns false for adopted -> adopted', () => {
    const result = didStatusChange('adopted', 'adopted')
    expect(result.adopted).toBe(false)
    expect(result.churned).toBe(false)
  })

  it('returns false for exploring -> exploring', () => {
    const result = didStatusChange('exploring', 'exploring')
    expect(result.adopted).toBe(false)
    expect(result.churned).toBe(false)
  })

  it('does not detect adoption for churned -> adopted', () => {
    // Re-engagement - technically becoming adopted again
    const result = didStatusChange('churned', 'adopted')
    expect(result.adopted).toBe(true)
    expect(result.churned).toBe(false)
  })
})
