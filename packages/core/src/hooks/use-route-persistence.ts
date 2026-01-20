import * as React from 'react'
import type { TourState } from '../types'
import type { MultiPagePersistenceConfig } from '../types/router'
import { logger } from '../utils/logger'

interface PersistedRouteState {
  tourId: string | null
  stepIndex: number
  completedTours: string[]
  skippedTours: string[]
  timestamp: number
}

const DEFAULT_KEY = 'tourkit-route-state'
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface UseRoutePersistenceReturn {
  /** Save current tour state */
  save: (state: Partial<TourState>) => void
  /** Load persisted state */
  load: () => PersistedRouteState | null
  /** Clear persisted state */
  clear: () => void
  /** Check if state is stale */
  isStale: () => boolean
}

// Simple in-memory storage for SSR or when storage is unavailable
const memoryStorage: Storage = (() => {
  const data: Record<string, string> = {}
  return {
    getItem(key: string) {
      return data[key] ?? null
    },
    setItem(key: string, value: string) {
      data[key] = value
    },
    removeItem(key: string) {
      delete data[key]
    },
    clear() {
      for (const key of Object.keys(data)) {
        delete data[key]
      }
    },
    get length() {
      return Object.keys(data).length
    },
    key(index: number) {
      return Object.keys(data)[index] ?? null
    },
  }
})()

/**
 * Hook for persisting tour state across page navigations.
 * Extends base persistence with route-specific handling.
 *
 * @remarks
 * Uses existing storage utilities from @tour-kit/core.
 * Handles SSR gracefully by checking for window availability.
 */
export function useRoutePersistence(config: MultiPagePersistenceConfig): UseRoutePersistenceReturn {
  const storageKey = config.key ?? DEFAULT_KEY
  const expiryMs = config.expiryMs ?? DEFAULT_EXPIRY_MS

  const getStorage = React.useCallback(() => {
    if (typeof window === 'undefined') return memoryStorage

    switch (config.storage) {
      case 'sessionStorage':
        return window.sessionStorage
      case 'memory':
        return memoryStorage
      default:
        return window.localStorage
    }
  }, [config.storage])

  const save = React.useCallback(
    (state: Partial<TourState>) => {
      if (!config.enabled) return

      const storage = getStorage()

      const data: PersistedRouteState = {
        tourId: state.tourId ?? null,
        stepIndex: state.currentStepIndex ?? 0,
        completedTours: state.completedTours ?? [],
        skippedTours: state.skippedTours ?? [],
        timestamp: Date.now(),
      }

      try {
        storage.setItem(storageKey, JSON.stringify(data))

        // Sync across tabs if enabled (localStorage only)
        if (config.syncTabs && config.storage === 'localStorage' && typeof window !== 'undefined') {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: storageKey,
              newValue: JSON.stringify(data),
            })
          )
        }
      } catch (e) {
        logger.warn('Failed to save route state:', e)
      }
    },
    [config.enabled, config.syncTabs, config.storage, getStorage, storageKey]
  )

  const load = React.useCallback((): PersistedRouteState | null => {
    if (!config.enabled) return null

    const storage = getStorage()

    try {
      const raw = storage.getItem(storageKey)
      if (!raw) return null

      const data: PersistedRouteState = JSON.parse(raw)

      // Check expiry
      if (Date.now() - data.timestamp > expiryMs) {
        storage.removeItem(storageKey)
        return null
      }

      return data
    } catch (e) {
      logger.warn('Failed to load route state:', e)
      return null
    }
  }, [config.enabled, getStorage, storageKey, expiryMs])

  const clear = React.useCallback(() => {
    const storage = getStorage()
    storage.removeItem(storageKey)
  }, [getStorage, storageKey])

  const isStale = React.useCallback(() => {
    const data = load()
    if (!data) return true
    return Date.now() - data.timestamp > expiryMs
  }, [load, expiryMs])

  // Listen for cross-tab sync
  React.useEffect(() => {
    if (!config.syncTabs || config.storage !== 'localStorage') return
    if (typeof window === 'undefined') return

    const handler = (_e: StorageEvent) => {
      // State changed in another tab - consumers can re-load
      // This is intentionally a no-op; consumers should poll or listen themselves
    }

    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [config.syncTabs, config.storage])

  return { save, load, clear, isStale }
}
