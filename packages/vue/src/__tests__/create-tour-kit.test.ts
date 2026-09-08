/**
 * The reactivity bridge: one `state.value` write per real transition, none for
 * the reducer's identity fast paths, and zero engines built before a verb.
 */
import type { Tour } from '@tour-kit/core/engine'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, watch } from 'vue'
import { createTourKit } from '../create-tour-kit'
import { countingFactory } from './_helpers/counting-factory'

const tour = (id: string): Tour => ({
  id,
  steps: [
    { id: 's1', target: '#a', content: 'one' },
    { id: 's2', target: '#b', content: 'two' },
  ],
})

describe('createTourKit', () => {
  it('constructs no engine until the first verb', () => {
    const factory = countingFactory({ tours: [tour('kit-inert')] })
    const kit = createTourKit(factory)

    // The two members a render may touch.
    expect(kit.state.value.isActive).toBe(false)
    kit.state.value.currentStep
    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('a verb constructs exactly one engine, and later verbs reuse it', async () => {
    const factory = countingFactory({ tours: [tour('kit-one')] })
    const kit = createTourKit(factory)

    await kit.start('kit-one')
    await kit.next()

    expect(factory).toHaveBeenCalledTimes(1)
    kit.handle.release()
  })

  it('writes state.value on a real transition and NOT on an identity fast path', async () => {
    const factory = countingFactory({ tours: [tour('kit-identity')] })
    const kit = createTourKit(factory)
    const scope = effectScope()
    const seen: Array<string | undefined> = []

    scope.run(() => {
      watch(kit.state, (s) => seen.push(s.currentStep?.id), { flush: 'sync' })
    })

    await kit.start('kit-identity')
    const afterStart = seen.length
    expect(seen[seen.length - 1]).toBe('s1')

    // THE discriminating half. `prev()` on step 0 is the reducer's identity
    // fast path: it hands the same snapshot reference back, so a `shallowRef`
    // must not fire and a `ref` (deep, proxied) would.
    await kit.prev()
    expect(seen.length).toBe(afterStart)

    // A real transition does fire. Not asserted as exactly one write: the
    // engine notifies on `isTransitioning` too, so a step change is several
    // notifies with the last one carrying the new step. The bridge's job is to
    // mirror each notify, which is what this checks.
    await kit.next()
    expect(seen[seen.length - 1]).toBe('s2')
    expect(seen.length).toBeGreaterThan(afterStart)

    scope.stop()
    kit.handle.release()
  })

  it('spreads the thirteen actions with stable identity', () => {
    const factory = countingFactory({ tours: [tour('kit-stable')] })
    const kit = createTourKit(factory)

    const before = kit.next
    expect(typeof kit.goToStep).toBe('function')
    expect(typeof kit.triggerBranchAction).toBe('function')
    expect(typeof kit.setDontShowAgain).toBe('function')
    expect(kit.next).toBe(before)
    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('setOptions and setTours are verbs — they construct', () => {
    const factory = countingFactory({ tours: [] })
    const kit = createTourKit(factory)

    kit.setTours([tour('kit-set')])

    expect(factory).toHaveBeenCalledTimes(1)
    kit.handle.release()
  })

  it('release() then a verb takes the same engine back', async () => {
    const factory = countingFactory({ tours: [tour('kit-release')] })
    const kit = createTourKit(factory)

    await kit.start('kit-release')
    kit.handle.release()
    // Same tick: the handle's destroy is deferred by one microtask.
    await kit.next()

    expect(factory).toHaveBeenCalledTimes(1)
    kit.handle.release()
    await Promise.resolve()
  })

  it('a released handle reports the initial snapshot again after its destroy lands', async () => {
    const factory = countingFactory({ tours: [tour('kit-destroyed')] })
    const kit = createTourKit(factory)

    await kit.start('kit-destroyed')
    expect(kit.state.value.isActive).toBe(true)

    kit.handle.release()
    await Promise.resolve()
    await Promise.resolve()

    expect(kit.handle.getState().isActive).toBe(false)
    expect(vi.isMockFunction(factory)).toBe(true)
  })
})
