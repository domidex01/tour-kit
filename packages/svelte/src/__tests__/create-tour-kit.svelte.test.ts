/**
 * `.svelte.test.ts` so vite-plugin-svelte compiles the runes: `$derived` and
 * `$effect.root` only exist after that pass.
 *
 * What is under test is the `createSubscriber` bridge — that a `$derived` over
 * `kit.state` re-evaluates on a real transition and NOT on the reducer's
 * identity fast path.
 */
import type { Tour } from '@tour-kit/core/engine'
import { describe, expect, it } from 'vitest'
import { createTourKit } from '../create-tour-kit'
import { countingFactory } from './_helpers/counting-factory'

const tour = (id: string): Tour => ({
  id,
  steps: [
    { id: 's1', target: '#a', content: 'one' },
    { id: 's2', target: '#b', content: 'two' },
  ],
})

describe('createTourKit — the createSubscriber bridge', () => {
  it('constructs no engine until the first verb', () => {
    const factory = countingFactory({ tours: [tour('svelte-inert')] })
    const kit = createTourKit(factory)

    // Reading `state` outside an effect is a plain read: it must not subscribe
    // and must not construct.
    expect(kit.state.isActive).toBe(false)
    expect(factory).toHaveBeenCalledTimes(0)
  })

  it('a $derived over kit.state re-runs on a transition, not on an identity fast path', async () => {
    const factory = countingFactory({ tours: [tour('svelte-derived')] })
    const kit = createTourKit(factory)
    const seen: Array<string | undefined> = []

    const cleanup = $effect.root(() => {
      const stepId = $derived(kit.state.currentStep?.id)
      $effect(() => {
        seen.push(stepId)
      })
    })

    await kit.start('svelte-derived')
    await tick()
    expect(seen[seen.length - 1]).toBe('s1')
    const afterStart = seen.length

    // `prev()` on step 0 hands the same snapshot reference back. The engine
    // does not notify, so nothing re-runs.
    await kit.prev()
    await tick()
    expect(seen.length).toBe(afterStart)

    await kit.next()
    await tick()
    expect(seen[seen.length - 1]).toBe('s2')
    expect(seen.length).toBeGreaterThan(afterStart)

    cleanup()
    kit.handle.release()
  })

  it('spreads the thirteen actions with stable identity, and they are verbs', async () => {
    const factory = countingFactory({ tours: [tour('svelte-actions')] })
    const kit = createTourKit(factory)

    const before = kit.next
    expect(typeof kit.goToStep).toBe('function')
    expect(typeof kit.triggerBranchAction).toBe('function')
    expect(kit.next).toBe(before)
    expect(factory).toHaveBeenCalledTimes(0)

    await kit.start('svelte-actions')
    expect(factory).toHaveBeenCalledTimes(1)

    kit.handle.release()
    await Promise.resolve()
  })

  it('setOptions and setTours are verbs — they construct', () => {
    const factory = countingFactory({ tours: [] })
    const kit = createTourKit(factory)

    kit.setTours([tour('svelte-set')])

    expect(factory).toHaveBeenCalledTimes(1)
    kit.handle.release()
  })
})

/** Let Svelte's effect scheduler flush. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
