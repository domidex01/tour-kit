'use client'

import { useCallback } from 'react'
import { clearState, loadState, saveState } from '../lib/checklists-engine/persistence'
import type { ChecklistPersistenceConfig, PersistedChecklistState } from '../types'

export interface UseChecklistPersistenceReturn {
  save: (state: PersistedChecklistState) => void
  load: () => PersistedChecklistState | Promise<PersistedChecklistState | null> | null
  clear: () => void
}

/**
 * Hook for checklist state persistence.
 *
 * v3 Phase 2 — a binding over `lib/checklists-engine/persistence`. The storage
 * resolution, the JSON handling and the custom-handler seams all live there so
 * a non-React caller gets the same behaviour.
 */
export function useChecklistPersistence(
  config: ChecklistPersistenceConfig
): UseChecklistPersistenceReturn {
  const save = useCallback((state: PersistedChecklistState) => saveState(config, state), [config])
  const load = useCallback(() => loadState(config), [config])
  const clear = useCallback(() => clearState(config), [config])

  return { save, load, clear }
}
