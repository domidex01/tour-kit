import { useMemo } from 'react'
import { type TerminalStore, createTerminalStore } from '../lib/tour-engine/adapters/terminal-store'
import type { PersistenceConfig } from '../types'

/**
 * React wrapper over `createTerminalStore` (v2 §1.3b).
 *
 * The hook never held state of its own — every read and write went straight to
 * a prefixed storage adapter — so the factory is the whole implementation and
 * this is a `useMemo` around it. Signature unchanged.
 */
export type UsePersistenceReturn = TerminalStore

export function usePersistence(config?: PersistenceConfig): UsePersistenceReturn {
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by where the store writes, not by config identity — consumers pass inline object literals
  return useMemo(
    () => createTerminalStore(config),
    // The store is keyed by where it writes, not by config identity: consumers
    // routinely pass an inline `{ storage: 'localStorage' }` literal.
    [config?.storage, config?.keyPrefix]
  )
}
