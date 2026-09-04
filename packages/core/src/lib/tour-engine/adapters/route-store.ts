/**
 * v2 §1.3b — `use-route-persistence.ts` as a plain factory.
 *
 * The hook's `externalVersion` counter was React plumbing: a number that only
 * existed so a `useEffect` dep could notice a cross-tab write. The factory
 * exposes the subscription itself and the hook turns it back into a counter.
 */
import type { TourState } from '../../../types'
import type { MultiPagePersistenceConfig } from '../../../types/router'

export interface PersistedRouteState {
  tourId: string | null
  stepIndex: number
  completedTours: string[]
  skippedTours: string[]
  timestamp: number
}

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
  _config: MultiPagePersistenceConfig,
  _storage?: Storage
): RouteStore {
  throw new Error('createRouteStore: not implemented (v2 §1.3b)')
}
