import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_KEY,
  clearState,
  freezeState,
  loadState,
  resolveStorage,
  saveState,
} from '../persistence'
import type { ChecklistPersistenceConfig, PersistedChecklistState } from '../types'

const blob: PersistedChecklistState = {
  completed: { c1: ['t1'] },
  dismissed: ['c2'],
  timestamp: 7,
  completedAt: { c1: { t1: 11 } },
  notifiedComplete: ['c1'],
}

/**
 * The only "fake" this phase needs: the config's own custom-handler seam.
 * `ChecklistPersistenceConfig` takes a storage *kind* string, never a `Storage`
 * object, so there is nothing to inject.
 */
function captureStorage() {
  let stored: PersistedChecklistState | null = null
  return {
    config: (extra: Partial<ChecklistPersistenceConfig> = {}): ChecklistPersistenceConfig => ({
      enabled: true,
      onSave: (s) => {
        stored = s
      },
      onLoad: () => stored,
      ...extra,
    }),
    read: () => stored,
    seed: (s: PersistedChecklistState) => {
      stored = s
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('saveState / loadState round-trip', () => {
  it('round-trips through the custom handlers', () => {
    const cap = captureStorage()
    saveState(cap.config(), blob)
    expect(cap.read()).toEqual(blob)
    expect(loadState(cap.config())).toEqual(blob)
  })

  it('round-trips through real localStorage under the default key', () => {
    const config: ChecklistPersistenceConfig = { enabled: true }
    saveState(config, blob)
    expect(window.localStorage.getItem(DEFAULT_KEY)).toContain('"t1"')
    expect(loadState(config)).toEqual(blob)
  })

  it('honours a custom key', () => {
    const config: ChecklistPersistenceConfig = { enabled: true, key: 'my-key' }
    saveState(config, blob)
    expect(window.localStorage.getItem('my-key')).not.toBeNull()
    expect(window.localStorage.getItem(DEFAULT_KEY)).toBeNull()
  })

  it('writes nothing and loads null when disabled', () => {
    const cap = captureStorage()
    saveState(cap.config({ enabled: false }), blob)
    expect(cap.read()).toBeNull()
    expect(loadState({ enabled: false })).toBeNull()
    expect(window.localStorage.getItem(DEFAULT_KEY)).toBeNull()
  })

  it('passes a Promise from onLoad straight through', async () => {
    const config: ChecklistPersistenceConfig = {
      enabled: true,
      onLoad: () => Promise.resolve(blob),
    }
    const result = loadState(config)
    expect(result).toBeInstanceOf(Promise)
    await expect(result as Promise<PersistedChecklistState | null>).resolves.toEqual(blob)
  })

  it('returns null when nothing has been stored', () => {
    expect(loadState({ enabled: true })).toBeNull()
  })
})

describe('failures are swallowed, never thrown at the consumer', () => {
  it('malformed JSON loads as null', () => {
    window.localStorage.setItem(DEFAULT_KEY, '{not json')
    expect(loadState({ enabled: true })).toBeNull()
  })

  it('a throwing setItem (quota) does not propagate', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveState({ enabled: true }, blob)).not.toThrow()
  })
})

describe('resolveStorage', () => {
  it('returns null with no window — SSR writes nothing', () => {
    vi.stubGlobal('window', undefined)
    expect(resolveStorage(undefined)).toBeNull()
    expect(saveState({ enabled: true }, blob)).toBeUndefined()
    expect(loadState({ enabled: true })).toBeNull()
  })

  it('selects localStorage by default and sessionStorage on request', () => {
    expect(resolveStorage(undefined)).toBe(window.localStorage)
    expect(resolveStorage('localStorage')).toBe(window.localStorage)
    expect(resolveStorage('sessionStorage')).toBe(window.sessionStorage)
  })

  it("the 'memory' arm is a module singleton, so give it its own key", () => {
    const config: ChecklistPersistenceConfig = {
      enabled: true,
      storage: 'memory',
      key: 'memory-arm-test',
    }
    saveState(config, blob)
    // it did NOT reach the DOM storages
    expect(window.localStorage.getItem('memory-arm-test')).toBeNull()
    expect(window.sessionStorage.getItem('memory-arm-test')).toBeNull()
    expect(loadState(config)).toEqual(blob)

    clearState(config)
    expect(loadState(config)).toBeNull()
  })
})

describe('clearState', () => {
  it('removes the stored blob', () => {
    const config: ChecklistPersistenceConfig = { enabled: true }
    saveState(config, blob)
    clearState(config)
    expect(window.localStorage.getItem(DEFAULT_KEY)).toBeNull()
  })

  it('is a no-op with no window', () => {
    vi.stubGlobal('window', undefined)
    expect(() => clearState({ enabled: true })).not.toThrow()
  })
})

describe('freezeState', () => {
  it('turns the live Sets into arrays and stamps a timestamp', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1234)
    const frozen = freezeState({
      completed: { c1: new Set(['t1', 't2']) },
      dismissed: new Set(['c2']),
      completedAt: { c1: { t1: 5 } },
      notifiedComplete: new Set(['c1']),
    })
    expect(frozen).toEqual({
      completed: { c1: ['t1', 't2'] },
      dismissed: ['c2'],
      timestamp: 1234,
      completedAt: { c1: { t1: 5 } },
      notifiedComplete: ['c1'],
    })
    expect(now).toHaveBeenCalled()
    // JSON-safe: no Set survives
    expect(() => JSON.stringify(frozen)).not.toThrow()
  })

  it('survives an empty state', () => {
    const frozen = freezeState({
      completed: {},
      dismissed: new Set(),
      completedAt: {},
      notifiedComplete: new Set(),
    })
    expect(frozen.completed).toEqual({})
    expect(frozen.dismissed).toEqual([])
  })
})
