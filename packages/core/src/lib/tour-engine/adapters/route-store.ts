/**
 * v2 §1.3b — `use-route-persistence.ts` as a plain factory.
 *
 * The hook's `externalVersion` counter was React plumbing: a number that only
 * existed so a `useEffect` dep could notice a cross-tab write. The factory
 * exposes the subscription itself and the hook turns it back into a counter.
 */
import type { Storage as StorageAdapter, TourState } from '../../../types'
import type { MultiPagePersistenceConfig } from '../../../types/router'
import { logger } from '../../../utils/logger'
import { createMemoryStorage } from '../../../utils/storage'

export interface PersistedRouteState {
  tourId: string | null
  stepIndex: number
  completedTours: string[]
  skippedTours: string[]
  timestamp: number
}

const DEFAULT_KEY = 'tourkit-route-state'
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

// Single module-scope memory store, used as SSR / `storage: 'memory'` fallback.
const memoryStorage = createMemoryStorage()

export interface RouteStore {
  save: (state: Partial<TourState>) => void
  load: () => PersistedRouteState | null
  clear: () => void
  isStale: () => boolean
  /**
   * Fires when another tab writes our storage key. Returns an unsubscribe.
   * No-op unless `syncTabs` is on and the backend is `localStorage`.
   */
  subscribeStorage: (cb: () => void) => () => void
}

export function createRouteStore(
  config: MultiPagePersistenceConfig,
  storage?: StorageAdapter
): RouteStore {
  const storageKey = config.key ?? DEFAULT_KEY
  const expiryMs = config.expiryMs ?? DEFAULT_EXPIRY_MS

  const getStorage = (): StorageAdapter => {
    if (storage) return storage
    if (typeof window === 'undefined') return memoryStorage

    switch (config.storage) {
      case 'sessionStorage':
        return window.sessionStorage
      case 'memory':
        return memoryStorage
      default:
        return window.localStorage
    }
  }

  const load = (): PersistedRouteState | null => {
    if (!config.enabled) return null

    const store = getStorage()
    try {
      // These stores are synchronous by construction — `load()` is called
      // from a render path and from `boot()`'s precedence resolver, neither of
      // which can await. The package's `Storage` type permits a Promise-
      // returning `getItem` for async backends; such a backend is not usable
      // here and would land as an unparseable value. Same narrowing as
      // `flow-session-store.ts`. A real async backend needs an async load
      // path, which is a §1.4 question, not a cast.
      const raw = store.getItem(storageKey) as string | null
      if (!raw) return null

      const data: PersistedRouteState = JSON.parse(raw)

      // Remove rather than merely ignore: dead bytes nobody clears mean every
      // later mount re-parses and re-rejects them.
      if (Date.now() - data.timestamp > expiryMs) {
        store.removeItem(storageKey)
        return null
      }

      return data
    } catch (e) {
      logger.warn('Failed to load route state:', e)
      return null
    }
  }

  return {
    load,

    save: (state) => {
      if (!config.enabled) return

      const data: PersistedRouteState = {
        tourId: state.tourId ?? null,
        stepIndex: state.currentStepIndex ?? 0,
        completedTours: state.completedTours ?? [],
        skippedTours: state.skippedTours ?? [],
        timestamp: Date.now(),
      }

      try {
        // Browsers fire `storage` on *other* tabs automatically; no manual
        // dispatch is needed, and one on the writing tab syncs nothing.
        getStorage().setItem(storageKey, JSON.stringify(data))
      } catch (e) {
        logger.warn('Failed to save route state:', e)
      }
    },

    // Deliberately not gated on `enabled` — teardown must always be able to
    // clean up state a previously-enabled config wrote.
    clear: () => {
      getStorage().removeItem(storageKey)
    },

    isStale: () => {
      const data = load()
      if (!data) return true
      return Date.now() - data.timestamp > expiryMs
    },

    subscribeStorage: (cb) => {
      if (!config.syncTabs || config.storage !== 'localStorage') return () => {}
      if (typeof window === 'undefined') return () => {}

      const handler = (e: StorageEvent) => {
        if (e.key === storageKey) cb()
      }

      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}
