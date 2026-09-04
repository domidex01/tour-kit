/**
 * v2 §1.3b — `createRouteStore` against an injected `createMemoryStorage()`.
 *
 * Two behaviours here are load-bearing for boot precedence and easy to lose in
 * the move: an expired blob is *removed*, not merely ignored (otherwise every
 * mount re-reads and re-rejects the same dead bytes), and `subscribeStorage`
 * fires only for our own key.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MultiPagePersistenceConfig } from '../../../../types/router'
import { createMemoryStorage } from '../../../../utils/storage'
import { type RouteStore, createRouteStore } from '../../adapters/route-store'

const KEY = 'tourkit-route-state'
const DAY_MS = 24 * 60 * 60 * 1000

const enabled: MultiPagePersistenceConfig = { enabled: true, storage: 'localStorage' }

let storage: Storage
let store: RouteStore

function stageBlob(overrides: Record<string, unknown> = {}, key = KEY) {
  storage.setItem(
    key,
    JSON.stringify({
      tourId: 't',
      stepIndex: 2,
      completedTours: [],
      skippedTours: [],
      timestamp: Date.now(),
      ...overrides,
    })
  )
}

beforeEach(() => {
  storage = createMemoryStorage()
  store = createRouteStore(enabled, storage)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('save', () => {
  it('writes the tour id, step index and terminal lists under the default key', () => {
    store.save({ tourId: 't', currentStepIndex: 3, completedTours: ['x'], skippedTours: ['y'] })

    const blob = JSON.parse(storage.getItem(KEY) ?? 'null')
    expect(blob).toMatchObject({
      tourId: 't',
      stepIndex: 3,
      completedTours: ['x'],
      skippedTours: ['y'],
    })
    expect(typeof blob.timestamp).toBe('number')
  })

  it('defaults a partial state to null tourId and step 0', () => {
    store.save({})

    expect(JSON.parse(storage.getItem(KEY) ?? 'null')).toMatchObject({
      tourId: null,
      stepIndex: 0,
    })
  })

  it('writes nothing when enabled is false', () => {
    const off = createRouteStore({ enabled: false, storage: 'localStorage' }, storage)
    off.save({ tourId: 't', currentStepIndex: 1 })

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('honours a custom key', () => {
    const custom = createRouteStore({ ...enabled, key: 'my-key' }, storage)
    custom.save({ tourId: 't' })

    expect(storage.getItem('my-key')).not.toBeNull()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('swallows a throwing setItem rather than breaking the tour', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    expect(() => store.save({ tourId: 't' })).not.toThrow()
  })
})

describe('load', () => {
  it('round-trips a saved state', () => {
    store.save({ tourId: 't', currentStepIndex: 2 })

    expect(store.load()).toMatchObject({ tourId: 't', stepIndex: 2 })
  })

  it('returns null when nothing is stored', () => {
    expect(store.load()).toBeNull()
  })

  it('returns null when enabled is false, even with a blob present', () => {
    stageBlob()
    const off = createRouteStore({ enabled: false, storage: 'localStorage' }, storage)

    expect(off.load()).toBeNull()
  })

  it('returns null and REMOVES the key past expiryMs', () => {
    // Removal is the point: leaving dead bytes means every subsequent mount
    // re-parses and re-rejects them, and `isStale()` keeps reporting true
    // forever on a key nobody can clear.
    stageBlob({ timestamp: Date.now() - (DAY_MS + 1000) })

    expect(store.load()).toBeNull()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('honours a custom expiryMs', () => {
    stageBlob({ timestamp: Date.now() - 5000 })
    const short = createRouteStore({ ...enabled, expiryMs: 1000 }, storage)

    expect(short.load()).toBeNull()
  })

  it('returns null rather than throwing on a corrupt blob', () => {
    storage.setItem(KEY, '{not json')

    expect(store.load()).toBeNull()
  })
})

describe('clear', () => {
  it('removes the key', () => {
    store.save({ tourId: 't' })
    store.clear()

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('clears regardless of enabled — teardown must always be able to clean up', () => {
    stageBlob()
    const off = createRouteStore({ enabled: false, storage: 'localStorage' }, storage)
    off.clear()

    expect(storage.getItem(KEY)).toBeNull()
  })
})

describe('isStale', () => {
  it('is true when nothing is stored', () => {
    expect(store.isStale()).toBe(true)
  })

  it('is false for a fresh blob', () => {
    store.save({ tourId: 't' })

    expect(store.isStale()).toBe(false)
  })

  it('is true for an expired blob', () => {
    stageBlob({ timestamp: Date.now() - (DAY_MS + 1000) })

    expect(store.isStale()).toBe(true)
  })
})

describe('subscribeStorage', () => {
  const syncing: MultiPagePersistenceConfig = {
    enabled: true,
    storage: 'localStorage',
    syncTabs: true,
  }

  it('fires for a StorageEvent on our key', () => {
    const cb = vi.fn()
    const unsubscribe = createRouteStore(syncing, storage).subscribeStorage(cb)

    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
    expect(cb).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('ignores a StorageEvent on someone else’s key', () => {
    const cb = vi.fn()
    const unsubscribe = createRouteStore(syncing, storage).subscribeStorage(cb)

    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }))
    expect(cb).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('the returned unsubscribe stops delivery', () => {
    const cb = vi.fn()
    const unsubscribe = createRouteStore(syncing, storage).subscribeStorage(cb)
    unsubscribe()

    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
    expect(cb).not.toHaveBeenCalled()
  })

  it('is a no-op when syncTabs is off', () => {
    const cb = vi.fn()
    const unsubscribe = createRouteStore(enabled, storage).subscribeStorage(cb)

    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
    expect(cb).not.toHaveBeenCalled()

    expect(() => unsubscribe()).not.toThrow()
  })

  it('is a no-op for non-localStorage backends — no storage event exists to hear', () => {
    const cb = vi.fn()
    const unsubscribe = createRouteStore(
      { enabled: true, storage: 'sessionStorage', syncTabs: true },
      storage
    ).subscribeStorage(cb)

    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
    expect(cb).not.toHaveBeenCalled()

    unsubscribe()
  })
})
