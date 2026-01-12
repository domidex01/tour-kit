import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChecklistPersistence } from '../../hooks/use-checklist-persistence'
import type { ChecklistPersistenceConfig, PersistedChecklistState } from '../../types'

describe('useChecklistPersistence', () => {
  const mockState: PersistedChecklistState = {
    completed: { 'checklist-1': ['task-1', 'task-2'] },
    dismissed: ['checklist-2'],
    timestamp: Date.now(),
  }

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('disabled persistence', () => {
    it('save() does nothing when disabled', () => {
      const config: ChecklistPersistenceConfig = { enabled: false }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('load() returns null when disabled', () => {
      localStorage.setItem('tourkit-checklists', JSON.stringify(mockState))
      const config: ChecklistPersistenceConfig = { enabled: false }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
    })

    it('clear() still works when disabled', () => {
      localStorage.setItem('tourkit-checklists', JSON.stringify(mockState))
      const config: ChecklistPersistenceConfig = { enabled: false }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.clear()

      // clear() works regardless of enabled status
      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })
  })

  describe('localStorage (default)', () => {
    it('saves state to localStorage with default key', () => {
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      const stored = localStorage.getItem('tourkit-checklists')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored ?? '{}')).toEqual(mockState)
    })

    it('loads state from localStorage', () => {
      localStorage.setItem('tourkit-checklists', JSON.stringify(mockState))
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(loaded).toEqual(mockState)
    })

    it('uses custom key prefix', () => {
      const config: ChecklistPersistenceConfig = { enabled: true, key: 'custom-key' }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      expect(localStorage.getItem('custom-key')).not.toBeNull()
      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('handles QuotaExceededError gracefully', () => {
      // Mock localStorage to throw QuotaExceededError
      const originalStorage = window.localStorage
      const setItemMock = vi.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => null),
          setItem: setItemMock,
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
        configurable: true,
      })

      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      expect(() => result.current.save(mockState)).not.toThrow()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save state'),
        expect.any(DOMException)
      )

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalStorage,
        writable: true,
        configurable: true,
      })
    })

    it('handles invalid JSON in storage', () => {
      localStorage.setItem('tourkit-checklists', 'invalid-json{')
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load state'),
        expect.any(SyntaxError)
      )
    })

    it('clear() removes the storage item', () => {
      localStorage.setItem('tourkit-checklists', JSON.stringify(mockState))
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.clear()

      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('load() returns null when no stored state', () => {
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(loaded).toBeNull()
    })
  })

  describe('sessionStorage', () => {
    it('saves to sessionStorage when configured', () => {
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        storage: 'sessionStorage',
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      expect(sessionStorage.getItem('tourkit-checklists')).not.toBeNull()
      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('loads from sessionStorage when configured', () => {
      sessionStorage.setItem('tourkit-checklists', JSON.stringify(mockState))
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        storage: 'sessionStorage',
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(loaded).toEqual(mockState)
    })
  })

  describe('memory storage', () => {
    it('saves to memory storage (SSR-safe)', () => {
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        storage: 'memory',
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      // Memory storage doesn't use localStorage/sessionStorage
      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
      expect(sessionStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('loads from memory storage', () => {
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        storage: 'memory',
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      // Save first
      result.current.save(mockState)

      // Then load
      const loaded = result.current.load()

      expect(loaded).toEqual(mockState)
    })
  })

  describe('custom handlers', () => {
    it('calls custom onSave handler instead of storage', () => {
      const onSave = vi.fn()
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        onSave,
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      result.current.save(mockState)

      expect(onSave).toHaveBeenCalledWith(mockState)
      expect(localStorage.getItem('tourkit-checklists')).toBeNull()
    })

    it('calls custom onLoad handler instead of storage', () => {
      const onLoad = vi.fn().mockReturnValue(mockState)
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        onLoad,
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(onLoad).toHaveBeenCalled()
      expect(loaded).toEqual(mockState)
    })

    it('returns null for async onLoad (sync only)', () => {
      const onLoad = vi.fn().mockReturnValue(Promise.resolve(mockState))
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        onLoad,
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(onLoad).toHaveBeenCalled()
      expect(loaded).toBeNull()
    })

    it('custom onLoad can return null', () => {
      const onLoad = vi.fn().mockReturnValue(null)
      const config: ChecklistPersistenceConfig = {
        enabled: true,
        onLoad,
      }
      const { result } = renderHook(() => useChecklistPersistence(config))

      const loaded = result.current.load()

      expect(onLoad).toHaveBeenCalled()
      expect(loaded).toBeNull()
    })
  })

  describe('function stability', () => {
    it('save function maintains identity across rerenders', () => {
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result, rerender } = renderHook(() => useChecklistPersistence(config))

      const saveFn1 = result.current.save
      rerender()
      const saveFn2 = result.current.save

      expect(saveFn1).toBe(saveFn2)
    })

    it('load function maintains identity across rerenders', () => {
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result, rerender } = renderHook(() => useChecklistPersistence(config))

      const loadFn1 = result.current.load
      rerender()
      const loadFn2 = result.current.load

      expect(loadFn1).toBe(loadFn2)
    })

    it('clear function maintains identity across rerenders', () => {
      const config: ChecklistPersistenceConfig = { enabled: true }
      const { result, rerender } = renderHook(() => useChecklistPersistence(config))

      const clearFn1 = result.current.clear
      rerender()
      const clearFn2 = result.current.clear

      expect(clearFn1).toBe(clearFn2)
    })
  })
})
