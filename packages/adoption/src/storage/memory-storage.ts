import type { PersistedState, StorageAdapter } from '../types'

export function createMemoryStorageAdapter(): StorageAdapter {
  let state: PersistedState | null = null

  return {
    load(): PersistedState | null {
      return state
    },

    save(newState: PersistedState): void {
      state = { ...newState, updatedAt: new Date().toISOString() }
    },

    clear(): void {
      state = null
    },
  }
}
