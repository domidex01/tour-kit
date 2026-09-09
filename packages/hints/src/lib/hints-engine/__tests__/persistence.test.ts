import type { FrequencyState } from '@tour-kit/core/engine'
/**
 * v3 Phase 1 — the four persistence functions, tested directly.
 *
 * `freezeState` and `thawState` stay private: the round-trip they guarantee is
 * observable through `syncStorage` → `readPersistedEntries`, which is the pair
 * the engine actually calls, so testing them through it pins the contract
 * without widening the module's surface.
 *
 * The storage double is the shim the React tests already use — one storage
 * fake in the package, not two.
 */
import { describe, expect, it, vi } from 'vitest'
import { createMockStorage } from '../../../__tests__/mock-storage'
import { readPersistedEntries, resolveStorage, syncStorage } from '../persistence'

const raw = () => createMockStorage()

function freqState(over: Partial<FrequencyState> = {}): FrequencyState {
  return { viewCount: 1, isDismissed: false, lastViewedAt: null, ...over }
}

describe('freeze / thaw round-trip', () => {
  it('a Date survives as a Date and null stays null', () => {
    const storage = raw()
    const at = new Date('2026-01-08T00:00:00Z')
    syncStorage(
      storage,
      new Map(),
      new Map([
        ['dated', freqState({ viewCount: 3, isDismissed: true, lastViewedAt: at })],
        ['never', freqState({ viewCount: 0, lastViewedAt: null })],
      ]),
      new Set()
    )

    // The blob on disk is an ISO string, not a Date.
    expect(storage.getItem('hint:freq:dated')).toContain(
      '"lastViewedAt":"2026-01-08T00:00:00.000Z"'
    )

    const entries = new Map(readPersistedEntries(storage, ['dated', 'never'], new Set()))
    expect(entries.get('dated')).toEqual({
      viewCount: 3,
      isDismissed: true,
      lastViewedAt: at,
    })
    expect(entries.get('dated')?.lastViewedAt).toBeInstanceOf(Date)
    expect(entries.get('never')?.lastViewedAt).toBeNull()
  })
})

describe('readPersistedEntries', () => {
  it('skips ids already hydrated and records the ones it touched', () => {
    const storage = raw()
    syncStorage(
      storage,
      new Map(),
      new Map([
        ['a', freqState()],
        ['b', freqState()],
      ]),
      new Set()
    )

    const hydrated = new Set(['a'])
    const entries = readPersistedEntries(storage, ['a', 'b'], hydrated)

    expect(entries.map(([id]) => id)).toEqual(['b'])
    expect(hydrated, 'the touched id was not recorded').toEqual(new Set(['a', 'b']))

    // A second pass over the same ids reads nothing new.
    expect(readPersistedEntries(storage, ['a', 'b'], hydrated)).toEqual([])
  })

  it('swallows unparseable JSON and still marks the id hydrated', () => {
    const storage = raw()
    storage.setItem('hint:freq:bad', '{not json')

    const hydrated = new Set<string>()
    expect(readPersistedEntries(storage, ['bad'], hydrated)).toEqual([])
    expect(hydrated.has('bad')).toBe(true)
  })
})

describe('syncStorage', () => {
  it('removes ids dropped between prev and next, and un-hydrates them', () => {
    const storage = raw()
    const prev = new Map([
      ['gone', freqState()],
      ['kept', freqState()],
    ])
    syncStorage(storage, new Map(), prev, new Set())

    const hydrated = new Set(['gone', 'kept'])
    syncStorage(storage, prev, new Map([['kept', freqState({ viewCount: 9 })]]), hydrated)

    expect(storage.getItem('hint:freq:gone')).toBeNull()
    expect(storage.getItem('hint:freq:kept')).toContain('"viewCount":9')
    // Un-hydrating is what lets a later setHints re-read a reset id.
    expect(hydrated).toEqual(new Set(['kept']))
  })

  it('swallows a throwing setItem — frequency rules degrade, they do not crash', () => {
    const storage = raw()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    expect(() =>
      syncStorage(storage, new Map(), new Map([['a', freqState()]]), new Set())
    ).not.toThrow()
  })
})

describe('resolveStorage', () => {
  it('prefixes an explicit adapter with `tourkit:`', () => {
    const storage = raw()
    const resolved = resolveStorage(storage)

    resolved?.setItem('hint:freq:a', 'v')
    expect(storage.getItem('tourkit:hint:freq:a')).toBe('v')
  })
})
