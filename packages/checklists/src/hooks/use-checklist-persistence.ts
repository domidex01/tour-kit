'use client'

import { logger } from '@tour-kit/core'
import { useCallback } from 'react'
import type { ChecklistPersistenceConfig, PersistedChecklistState } from '../types'

const DEFAULT_KEY = 'tourkit-checklists'

export interface UseChecklistPersistenceReturn {
  save: (state: PersistedChecklistState) => void
  load: () => PersistedChecklistState | Promise<PersistedChecklistState | null> | null
  clear: () => void
}

// Simple in-memory storage for SSR
const memoryStorage: Storage = {
  _data: {} as Record<string, string>,
  getItem(key: string) {
    return (this as unknown as { _data: Record<string, string> })._data[key] ?? null
  },
  setItem(key: string, value: string) {
    ;(this as unknown as { _data: Record<string, string> })._data[key] = value
  },
  removeItem(key: string) {
    delete (this as unknown as { _data: Record<string, string> })._data[key]
  },
  clear() {
    ;(this as unknown as { _data: Record<string, string> })._data = {}
  },
  get length() {
    return Object.keys((this as unknown as { _data: Record<string, string> })._data).length
  },
  key(index: number) {
    return Object.keys((this as unknown as { _data: Record<string, string> })._data)[index] ?? null
  },
}

/**
 * Hook for checklist state persistence
 */
export function useChecklistPersistence(
  config: ChecklistPersistenceConfig
): UseChecklistPersistenceReturn {
  const storageKey = config.key ?? DEFAULT_KEY

  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null

    switch (config.storage) {
      case 'sessionStorage':
        return window.sessionStorage
      case 'memory':
        return memoryStorage
      default:
        return window.localStorage
    }
  }, [config.storage])

  const save = useCallback(
    (state: PersistedChecklistState) => {
      if (!config.enabled) return

      // Custom handler
      if (config.onSave) {
        config.onSave(state)
        return
      }

      const storage = getStorage()
      if (!storage) return

      try {
        storage.setItem(storageKey, JSON.stringify(state))
      } catch (e) {
        logger.warn('Checklists: Failed to save state:', e)
      }
    },
    [config.enabled, config.onSave, getStorage, storageKey]
  )

  const load = useCallback(():
    | PersistedChecklistState
    | Promise<PersistedChecklistState | null>
    | null => {
    if (!config.enabled) return null

    // Custom handler — pass through both sync and async results
    if (config.onLoad) {
      return config.onLoad()
    }

    const storage = getStorage()
    if (!storage) return null

    try {
      const raw = storage.getItem(storageKey)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (e) {
      logger.warn('Checklists: Failed to load state:', e)
      return null
    }
  }, [config.enabled, config.onLoad, getStorage, storageKey])

  const clear = useCallback(() => {
    const storage = getStorage()
    if (storage) {
      storage.removeItem(storageKey)
    }
  }, [getStorage, storageKey])

  return { save, load, clear }
}
