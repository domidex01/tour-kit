/**
 * v3 Phase 1 — `createHintsHandle`, the binding contract.
 *
 * Core's `engine-handle.test.ts` proves `createHandle`'s six lifecycle rules
 * over a fake `EngineLike`. This file proves the same six survive the
 * composition with nine hint verbs and a REAL engine — a counting factory over
 * `createHintsEngine`, so "constructed once" and "constructed lazily" are
 * observable rather than inferred.
 */
import { describe, expect, it } from 'vitest'
import { createMockStorage } from '../../../__tests__/mock-storage'
import { createHintsEngine } from '../create-hints-engine'
import { INITIAL_HINTS_STATE, createHintsHandle } from '../handle'

function counting(storage?: Storage) {
  let constructed = 0
  return {
    factory: () => {
      constructed++
      return createHintsEngine({ storage })
    },
    count: () => constructed,
  }
}

describe('createHintsHandle — the six createHandle behaviours through nine hint verbs', () => {
  it('getState() before any verb is INITIAL_HINTS_STATE by reference', () => {
    const c = counting()
    const h = createHintsHandle(c.factory)

    expect(h.getState()).toBe(INITIAL_HINTS_STATE)
    expect(c.count(), 'getState() constructed the engine').toBe(0)
  })

  it('subscribe() alone constructs nothing', () => {
    const c = counting()
    const h = createHintsHandle(c.factory)

    h.subscribe(() => {})()
    expect(c.count()).toBe(0)
  })

  it('ensure() constructs once and fans out once', () => {
    const c = counting()
    const h = createHintsHandle(c.factory)
    let notified = 0
    h.subscribe(() => notified++)

    const first = h.ensure()
    expect(h.ensure()).toBe(first)
    expect(c.count()).toBe(1)
    expect(notified).toBe(1)
  })

  it('release() is deferred one microtask; a verb in the same tick takes it back', async () => {
    const c = counting()
    const h = createHintsHandle(c.factory)
    h.setHints([{ id: 'a' }])
    h.showHint('a')
    expect(h.getState().activeHint).toBe('a')

    h.release()
    h.hideHint('a') // same tick — takes the release back
    await Promise.resolve()
    expect(c.count(), 'the deferred destroy fired anyway').toBe(1)
    expect(h.getState().hints.has('a'), 'the engine lost its state').toBe(true)

    // Nothing takes this one back.
    h.release()
    await Promise.resolve()
    expect(h.getState()).toBe(INITIAL_HINTS_STATE)
  })

  it('release() does not throw — a hints engine has no `flush`', async () => {
    // `EngineLike.flush` is optional precisely so a synchronous engine like
    // this one can compose the same handle. `createHandle` calls it as `?.()`.
    const h = createHintsHandle(counting().factory)
    h.ensure()

    expect(() => h.release()).not.toThrow()
    await Promise.resolve()
    expect(h.getState()).toBe(INITIAL_HINTS_STATE)
  })

  it('a listener subscribed before construction fires on the construction fan-out', () => {
    const h = createHintsHandle(counting().factory)
    let notified = 0
    h.subscribe(() => notified++)

    expect(notified).toBe(0)
    h.showHint('anything') // the first verb constructs
    expect(notified, 'the construction fan-out never reached the listener').toBeGreaterThan(0)
  })
})

describe('createHintsHandle — the hint verbs', () => {
  it('a verb before boot() constructs the engine, dispatches, and notifies', () => {
    const storage = createMockStorage()
    const c = counting(storage)
    const h = createHintsHandle(c.factory)
    let notified = 0
    h.subscribe(() => notified++)

    h.setHints([{ id: 'a', frequency: 'once' }])
    expect(c.count()).toBe(1)
    expect(h.getState().hints.has('a')).toBe(true)
    expect(notified).toBeGreaterThan(0)
  })

  it('verb identity survives release() and re-construction', async () => {
    const h = createHintsHandle(counting().factory)
    const before = h.showHint
    h.setHints([{ id: 'a' }])

    h.release()
    await Promise.resolve()
    h.setHints([{ id: 'a' }])

    expect(h.showHint).toBe(before)
    expect(h.dismissHint).toBe(h.dismissHint)
  })

  it('every verb is forwarded to the live engine', () => {
    const h = createHintsHandle(counting(createMockStorage()).factory)
    h.setHints([{ id: 'a' }, { id: 'b' }])
    h.boot()

    h.showHint('a')
    expect(h.getState().activeHint).toBe('a')
    h.hideHint('a')
    expect(h.getState().activeHint).toBeNull()
    h.dismissHint('a')
    expect(h.getState().hints.get('a')?.isDismissed).toBe(true)
    h.resetHint('a')
    expect(h.getState().hints.get('a')?.isDismissed).toBe(false)
    h.registerHint('c')
    expect(h.getState().hints.has('c')).toBe(true)
    h.unregisterHint('c')
    expect(h.getState().hints.has('c')).toBe(false)
    h.dismissHint('b')
    h.resetAllHints()
    expect(h.getState().hints.get('b')?.isDismissed).toBe(false)
  })
})
