/**
 * `createListeners` — the subscriber set every engine keeps.
 *
 * The rule under test is the one that was silently lost when a second engine
 * was written: **a broken subscriber must not take the engine down with it.**
 * `createTourEngine` had the try/catch and no test for it; `createHintsEngine`
 * re-derived the loop in v3 Phase 1 and dropped the try/catch entirely. This
 * file is that rule's only direct coverage, and both engines now route through
 * the implementation it exercises.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../../../utils/logger'
import { createListeners } from '../listeners'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createListeners', () => {
  it('fans out synchronously, in subscription order', () => {
    const set = createListeners('test')
    const seen: number[] = []
    set.add(() => seen.push(1))
    set.add(() => seen.push(2))

    set.notify()

    expect(seen).toEqual([1, 2])
  })

  it('a throwing listener does not stop the ones after it', () => {
    // The whole point. Before this existed, `createHintsEngine` aborted the
    // loop here — and its storage write had already landed, so every listener
    // after the thrower was reading state that storage no longer agreed with.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const set = createListeners('createHintsEngine')
    const seen: string[] = []

    set.add(() => seen.push('before'))
    set.add(() => {
      throw new Error('subscriber is broken')
    })
    set.add(() => seen.push('after'))

    expect(() => set.notify()).not.toThrow()
    expect(seen, 'the fan-out aborted at the throwing listener').toEqual(['before', 'after'])
    expect(warn).toHaveBeenCalledWith('createHintsEngine: listener threw', expect.any(Error))
  })

  it('a throwing listener still throws on the NEXT notify — it is not evicted', () => {
    // Deliberate: silently dropping a subscriber would be a second, quieter
    // desync. The contract is "keep going", not "self-heal".
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const set = createListeners('test')
    let calls = 0
    set.add(() => {
      calls++
      throw new Error('still broken')
    })

    set.notify()
    set.notify()

    expect(calls, 'the throwing listener was silently evicted').toBe(2)
  })

  it('the label names the engine, so the warning says which one threw', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    createListeners('createTourEngine').add(() => {
      throw new Error('x')
    })
    const set = createListeners('createTourEngine')
    set.add(() => {
      throw new Error('x')
    })
    set.notify()

    expect(warn).toHaveBeenCalledWith('createTourEngine: listener threw', expect.any(Error))
  })

  it('unsubscribe removes exactly one listener and is idempotent', () => {
    const set = createListeners('test')
    let a = 0
    let b = 0
    const off = set.add(() => a++)
    set.add(() => b++)

    off()
    off() // twice — must not throw or drop the other
    set.notify()

    expect([a, b]).toEqual([0, 1])
  })

  it('clear() drops every listener', () => {
    const set = createListeners('test')
    let calls = 0
    set.add(() => calls++)
    set.add(() => calls++)

    set.clear()
    set.notify()

    expect(calls).toBe(0)
  })
})
