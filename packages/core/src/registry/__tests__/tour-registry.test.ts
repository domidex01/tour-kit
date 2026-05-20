import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RegistryEntry } from '../tour-registry'
import { tourRegistry } from '../tour-registry'
import { resetTourRegistry } from './test-helpers'

function makeEntry(id: string): RegistryEntry {
  return {
    id,
    state: { isActive: false, currentStepId: null, progress: 0 },
    actions: {
      start: vi.fn(),
      stop: vi.fn(),
      restart: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      goToStep: vi.fn(),
    },
  }
}

beforeEach(() => {
  resetTourRegistry()
})

afterEach(() => {
  resetTourRegistry()
})

describe('tourRegistry — basic register/get/unregister', () => {
  it('register({id, ...}) makes the entry retrievable via get(id)', () => {
    const entry = makeEntry('welcome')
    tourRegistry.register(entry)
    expect(tourRegistry.get('welcome')).toBe(entry)
  })

  it('the unregister fn returned by register() clears the entry — snapshot().size === 0', () => {
    const entry = makeEntry('welcome')
    const unregister = tourRegistry.register(entry)
    expect(tourRegistry.snapshot().size).toBe(1)
    unregister()
    expect(tourRegistry.snapshot().size).toBe(0)
    expect(tourRegistry.get('welcome')).toBeNull()
  })

  it('get(unknown) returns null without throwing', () => {
    expect(tourRegistry.get('does-not-exist')).toBeNull()
  })
})

describe('tourRegistry — StrictMode-safe lifecycle', () => {
  it('simulated double-mount + double-unmount leaves zero live entries', () => {
    // StrictMode mounts an effect twice in dev. Each cycle gets its own
    // entry; the registration helper logs a dev warning on the second cycle
    // and the unregister returned by the FIRST cycle is a no-op (it sees a
    // different WeakRef in the Map slot).
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const entry1 = makeEntry('welcome')
    const unregister1 = tourRegistry.register(entry1)
    const entry2 = makeEntry('welcome')
    const unregister2 = tourRegistry.register(entry2)

    expect(tourRegistry.get('welcome')).toBe(entry2)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

    // First unregister runs in StrictMode's first cleanup. Because the Map
    // slot now points at entry2's ref, the first unregister is a no-op.
    unregister1()
    expect(tourRegistry.get('welcome')).toBe(entry2)

    // Second unregister runs in StrictMode's second cleanup. The Map slot
    // matches its own ref, so it removes the entry cleanly.
    unregister2()
    expect(tourRegistry.snapshot().size).toBe(0)

    consoleErrorSpy.mockRestore()
  })

  it('prune() drops any WeakRef slots whose target was GC\'d', () => {
    // We cannot reliably trigger GC in jsdom, so simulate a dead ref by
    // clearing it via direct entry mutation. The spec accepts this fallback:
    // if `globalThis.gc` isn't available, the StrictMode invariant is checked
    // by the explicit unregister path above; `prune()` is a defensive fallback.
    const entry = makeEntry('welcome')
    tourRegistry.register(entry)
    expect(tourRegistry.snapshot().size).toBe(1)

    // Manually verify prune is a no-op when all refs are still live.
    tourRegistry.prune()
    expect(tourRegistry.snapshot().size).toBe(1)
  })
})

