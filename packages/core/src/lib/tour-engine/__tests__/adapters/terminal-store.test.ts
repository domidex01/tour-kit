/**
 * v2 §1.3b — `createTerminalStore` against an injected `createMemoryStorage()`.
 *
 * The hook this replaces (`use-persistence.ts`) held no state of its own, so
 * the whole contract is "which key gets which bytes". Asserting on raw keys
 * rather than through the getters is deliberate: the terminal lists are read
 * back by `boot()` and by the route store, and a silent key rename would pass
 * a round-trip test while breaking restore.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStorage } from '../../../../utils/storage'
import { type TerminalStore, createTerminalStore } from '../../adapters/terminal-store'

let storage: Storage
let store: TerminalStore

beforeEach(() => {
  storage = createMemoryStorage()
  store = createTerminalStore(undefined, storage)
})

describe('reads', () => {
  it('returns empty lists when nothing is stored', () => {
    expect(store.getCompletedTours()).toEqual([])
    expect(store.getSkippedTours()).toEqual([])
  })

  it('returns empty lists rather than throwing on a corrupt blob', () => {
    storage.setItem('tourkit:completed', '{not json')
    expect(store.getCompletedTours()).toEqual([])
  })

  it('getDontShowAgain is false until explicitly set', () => {
    expect(store.getDontShowAgain('a')).toBe(false)
  })

  it('getLastStep returns null when unset and a number once saved', () => {
    expect(store.getLastStep('a')).toBeNull()
    store.saveStep('a', 3)
    expect(store.getLastStep('a')).toBe(3)
  })
})

describe('writes land under the tourkit: prefix', () => {
  it('markCompleted appends to tourkit:completed', () => {
    store.markCompleted('a')
    expect(JSON.parse(storage.getItem('tourkit:completed') ?? 'null')).toEqual(['a'])
  })

  it('markSkipped appends to tourkit:skipped', () => {
    store.markSkipped('a')
    expect(JSON.parse(storage.getItem('tourkit:skipped') ?? 'null')).toEqual(['a'])
  })

  it('saveStep writes tourkit:step:<id>', () => {
    store.saveStep('a', 2)
    expect(storage.getItem('tourkit:step:a')).toBe('2')
  })

  it('setDontShowAgain(true) writes and (false) removes tourkit:dontShow:<id>', () => {
    store.setDontShowAgain('a', true)
    expect(storage.getItem('tourkit:dontShow:a')).toBe('true')

    store.setDontShowAgain('a', false)
    expect(storage.getItem('tourkit:dontShow:a')).toBeNull()
  })

  it('honours a custom keyPrefix', () => {
    const custom = createTerminalStore({ keyPrefix: 'myapp' }, storage)
    custom.markCompleted('a')

    expect(storage.getItem('myapp:completed')).not.toBeNull()
    expect(storage.getItem('tourkit:completed')).toBeNull()
  })
})

describe('idempotency', () => {
  it('markCompleted twice writes once and keeps one entry', () => {
    const setItem = vi.spyOn(storage, 'setItem')
    store.markCompleted('a')
    store.markCompleted('a')

    expect(setItem).toHaveBeenCalledTimes(1)
    expect(store.getCompletedTours()).toEqual(['a'])
  })

  it('markSkipped twice writes once', () => {
    const setItem = vi.spyOn(storage, 'setItem')
    store.markSkipped('a')
    store.markSkipped('a')

    expect(setItem).toHaveBeenCalledTimes(1)
  })

  it('completed and skipped are independent lists', () => {
    store.markCompleted('a')
    store.markSkipped('b')

    expect(store.getCompletedTours()).toEqual(['a'])
    expect(store.getSkippedTours()).toEqual(['b'])
  })
})

describe('reset', () => {
  beforeEach(() => {
    store.markCompleted('a')
    store.markCompleted('b')
    store.markSkipped('a')
    store.saveStep('a', 4)
    store.setDontShowAgain('a', true)
  })

  it('with a tourId removes that id from both lists and drops its per-tour keys', () => {
    store.reset('a')

    expect(store.getCompletedTours()).toEqual(['b'])
    expect(store.getSkippedTours()).toEqual([])
    expect(storage.getItem('tourkit:step:a')).toBeNull()
    expect(storage.getItem('tourkit:dontShow:a')).toBeNull()
  })

  it('with a tourId leaves other tours untouched', () => {
    store.saveStep('b', 1)
    store.reset('a')

    expect(storage.getItem('tourkit:step:b')).toBe('1')
  })

  it('without a tourId clears both lists', () => {
    store.reset()

    expect(store.getCompletedTours()).toEqual([])
    expect(store.getSkippedTours()).toEqual([])
  })

  it('without a tourId leaves per-tour step keys alone (current behaviour)', () => {
    // The bare reset() removes only the two list keys. Pinned as-is: widening
    // it to a prefix sweep is a behaviour change, not a refactor.
    store.reset()
    expect(storage.getItem('tourkit:step:a')).toBe('4')
  })
})
