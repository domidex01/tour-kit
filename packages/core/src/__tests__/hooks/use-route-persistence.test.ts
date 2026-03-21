import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoutePersistence } from '../../hooks/use-route-persistence'
import type { MultiPagePersistenceConfig } from '../../types/router'
import { createEventListenerTracker } from '../utils/cleanup-test-utils'

describe('useRoutePersistence', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key]
    })
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      mockStorage = {}
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultConfig: MultiPagePersistenceConfig = {
    enabled: true,
    storage: 'localStorage',
    key: 'test-tourkit-state',
  }

  describe('save', () => {
    it('saves tour state to storage', () => {
      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      act(() => {
        result.current.save({
          tourId: 'test-tour',
          currentStepIndex: 2,
          completedTours: ['tour-1'],
          skippedTours: [],
        })
      })

      expect(mockStorage['test-tourkit-state']).toBeDefined()
      const saved = JSON.parse(mockStorage['test-tourkit-state'])
      expect(saved.tourId).toBe('test-tour')
      expect(saved.stepIndex).toBe(2)
      expect(saved.completedTours).toEqual(['tour-1'])
    })

    it('does nothing when disabled', () => {
      const { result } = renderHook(() => useRoutePersistence({ ...defaultConfig, enabled: false }))

      act(() => {
        result.current.save({ tourId: 'test-tour' })
      })

      expect(mockStorage['test-tourkit-state']).toBeUndefined()
    })

    it('handles storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      expect(() => {
        act(() => {
          result.current.save({ tourId: 'test-tour' })
        })
      }).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('load', () => {
    it('loads tour state from storage', () => {
      const savedState = {
        tourId: 'test-tour',
        stepIndex: 2,
        completedTours: ['tour-1'],
        skippedTours: [],
        timestamp: Date.now(),
      }
      mockStorage['test-tourkit-state'] = JSON.stringify(savedState)

      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      const loaded = result.current.load()

      expect(loaded).not.toBeNull()
      expect(loaded?.tourId).toBe('test-tour')
      expect(loaded?.stepIndex).toBe(2)
    })

    it('returns null when no state is saved', () => {
      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
    })

    it('returns null when disabled', () => {
      mockStorage['test-tourkit-state'] = JSON.stringify({
        tourId: 'test-tour',
        stepIndex: 0,
        completedTours: [],
        skippedTours: [],
        timestamp: Date.now(),
      })

      const { result } = renderHook(() => useRoutePersistence({ ...defaultConfig, enabled: false }))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
    })

    it('returns null and clears expired state', () => {
      const expiredState = {
        tourId: 'test-tour',
        stepIndex: 0,
        completedTours: [],
        skippedTours: [],
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
      }
      mockStorage['test-tourkit-state'] = JSON.stringify(expiredState)

      const { result } = renderHook(() =>
        useRoutePersistence({ ...defaultConfig, expiryMs: 24 * 60 * 60 * 1000 })
      )

      const loaded = result.current.load()

      expect(loaded).toBeNull()
      expect(mockStorage['test-tourkit-state']).toBeUndefined()
    })

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockStorage['test-tourkit-state'] = 'invalid json'

      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
      consoleSpy.mockRestore()
    })
  })

  describe('clear', () => {
    it('removes state from storage', () => {
      mockStorage['test-tourkit-state'] = JSON.stringify({ tourId: 'test' })

      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      act(() => {
        result.current.clear()
      })

      expect(mockStorage['test-tourkit-state']).toBeUndefined()
    })
  })

  describe('isStale', () => {
    it('returns true when no state exists', () => {
      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      expect(result.current.isStale()).toBe(true)
    })

    it('returns false when state is fresh', () => {
      mockStorage['test-tourkit-state'] = JSON.stringify({
        tourId: 'test',
        stepIndex: 0,
        completedTours: [],
        skippedTours: [],
        timestamp: Date.now(),
      })

      const { result } = renderHook(() => useRoutePersistence(defaultConfig))

      expect(result.current.isStale()).toBe(false)
    })

    it('returns true when state is expired', () => {
      mockStorage['test-tourkit-state'] = JSON.stringify({
        tourId: 'test',
        stepIndex: 0,
        completedTours: [],
        skippedTours: [],
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
      })

      const { result } = renderHook(() =>
        useRoutePersistence({ ...defaultConfig, expiryMs: 24 * 60 * 60 * 1000 })
      )

      expect(result.current.isStale()).toBe(true)
    })
  })

  describe('storage types', () => {
    it('uses sessionStorage when configured', () => {
      const sessionSpy = vi.spyOn(window.sessionStorage, 'setItem')

      const { result } = renderHook(() =>
        useRoutePersistence({ ...defaultConfig, storage: 'sessionStorage' })
      )

      act(() => {
        result.current.save({ tourId: 'test' })
      })

      expect(sessionSpy).toHaveBeenCalled()
    })
  })
})

describe('useRoutePersistence - memory leak prevention', () => {
  let tracker: ReturnType<typeof createEventListenerTracker>

  beforeEach(() => {
    tracker = createEventListenerTracker(window)
  })

  afterEach(() => {
    tracker.cleanup()
  })

  it('cleans up storage event listener on unmount when syncTabs is enabled', () => {
    const config: MultiPagePersistenceConfig = {
      enabled: true,
      storage: 'localStorage',
      syncTabs: true,
    }

    const { unmount } = renderHook(() => useRoutePersistence(config))

    expect(tracker.getListenerCount('storage')).toBe(1)

    unmount()

    tracker.assertNoLeaks()
  })

  it('does not add storage listener when syncTabs is disabled', () => {
    const config: MultiPagePersistenceConfig = {
      enabled: true,
      storage: 'localStorage',
      syncTabs: false,
    }

    const { unmount } = renderHook(() => useRoutePersistence(config))

    expect(tracker.getListenerCount('storage')).toBe(0)

    unmount()
    tracker.assertNoLeaks()
  })

  it('does not add storage listener for sessionStorage', () => {
    const config: MultiPagePersistenceConfig = {
      enabled: true,
      storage: 'sessionStorage',
      syncTabs: true, // Should still not add listener
    }

    const { unmount } = renderHook(() => useRoutePersistence(config))

    expect(tracker.getListenerCount('storage')).toBe(0)

    unmount()
    tracker.assertNoLeaks()
  })

  it('maintains function identity across rerenders', () => {
    const config: MultiPagePersistenceConfig = {
      enabled: true,
      storage: 'localStorage',
    }

    const { result, rerender } = renderHook(() => useRoutePersistence(config))

    const initialSave = result.current.save
    const initialLoad = result.current.load
    const initialClear = result.current.clear
    const initialIsStale = result.current.isStale

    // Rerender multiple times
    for (let i = 0; i < 3; i++) {
      rerender()
      expect(result.current.save).toBe(initialSave)
      expect(result.current.load).toBe(initialLoad)
      expect(result.current.clear).toBe(initialClear)
      expect(result.current.isStale).toBe(initialIsStale)
    }
  })

  it('cleans up properly after multiple save operations', () => {
    const config: MultiPagePersistenceConfig = {
      enabled: true,
      storage: 'localStorage',
      syncTabs: true,
    }

    const { result, unmount } = renderHook(() => useRoutePersistence(config))

    // Perform multiple operations
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.save({ tourId: `tour-${i}`, currentStepIndex: i })
      })
    }

    // Should still only have one storage listener
    expect(tracker.getListenerCount('storage')).toBe(1)

    unmount()
    tracker.assertNoLeaks()
  })
})
