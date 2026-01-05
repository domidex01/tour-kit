/**
 * @tour-kit/adoption - useFeature Hook Tests
 *
 * Tests for the useFeature hook which provides access to
 * individual feature adoption state and tracking functionality.
 */
import { act, renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdoptionProvider } from '../../context/adoption-provider'
import { useFeature } from '../../hooks/use-feature'
import type { Feature } from '../../types'

// Mock feature factory
function createMockFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'test-feature',
    name: 'Test Feature',
    trigger: '#test-button',
    adoptionCriteria: { minUses: 3, recencyDays: 30 },
    category: 'core',
    priority: 1,
    description: 'A test feature for testing',
    ...overrides,
  }
}

// Provider wrapper factory
function createWrapper(features: Feature[] = [createMockFeature()]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AdoptionProvider
        features={features}
        storage={{ type: 'memory' }}
        nudge={{ enabled: false }}
      >
        {children}
      </AdoptionProvider>
    )
  }
}

describe('useFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Context Requirement', () => {
    it('throws error when used outside AdoptionProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useFeature('test-feature'))
      }).toThrow()

      consoleSpy.mockRestore()
    })

    it('error message mentions AdoptionProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      let error: Error | null = null
      try {
        renderHook(() => useFeature('test-feature'))
      } catch (e) {
        error = e as Error
      }

      expect(error?.message).toContain('AdoptionProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Feature Retrieval', () => {
    it('returns feature definition for valid featureId', () => {
      const feature = createMockFeature({ id: 'my-feature', name: 'My Feature' })
      const wrapper = createWrapper([feature])

      const { result } = renderHook(() => useFeature('my-feature'), { wrapper })

      expect(result.current.feature).not.toBeNull()
      expect(result.current.feature?.id).toBe('my-feature')
      expect(result.current.feature?.name).toBe('My Feature')
    })

    it('returns null feature for unknown featureId', () => {
      const wrapper = createWrapper([createMockFeature({ id: 'known-feature' })])

      const { result } = renderHook(() => useFeature('unknown-feature'), { wrapper })

      expect(result.current.feature).toBeNull()
    })

    it('memoizes feature reference', () => {
      const wrapper = createWrapper()

      const { result, rerender } = renderHook(() => useFeature('test-feature'), { wrapper })

      const firstFeature = result.current.feature
      rerender()
      const secondFeature = result.current.feature

      expect(firstFeature).toBe(secondFeature)
    })
  })

  describe('Usage State', () => {
    it('returns initial usage for new feature', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      expect(result.current.usage.useCount).toBe(0)
      expect(result.current.usage.firstUsed).toBeNull()
      expect(result.current.usage.lastUsed).toBeNull()
      expect(result.current.usage.status).toBe('not_started')
    })

    it('memoizes usage reference when unchanged', () => {
      const wrapper = createWrapper()

      const { result, rerender } = renderHook(() => useFeature('test-feature'), { wrapper })

      const firstUsage = result.current.usage
      rerender()
      const secondUsage = result.current.usage

      expect(firstUsage).toBe(secondUsage)
    })
  })

  describe('Computed Values', () => {
    it('isAdopted is true when status is adopted', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      // Track usage 3 times to reach adopted status
      act(() => {
        result.current.trackUsage()
      })
      act(() => {
        result.current.trackUsage()
      })
      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.isAdopted).toBe(true)
    })

    it('isAdopted is false for other statuses', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      expect(result.current.isAdopted).toBe(false)

      // Track once - should be exploring
      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.isAdopted).toBe(false)
    })

    it('status reflects current usage status', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      expect(result.current.status).toBe('not_started')

      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.status).toBe('exploring')

      act(() => {
        result.current.trackUsage()
      })
      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.status).toBe('adopted')
    })

    it('useCount reflects current usage count', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      expect(result.current.useCount).toBe(0)

      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.useCount).toBe(1)

      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.useCount).toBe(2)
    })
  })

  describe('trackUsage Function', () => {
    it('calls context trackUsage with featureId', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      act(() => {
        result.current.trackUsage()
      })

      expect(result.current.useCount).toBe(1)
    })

    it('maintains stable reference across renders', () => {
      const wrapper = createWrapper()

      const { result, rerender } = renderHook(() => useFeature('test-feature'), { wrapper })

      const firstTrackUsage = result.current.trackUsage
      rerender()
      const secondTrackUsage = result.current.trackUsage

      expect(firstTrackUsage).toBe(secondTrackUsage)
    })

    it('updates usage after call', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(() => useFeature('test-feature'), { wrapper })

      const beforeUsage = result.current.usage

      act(() => {
        result.current.trackUsage()
      })

      const afterUsage = result.current.usage

      expect(afterUsage).not.toBe(beforeUsage)
      expect(afterUsage.useCount).toBe(beforeUsage.useCount + 1)
    })
  })

  describe('Multiple Features', () => {
    it('tracks features independently', () => {
      const features = [
        createMockFeature({ id: 'feature-a', name: 'Feature A' }),
        createMockFeature({ id: 'feature-b', name: 'Feature B' }),
      ]
      const wrapper = createWrapper(features)

      const { result: resultA } = renderHook(() => useFeature('feature-a'), { wrapper })
      const { result: resultB } = renderHook(() => useFeature('feature-b'), { wrapper })

      act(() => {
        resultA.current.trackUsage()
      })

      expect(resultA.current.useCount).toBe(1)
      expect(resultB.current.useCount).toBe(0)
    })
  })
})
