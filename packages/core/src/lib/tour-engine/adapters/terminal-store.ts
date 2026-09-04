/**
 * v2 §1.3b — `use-persistence.ts` as a plain factory.
 *
 * All of the hook's state already lived in storage; the nine `useCallback`s
 * over a prefixed adapter were the only React in it. `boot()` reads this store
 * for the completed/skipped lists, so the engine cannot start without it.
 */
import type { PersistenceConfig, Storage as StorageAdapter } from '../../../types'
import { defaultPersistenceConfig } from '../../../types/config'
import { createPrefixedStorage, createStorageAdapter, safeJSONParse } from '../../../utils/storage'

export interface TerminalStore {
  getCompletedTours: () => string[]
  getSkippedTours: () => string[]
  getDontShowAgain: (tourId: string) => boolean
  getLastStep: (tourId: string) => number | null
  markCompleted: (tourId: string) => void
  markSkipped: (tourId: string) => void
  setDontShowAgain: (tourId: string, value: boolean) => void
  saveStep: (tourId: string, stepIndex: number) => void
  reset: (tourId?: string) => void
}

/**
 * @param config - Same `PersistenceConfig` the hook takes.
 * @param storage - Explicit backend, overriding `config.storage`. Injected by
 *   tests (`createMemoryStorage()`) and by `createTourEngine({ storage })`.
 */
export function createTerminalStore(
  config?: PersistenceConfig,
  storage?: StorageAdapter
): TerminalStore {
  const merged = { ...defaultPersistenceConfig, ...config }
  const adapter = storage ?? createStorageAdapter(merged.storage)
  const store = createPrefixedStorage(adapter, merged.keyPrefix ?? 'tourkit')

  // The repo's `Storage` adapter type permits an async `getItem`; the terminal
  // store is synchronous by contract, so narrow once here rather than at every
  // read (same cast the hook this replaces used).
  const read = (key: string) => store.getItem(key) as string | null

  const getCompletedTours = () => safeJSONParse<string[]>(read('completed'), [])
  const getSkippedTours = () => safeJSONParse<string[]>(read('skipped'), [])

  return {
    getCompletedTours,
    getSkippedTours,

    getDontShowAgain: (tourId) => read(`dontShow:${tourId}`) === 'true',

    getLastStep: (tourId) => {
      const data = read(`step:${tourId}`)
      return data ? Number.parseInt(data, 10) : null
    },

    markCompleted: (tourId) => {
      const completed = getCompletedTours()
      if (completed.includes(tourId)) return
      completed.push(tourId)
      store.setItem('completed', JSON.stringify(completed))
    },

    markSkipped: (tourId) => {
      const skipped = getSkippedTours()
      if (skipped.includes(tourId)) return
      skipped.push(tourId)
      store.setItem('skipped', JSON.stringify(skipped))
    },

    setDontShowAgain: (tourId, value) => {
      if (value) {
        store.setItem(`dontShow:${tourId}`, 'true')
      } else {
        store.removeItem(`dontShow:${tourId}`)
      }
    },

    saveStep: (tourId, stepIndex) => {
      store.setItem(`step:${tourId}`, String(stepIndex))
    },

    reset: (tourId) => {
      if (tourId) {
        store.removeItem(`step:${tourId}`)
        store.removeItem(`dontShow:${tourId}`)
        store.setItem(
          'completed',
          JSON.stringify(getCompletedTours().filter((id) => id !== tourId))
        )
        store.setItem('skipped', JSON.stringify(getSkippedTours().filter((id) => id !== tourId)))
      } else {
        // Only the two list keys. Widening this to a prefix sweep would drop
        // per-tour `step:`/`dontShow:` state the hook has always kept.
        store.removeItem('completed')
        store.removeItem('skipped')
      }
    },
  }
}
