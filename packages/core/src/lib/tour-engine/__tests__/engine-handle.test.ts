/**
 * v2 §1.4b — the engine handle.
 *
 * The handle exists for three React facts the engine does not share: child
 * effects run before the parent's, StrictMode double-invokes and discards, and
 * consumers put actions in dependency arrays. Each maps to a case below, and
 * each is checked by COUNTING CONSTRUCTIONS rather than by observing tour
 * state — "built during render" and "built twice" both produce a working tour.
 *
 * No React here, deliberately: the handle is a plain object and belongs to the
 * React-free half of the package.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tourRegistry } from '../../../registry/tour-registry'
import { INITIAL_SNAPSHOT, createEngineHandle } from '../engine-handle'
import type { EngineHandle } from '../engine-handle'
import { countingFactory } from './_helpers/counting-factory'
import { makeTour, visibleStep } from './_helpers/make-tour'

const THREE = makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])

let handle: EngineHandle
let factory: ReturnType<typeof countingFactory>

beforeEach(() => {
  // The engine registers its tours AT CONSTRUCTION, so a leftover 't' from an
  // earlier case would make the post-release() registry assertion false.
  // `__reset__` is undefined in production builds — hence the `?.()`.
  tourRegistry.__reset__?.()
  factory = countingFactory({ tours: [THREE] })
  handle = createEngineHandle(factory)
})

afterEach(async () => {
  handle.release()
  await Promise.resolve()
})

describe('render is inert', () => {
  it('getState() before any verb returns the shared constant and builds nothing', () => {
    expect(handle.getState()).toBe(INITIAL_SNAPSHOT)
    expect(handle.getState()).toBe(handle.getState())
    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('subscribe() before any verb builds nothing', () => {
    handle.subscribe(() => {})

    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('the shared constant is empty and stays empty', () => {
    // Object.freeze does not freeze the Map inside it, and initialTourState's
    // stepVisitCount is a module singleton shared by every provider on the
    // page. If anything ever wrote through the constant, this is where it
    // shows up.
    expect(INITIAL_SNAPSHOT.isActive).toBe(false)
    expect(INITIAL_SNAPSHOT.tour).toBeNull()
    expect(INITIAL_SNAPSHOT.stepVisitCount.size).toBe(0)
  })
})

describe('construction is once, on demand', () => {
  it('the first verb builds exactly one engine', async () => {
    await handle.start('t')

    expect(factory).toHaveBeenCalledTimes(1)
    expect(handle.getState().isActive).toBe(true)
  })

  it('a second verb reuses it', async () => {
    await handle.start('t')
    await handle.next()

    expect(factory).toHaveBeenCalledTimes(1)
    expect(handle.getState().currentStep?.id).toBe('b')
  })

  it('ensure() is the explicit form and is idempotent', () => {
    expect(handle.ensure()).toBe(handle.ensure())
    expect(factory).toHaveBeenCalledTimes(1)
  })
})

describe('release() is deferred by one microtask', () => {
  it('destroys the engine and drops its registry membership', async () => {
    await handle.start('t')
    expect(tourRegistry.get('t')).not.toBeNull()

    handle.release()
    // Not synchronous, and deliberately — see the next case.
    expect(tourRegistry.get('t')).not.toBeNull()
    await Promise.resolve()

    expect(tourRegistry.get('t')).toBeNull()
    expect(factory).toHaveBeenCalledTimes(1)
    expect(handle.getState()).toBe(INITIAL_SNAPSHOT)
  })

  it('a verb in the SAME tick takes the release back', async () => {
    // This is the entire reason the destroy is deferred. React tears an effect
    // down and re-runs it inside one synchronous commit, so release-then-verb
    // in one tick is a StrictMode REMOUNT, not an unmount. Destroying there
    // throws away the engine's state, and the replacement has to boot again —
    // firing onEnter, onStart and the analytics onTourStart a second time,
    // which adapter A never did.
    await handle.start('t')
    const engine = handle.ensure()

    handle.release()
    expect(handle.ensure()).toBe(engine)

    await Promise.resolve()
    expect(factory).toHaveBeenCalledTimes(1)
    expect(handle.getState().isActive).toBe(true)
  })

  it('a verb after the microtask builds a second engine', async () => {
    await handle.start('t')
    handle.release()
    await Promise.resolve()

    await handle.start('t')

    expect(factory).toHaveBeenCalledTimes(2)
    expect(handle.getState().isActive).toBe(true)
  })

  it('the SAME listener, subscribed before any engine existed, fires for both', async () => {
    // `destroy()` calls `listeners.clear()` on the engine's own set, so this
    // only holds if the handle owns the set and re-attaches one fan-out per
    // ensure(). A handle that forwarded subscribe() straight through goes
    // silent here on the second engine — and under StrictMode that is a
    // provider that never re-renders again.
    const calls: number[] = []
    handle.subscribe(() => calls.push(calls.length))

    await handle.start('t')
    const afterFirst = calls.length
    expect(afterFirst).toBeGreaterThan(0)

    handle.release()
    await Promise.resolve()
    await handle.start('t')

    expect(calls.length).toBeGreaterThan(afterFirst)
  })

  it('unsubscribing stops the fan-out across a re-construction', async () => {
    const calls: number[] = []
    const off = handle.subscribe(() => calls.push(calls.length))
    off()

    await handle.start('t')
    handle.release()
    await Promise.resolve()
    await handle.start('t')

    expect(calls).toHaveLength(0)
  })

  it('is idempotent', async () => {
    handle.release()

    expect(() => handle.release()).not.toThrow()
    await Promise.resolve()
    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('a second release() after the destroy landed does not throw', async () => {
    await handle.start('t')
    handle.release()
    await Promise.resolve()

    expect(() => handle.release()).not.toThrow()
    await Promise.resolve()
    expect(handle.getState()).toBe(INITIAL_SNAPSHOT)
  })
})

describe('verb identity is the handle lifetime', () => {
  it('survives release() and re-construction', async () => {
    const before = handle.start
    await handle.start('t')
    handle.release()
    await handle.start('t')

    expect(handle.start).toBe(before)
    expect(handle.next).toBe(handle.next)
  })
})