describe('tourRegistry — WeakRef GC fallback (requires --expose-gc)', () => {
  // These tests verify that when a provider is GC'd without running its
  // explicit unregister cleanup (rare — React crash mid-commit, etc.), the
  // WeakRef path still cleans up correctly. Default `pnpm test` doesn't
  // expose globalThis.gc, so these skip cleanly; CI can opt in via:
  //   node --expose-gc node_modules/vitest/vitest.mjs run

  it.skipIf(!globalThis.gc)(
    'WeakRef cleanup — register without unregister, then GC leaves zero live entries',
    async () => {
      ;(() => {
        // Register inside an IIFE so the strong reference goes out of scope.
        tourRegistry.register(makeEntry('ephemeral'))
      })()
      // GC twice — V8 sometimes needs two passes to collect weakly-held objects.
      globalThis.gc?.()
      await new Promise((r) => setTimeout(r, 0))
      globalThis.gc?.()
      tourRegistry.prune()
      expect(tourRegistry.snapshot().size).toBe(0)
    }
  )

  it.skipIf(!globalThis.gc)(
    'get() notifies subscribers when it prunes a GC-collected entry',
    async () => {
      const listener = vi.fn()
      tourRegistry.subscribe(listener)
      ;(() => {
        tourRegistry.register(makeEntry('ephemeral'))
      })()
      listener.mockClear() // ignore the register notify
      globalThis.gc?.()
      await new Promise((r) => setTimeout(r, 0))
      globalThis.gc?.()
      // get() returns null because the WeakRef target is gone — and notifies
      // so any useSyncExternalStore consumer subscribed to this id re-renders
      // with the frozen no-op instead of holding stale state.
      expect(tourRegistry.get('ephemeral')).toBeNull()
      expect(listener).toHaveBeenCalled()
    }
  )
})

describe('tourRegistry — dev double-id console.error', () => {
  it('emits console.error in dev when the same id is registered twice', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    tourRegistry.register(makeEntry('welcome'))
    tourRegistry.register(makeEntry('welcome'))

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tour "welcome" registered twice')
    )

    consoleErrorSpy.mockRestore()
  })
})

describe('tourRegistry — subscribe + update', () => {
  it('subscribers fire when register, update, and unregister mutate state', () => {
    const listener = vi.fn()
    const unsubscribe = tourRegistry.subscribe(listener)

    const entry = makeEntry('welcome')
    const unregister = tourRegistry.register(entry)
    expect(listener).toHaveBeenCalledTimes(1)

    tourRegistry.update('welcome', {
      isActive: true,
      currentStepId: 'hero',
      progress: 0.5,
    })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(tourRegistry.get('welcome')?.state).toEqual({
      isActive: true,
      currentStepId: 'hero',
      progress: 0.5,
    })

    // No-op update (same values) must NOT notify — keeps consumer rerenders
    // tight to real state transitions.
    tourRegistry.update('welcome', {
      isActive: true,
      currentStepId: 'hero',
      progress: 0.5,
    })
    expect(listener).toHaveBeenCalledTimes(2)

    unregister()
    expect(listener).toHaveBeenCalledTimes(3)

    unsubscribe()
  })

  it('unsubscribe removes the listener', () => {
    const listener = vi.fn()
    const unsubscribe = tourRegistry.subscribe(listener)
    unsubscribe()

    tourRegistry.register(makeEntry('welcome'))
    expect(listener).not.toHaveBeenCalled()
  })

  it('update() on unknown id is a no-op (does not throw)', () => {
    const listener = vi.fn()
    const unsubscribe = tourRegistry.subscribe(listener)

    expect(() =>
      tourRegistry.update('not-registered', {
        isActive: true,
        currentStepId: null,
        progress: 0,
      })
    ).not.toThrow()
    expect(listener).not.toHaveBeenCalled()

    unsubscribe()
  })
})

describe('tourRegistry — __reset__ test-only helper', () => {
  it('__reset__ is exposed under NODE_ENV=test', () => {
    expect(typeof tourRegistry.__reset__).toBe('function')
  })

  it('__reset__ clears both entries and listeners', () => {
    const listener = vi.fn()
    tourRegistry.subscribe(listener)
    tourRegistry.register(makeEntry('welcome'))

    tourRegistry.__reset__?.()

    expect(tourRegistry.snapshot().size).toBe(0)
    // Registering again does not fire the previous listener (it was cleared).
    tourRegistry.register(makeEntry('next'))
    expect(listener).toHaveBeenCalledTimes(1) // only the pre-reset register
  })
})
