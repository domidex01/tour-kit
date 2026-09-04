import * as React from 'react'
import { type PersistedRouteState, createRouteStore } from '../lib/tour-engine/adapters/route-store'
import type { TourState } from '../types'
import type { MultiPagePersistenceConfig } from '../types/router'

export interface UseRoutePersistenceReturn {
  /** Save current tour state */
  save: (state: Partial<TourState>) => void
  /** Load persisted state */
  load: () => PersistedRouteState | null
  /** Clear persisted state */
  clear: () => void
  /** Check if state is stale */
  isStale: () => boolean
  /**
   * Increments whenever another tab writes to the same storage key while
   * `syncTabs` is enabled. Subscribe to this value from a `useEffect` to
   * re-hydrate state in response to cross-tab writes.
   */
  externalVersion: number
}

/**
 * React wrapper over `createRouteStore` (v2 §1.3b).
 *
 * The factory owns the storage shape; the only thing left here is turning its
 * `subscribeStorage` callback back into the version counter consumers put in
 * effect dep arrays.
 */
export function useRoutePersistence(config: MultiPagePersistenceConfig): UseRoutePersistenceReturn {
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by the fields that decide storage identity — consumers pass inline object literals
  const store = React.useMemo(
    () => createRouteStore(config),
    [config.enabled, config.storage, config.key, config.expiryMs, config.syncTabs]
  )

  const [externalVersion, setExternalVersion] = React.useState(0)

  React.useEffect(() => store.subscribeStorage(() => setExternalVersion((v) => v + 1)), [store])

  return React.useMemo(
    () => ({
      save: store.save,
      load: store.load,
      clear: store.clear,
      isStale: store.isStale,
      externalVersion,
    }),
    [store, externalVersion]
  )
}
