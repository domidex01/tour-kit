/**
 * v2 §1.3b — `use-persistence.ts` as a plain factory.
 *
 * All of the hook's state already lived in storage; the nine `useCallback`s
 * over a prefixed adapter were the only React in it. `boot()` reads this store
 * for the completed/skipped lists, so the engine cannot start without it.
 */
import type { PersistenceConfig } from '../../../types'

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
export function createTerminalStore(_config?: PersistenceConfig, _storage?: Storage): TerminalStore {
  throw new Error('createTerminalStore: not implemented (v2 §1.3b)')
}
