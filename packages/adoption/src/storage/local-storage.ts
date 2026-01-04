import type { PersistedState, StorageAdapter } from '../types'

const CURRENT_VERSION = 1

export function createLocalStorageAdapter(key: string): StorageAdapter {
  return {
    load(): PersistedState | null {
      if (typeof window === 'undefined') return null

      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null

        const state: PersistedState = JSON.parse(raw)

        // Migration if needed
        if (state.version !== CURRENT_VERSION) {
          // Handle migrations here
          state.version = CURRENT_VERSION
        }

        // Reset session count on new session
        state.nudges.sessionCount = 0

        return state
      } catch (e) {
        console.warn('[TourKit/Adoption] Failed to load state:', e)
        return null
      }
    },

    save(state: PersistedState): void {
      if (typeof window === 'undefined') return

      try {
        state.updatedAt = new Date().toISOString()
        localStorage.setItem(key, JSON.stringify(state))
      } catch (e) {
        console.warn('[TourKit/Adoption] Failed to save state:', e)
      }
    },

    clear(): void {
      if (typeof window === 'undefined') return
      localStorage.removeItem(key)
    },
  }
}

export function createSessionStorageAdapter(key: string): StorageAdapter {
  return {
    load(): PersistedState | null {
      if (typeof window === 'undefined') return null

      try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
      } catch {
        return null
      }
    },

    save(state: PersistedState): void {
      if (typeof window === 'undefined') return

      try {
        state.updatedAt = new Date().toISOString()
        sessionStorage.setItem(key, JSON.stringify(state))
      } catch (e) {
        console.warn('[TourKit/Adoption] Failed to save state:', e)
      }
    },

    clear(): void {
      if (typeof window === 'undefined') return
      sessionStorage.removeItem(key)
    },
  }
}
