/**
 * v3 Phase 1 — `createHintsEngine()`, tested directly.
 *
 * The provider is the oracle: every scenario below is one the existing 295
 * already drive through React (`hint-frequency.test.tsx`,
 * `hints-provider.test.tsx`), re-expressed against the engine. If one of these
 * goes red while its React twin stays green, the engine has drifted from the
 * provider — which is the only thing this file is for.
 *
 * No mock of `@tour-kit/core/engine`: `canShowByFrequency` and friends are the
 * real ones. The only double is the storage shim the React tests already use.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockStorage, seedHintFrequencyState } from '../../../__tests__/mock-storage'
import { createHintsEngine } from '../create-hints-engine'
import type { HintEngineConfig } from '../types'

const ID = 'tip'
const KEY = `tourkit:hint:freq:${ID}`
const NOW = new Date('2026-01-08T00:00:00Z')

function freeze() {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
}

describe('createHintsEngine — the contract', () => {
  let storage: Storage

  beforeEach(() => {
    freeze()
    storage = createMockStorage()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('the constructor touches nothing until boot()', () => {
    const spy = vi.spyOn(storage, 'getItem')
    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID, frequency: 'once' }])
    expect(spy, 'storage was read before boot()').not.toHaveBeenCalled()

    e.boot()
    expect(spy).toHaveBeenCalled()
  })

  it('getState() is reference-stable between dispatches', () => {
    const e = createHintsEngine({ storage })
    expect(e.getState()).toBe(e.getState())
  })

  it('a no-op dispatch does not notify', () => {
    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID }])
    e.boot()
    let notified = 0
    e.subscribe(() => notified++)

    e.showHint(ID)
    const afterFirst = e.getState()
    const countAfterFirst = notified

    e.showHint(ID) // already open and already active — the reducer returns `state`
    expect(e.getState(), 'a no-op dispatch replaced the state object').toBe(afterFirst)
    expect(notified, 'a no-op dispatch notified listeners').toBe(countAfterFirst)
  })

  it('destroy() is terminal — every verb is inert and subscribe returns a no-op', () => {
    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID }])
    e.boot()
    e.showHint(ID)
    const last = e.getState()

    e.destroy()
    let notified = 0
    const off = e.subscribe(() => notified++)
    e.showHint(ID)
    e.dismissHint(ID)
    e.setHints([{ id: 'other' }])
    e.boot()

    expect(e.getState()).toBe(last)
    expect(notified).toBe(0)
    expect(() => off()).not.toThrow()
  })

  it('boot() is idempotent', () => {
    const spy = vi.spyOn(storage, 'getItem')
    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID, frequency: 'once' }])
    e.boot()
    const reads = spy.mock.calls.length

    e.boot()
    expect(spy.mock.calls.length, 'the second boot() re-read storage').toBe(reads)
  })

  it('a verb before setHints is UNGATED and a verb before boot() is UNPERSISTED', () => {
    // Engine semantics, pinned deliberately: one writer for configs, storage at
    // boot. It is the BINDING that closes this window by seeding its factory
    // (Decision 12) — never the engine.
    const e = createHintsEngine({ storage })
    e.registerHint(ID)
    e.showHint(ID) // no config → no rule → no gate, and no storage → no write

    expect(e.getState().activeHint).toBe(ID)
    expect(storage.getItem(KEY)).toBeNull()
  })
})

describe('createHintsEngine — registration', () => {
  beforeEach(freeze)
  afterEach(() => vi.useRealTimers())

  it('setHints registers every id in the list', () => {
    const e = createHintsEngine({ storage: createMockStorage() })
    e.setHints([{ id: 'a' }, { id: 'b' }])

    expect([...e.getState().hints.keys()]).toEqual(['a', 'b'])
  })

  it('a shrinking list unregisters the dropped id and clears activeHint if it was it', () => {
    const e = createHintsEngine({ storage: createMockStorage() })
    e.setHints([{ id: 'a' }, { id: 'b' }])
    e.boot()
    e.showHint('b')
    expect(e.getState().activeHint).toBe('b')

    e.setHints([{ id: 'a' }])
    expect(e.getState().hints.has('b')).toBe(false)
    expect(e.getState().activeHint).toBeNull()
  })

  it('an imperative registerHint coexists with the config-driven set (Decision 10.2)', () => {
    // Two registration paths, one state map: a shrinking config unregisters an
    // id even under a live imperative registration. Pinned for parity.
    const e = createHintsEngine({ storage: createMockStorage() })
    e.setHints([{ id: 'a' }])
    e.registerHint('c')
    expect([...e.getState().hints.keys()]).toEqual(['a', 'c'])

    e.setHints([{ id: 'a' }, { id: 'c' }])
    e.setHints([{ id: 'a' }])
    expect(e.getState().hints.has('c'), 'the config diff did not reclaim the id').toBe(false)
  })
})

describe('createHintsEngine — the seven frequency scenarios', () => {
  // Each one has a React twin in `hint-frequency.test.tsx`, driven through
  // <HintsProvider>. Same rules, same storage shim, same instant, no React.
  let storage: Storage

  beforeEach(() => {
    freeze()
    storage = createMockStorage()
  })
  afterEach(() => vi.useRealTimers())

  function booted(frequency?: HintEngineConfig['frequency']) {
    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID, frequency }])
    e.boot()
    return e
  }

  it('interval: 7 days suppresses at +6 and allows at +8', () => {
    const e = booted({ type: 'interval', days: 7 })
    e.showHint(ID)
    expect(e.getState().activeHint).toBe(ID)
    e.hideHint(ID)

    vi.setSystemTime(new Date(NOW.getTime() + 6 * 24 * 60 * 60 * 1000))
    e.showHint(ID)
    expect(e.getState().activeHint, 'the interval did not suppress at +6 days').toBeNull()

    vi.setSystemTime(new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000))
    e.showHint(ID)
    expect(e.getState().activeHint, 'the interval did not allow at +8 days').toBe(ID)
  })

  it("'once' is sticky after dismissal, and after a reload", () => {
    const e = booted('once')
    e.showHint(ID)
    expect(e.getState().activeHint).toBe(ID)
    e.dismissHint(ID)
    e.showHint(ID)
    expect(e.getState().activeHint, "'once' re-showed after dismissal").toBeNull()

    // "Reload": a second engine over the same storage hydrates the dismissal.
    const e2 = createHintsEngine({ storage })
    e2.setHints([{ id: ID, frequency: 'once' }])
    e2.boot()
    e2.showHint(ID)
    expect(e2.getState().activeHint, 'the persisted dismissal did not survive').toBeNull()
  })

  it('times: 3 blocks the fourth show', () => {
    const e = booted({ type: 'times', count: 3 })
    for (let i = 0; i < 3; i++) {
      e.showHint(ID)
      e.hideHint(ID)
    }
    expect(e.getState().frequencyState.get(ID)?.viewCount).toBe(3)

    e.showHint(ID)
    expect(e.getState().activeHint, 'the fourth show was allowed').toBeNull()
  })

  it('a seeded blob suppresses showHint after boot()', () => {
    seedHintFrequencyState(storage, ID, {
      viewCount: 1,
      isDismissed: true,
      lastViewedAt: new Date('2026-01-01T00:00:00Z'),
    })
    const e = booted('once')
    e.showHint(ID)
    expect(e.getState().activeHint).toBeNull()
  })

  it('a recorded view is in storage right after showHint', () => {
    const e = booted({ type: 'times', count: 3 })
    e.showHint(ID)

    // Synchronously, inside dispatch — no React commit to wait for.
    expect(storage.getItem(KEY)).toContain('"viewCount":1')
  })

  it('resetHint deletes the entry, and a second engine does not re-hydrate it', () => {
    const e = booted({ type: 'times', count: 3 })
    e.showHint(ID)
    expect(storage.getItem(KEY)).not.toBeNull()

    e.resetHint(ID)
    expect(storage.getItem(KEY), 'the reset did not reach storage').toBeNull()

    const e2 = createHintsEngine({ storage })
    e2.setHints([{ id: ID, frequency: { type: 'times', count: 3 } }])
    e2.boot()
    expect(e2.getState().frequencyState.has(ID)).toBe(false)
  })

  it('resetAllHints clears every entry', () => {
    const e = createHintsEngine({ storage })
    e.setHints([
      { id: 'a', frequency: { type: 'times', count: 3 } },
      { id: 'b', frequency: { type: 'times', count: 3 } },
    ])
    e.boot()
    e.showHint('a')
    e.showHint('b')
    expect(storage.getItem('tourkit:hint:freq:a')).not.toBeNull()

    e.resetAllHints()
    expect(storage.getItem('tourkit:hint:freq:a')).toBeNull()
    expect(storage.getItem('tourkit:hint:freq:b')).toBeNull()
  })
})

describe('createHintsEngine — hydration order', () => {
  beforeEach(freeze)
  afterEach(() => vi.useRealTimers())

  it('setHints before boot() → boot() hydrates', () => {
    const storage = createMockStorage()
    seedHintFrequencyState(storage, ID, { viewCount: 2, isDismissed: false, lastViewedAt: NOW })

    const e = createHintsEngine({ storage })
    e.setHints([{ id: ID }])
    expect(e.getState().frequencyState.has(ID), 'setHints hydrated before boot()').toBe(false)

    e.boot()
    expect(e.getState().frequencyState.get(ID)?.viewCount).toBe(2)
  })

  it('setHints after boot() hydrates the NEW id only', () => {
    const storage = createMockStorage()
    seedHintFrequencyState(storage, 'a', { viewCount: 1, isDismissed: false, lastViewedAt: NOW })
    seedHintFrequencyState(storage, 'b', { viewCount: 5, isDismissed: false, lastViewedAt: NOW })

    const e = createHintsEngine({ storage })
    e.setHints([{ id: 'a' }])
    e.boot()
    const spy = vi.spyOn(storage, 'getItem')

    e.setHints([{ id: 'a' }, { id: 'b' }])
    expect(e.getState().frequencyState.get('b')?.viewCount).toBe(5)
    expect(
      spy.mock.calls.map(([k]) => k),
      'an already-hydrated id was re-read'
    ).toEqual(['tourkit:hint:freq:b'])
  })
})

describe('createHintsEngine — the two quirks pinned for parity', () => {
  beforeEach(freeze)
  afterEach(() => vi.useRealTimers())

  it('10.1: dismissHint with no setHints writes a blob a fresh engine never reads back', () => {
    const storage = createMockStorage()
    const e = createHintsEngine({ storage })
    e.boot() // no setHints — legacy imperative mode
    e.registerHint('x')
    e.dismissHint('x')
    expect(storage.getItem('tourkit:hint:freq:x'), 'the write half disappeared').not.toBeNull()

    // hydrate() reads only ids setHints has seen, exactly as the provider's
    // hydrate effect is gated on `hints`. This asymmetry is a quirk pinned for
    // parity, not a bug to fix in this phase.
    const spy = vi.spyOn(storage, 'getItem')
    const fresh = createHintsEngine({ storage })
    fresh.boot()
    expect(spy).not.toHaveBeenCalled()
    expect(fresh.getState().frequencyState.size).toBe(0)
  })

  it('10.3: storage is read once, at boot — there is no API to change it later', () => {
    const first = createMockStorage()
    const second = createMockStorage()
    const options = { storage: first }

    const e = createHintsEngine(options)
    e.setHints([{ id: ID, frequency: { type: 'times', count: 3 } }])
    e.boot()
    e.showHint(ID)

    expect(first.getItem(KEY)).not.toBeNull()
    // Mutating the option bag after boot changes nothing: `resolveStorage` ran
    // once and the engine holds the resolved adapter, not the bag.
    options.storage = second
    e.hideHint(ID)
    e.showHint(ID)
    expect(second.getItem(KEY), 'the engine re-read options.storage').toBeNull()
  })
})
