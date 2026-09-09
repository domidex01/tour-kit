/**
 * v3 Phase 2 — checklist persistence, moved out of
 * `hooks/use-checklist-persistence.ts`. The hook is now a binding over these
 * three functions; nothing here touches React.
 */
import { createMemoryStorage, logger } from '@tour-kit/core/engine'
import type { ChecklistPersistenceConfig, PersistedChecklistState } from './types'

export const DEFAULT_KEY = 'tourkit-checklists'

/** The synchronous slice of the DOM `Storage` shape this package uses. */
export interface ChecklistsStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

// Single module-scope memory store, used as SSR / `storage: 'memory'` fallback.
const memoryStorage = createMemoryStorage()

/** Resolve the storage adapter. `null` outside a browser — SSR writes nothing. */
export function resolveStorage(
  kind: ChecklistPersistenceConfig['storage']
): ChecklistsStorage | null {
  if (typeof window === 'undefined') return null

  switch (kind) {
    case 'sessionStorage':
      return window.sessionStorage
    case 'memory':
      return memoryStorage
    default:
      return window.localStorage
  }
}

export function saveState(
  config: ChecklistPersistenceConfig,
  state: PersistedChecklistState
): void {
  if (!config.enabled) return

  // Custom handler
  if (config.onSave) {
    config.onSave(state)
    return
  }

  const storage = resolveStorage(config.storage)
  if (!storage) return

  try {
    storage.setItem(config.key ?? DEFAULT_KEY, JSON.stringify(state))
  } catch (e) {
    logger.warn('Checklists: Failed to save state:', e)
  }
}

export function loadState(
  config: ChecklistPersistenceConfig
): PersistedChecklistState | Promise<PersistedChecklistState | null> | null {
  if (!config.enabled) return null

  // Custom handler — pass through both sync and async results
  if (config.onLoad) {
    return config.onLoad()
  }

  const storage = resolveStorage(config.storage)
  if (!storage) return null

  try {
    const raw = storage.getItem(config.key ?? DEFAULT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    logger.warn('Checklists: Failed to load state:', e)
    return null
  }
}

export function clearState(config: ChecklistPersistenceConfig): void {
  const storage = resolveStorage(config.storage)
  if (storage) {
    storage.removeItem(config.key ?? DEFAULT_KEY)
  }
}

/** Turn the engine's live Sets into the JSON-safe persisted shape. */
export function freezeState(state: {
  completed: Record<string, Set<string>>
  dismissed: Set<string>
  completedAt: Record<string, Record<string, number>>
  notifiedComplete: Set<string>
}): PersistedChecklistState {
  return {
    completed: Object.fromEntries(
      Object.entries(state.completed).map(([k, v]) => [k, Array.from(v)])
    ),
    dismissed: Array.from(state.dismissed),
    timestamp: Date.now(),
    completedAt: state.completedAt,
    notifiedComplete: Array.from(state.notifiedComplete),
  }
}
