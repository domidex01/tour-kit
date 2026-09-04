/**
 * v2 §1.3f — the deliverable that proves the phase.
 *
 * This file imports no React and no @testing-library, and a case at the bottom
 * reads its own source to enforce that. US-1 — "a Node/Vue/Svelte consumer can
 * run a tour with zero React in the module graph" — is the whole point of the
 * work, and a test that quietly pulled in RTL to make one branch case easier
 * would void it silently.
 *
 * The other four things pinned here are traps rather than features:
 * snapshot reference-stability (a fresh object per call is an infinite render
 * loop under useSyncExternalStore), silence on a no-op dispatch, setData
 * notifying even though it is not a reducer action, and destroy() being
 * terminal rather than a pause.
 */
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tourRegistry } from '../../../registry/tour-registry'
import { TourValidationError } from '../../validate-tour'
import type { TourEngine } from '../create-tour-engine'
import { makeEngine } from './_helpers/make-engine'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'

const THREE = makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])

beforeEach(() => {
  tourRegistry.__reset__?.()
})

const live: TourEngine[] = []
function engineFor(...args: Parameters<typeof makeEngine>) {
  const handle = makeEngine(...args)
  live.push(handle.engine)
  return handle
}

afterEach(() => {
  for (const engine of live.splice(0)) engine.destroy()
})

describe('snapshot identity — the useSyncExternalStore contract', () => {
  it('getState() returns the SAME reference with no transition between', () => {
    // `toBe`, not `toEqual`: toEqual passes on a fresh-object-per-call
    // implementation, which is exactly the infinite render loop.
    const { engine } = engineFor({ tours: [THREE] })

    expect(engine.getState()).toBe(engine.getState())
  })

  it('a real transition produces a new reference', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    const before = engine.getState()

    await engine.start('t')

    expect(engine.getState()).not.toBe(before)
  })

  it('the snapshot carries tour and data alongside the state', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')

    const snapshot = engine.getState()
    expect(snapshot.tour?.id).toBe('t')
    expect(snapshot.currentStep?.id).toBe('a')
    expect(snapshot.data).toEqual({})
  })

  it('never leaks the internal tours Map', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')

    expect(engine.getState()).not.toHaveProperty('tours')
  })
})

describe('notification', () => {
  it('notifies every subscriber once per transition', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    const first = vi.fn()
    const second = vi.fn()
    engine.subscribe(first)
    engine.subscribe(second)

    await engine.start('t')

    expect(first).toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(first.mock.calls.length)
  })

  it('a no-op dispatch neither notifies nor changes the snapshot', () => {
    // UPDATE_TOURS with an identity-equal array hits the reducer's fast path
    // and returns the same state object. Nothing downstream should move.
    const { engine } = engineFor({ tours: [THREE] })
    const listener = vi.fn()
    engine.subscribe(listener)
    const before = engine.getState()

    engine.setTours([THREE])

    expect(listener).not.toHaveBeenCalled()
    expect(engine.getState()).toBe(before)
  })

  it('setData rebuilds the snapshot and notifies exactly once', () => {
    // `data` is not a reducer action — it was a separate useState in the
    // provider — so this is the case a Vue binding silently loses if the
    // engine forgets to notify.
    const { engine } = engineFor({ tours: [THREE] })
    const listener = vi.fn()
    engine.subscribe(listener)

    engine.setData('k', 1)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(engine.getState().data).toEqual({ k: 1 })
  })

  it('the unsubscribe returned by subscribe stops delivery', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    const listener = vi.fn()
    engine.subscribe(listener)()

    await engine.start('t')

    expect(listener).not.toHaveBeenCalled()
  })

  it('a throwing subscriber does not take the tour down', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    const healthy = vi.fn()
    engine.subscribe(() => {
      throw new Error('subscriber blew up')
    })
    engine.subscribe(healthy)

    await expect(engine.start('t')).resolves.toBeUndefined()
    expect(healthy).toHaveBeenCalled()
    expect(engine.getState().isActive).toBe(true)
  })
})

describe('validation happens in the factory', () => {
  // `validateTour` guards one rule: a hidden step must declare no UI fields.
  // TS already rejects it on an authored step, so this runtime pass exists for
  // untyped JSON and `as any` boundaries — which is exactly the shape a
  // non-React consumer arrives with.
  const invalid = () =>
    makeTour('bad', [hiddenStep('h', { target: '#x' } as Record<string, unknown>)])

  it('throws TourValidationError synchronously from the constructor', () => {
    // The provider throws this from render; a factory's equivalent moment is
    // construction, not the first boot().
    expect(() => makeEngine({ tours: [invalid()] })).toThrow(TourValidationError)
  })

  it('setTours validates too', () => {
    const { engine } = engineFor({ tours: [THREE] })

    expect(() => engine.setTours([invalid()])).toThrow(TourValidationError)
  })
})

describe('destroy is terminal, not a pause', () => {
  it('is idempotent', () => {
    const { engine } = engineFor({ tours: [THREE] })

    engine.destroy()
    expect(() => engine.destroy()).not.toThrow()
  })

  it('leaves every verb a silent no-op', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')
    const last = engine.getState()
    engine.destroy()

    await expect(engine.next()).resolves.toBeUndefined()
    await expect(engine.boot()).resolves.toBeUndefined()
    expect(() => engine.stop()).not.toThrow()
    expect(() => engine.setData('k', 1)).not.toThrow()
    expect(engine.getState()).toBe(last)
  })

  it('writes no storage after destroy', async () => {
    const { engine, storage } = engineFor({
      tours: [THREE],
      persistence: { enabled: true, storage: 'localStorage' },
      routePersistence: { enabled: true, storage: 'localStorage' },
    })
    await engine.start('t')
    engine.destroy()

    const setItem = vi.spyOn(storage, 'setItem')
    await engine.next()
    engine.complete()

    expect(setItem).not.toHaveBeenCalled()
  })

  it('drops listeners and aborts in-flight work', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    const listener = vi.fn()
    engine.subscribe(listener)
    await engine.start('t')
    listener.mockClear()

    engine.destroy()
    await engine.next()

    expect(listener).not.toHaveBeenCalled()
  })

  it('unregisters from the tour registry', () => {
    const { engine } = engineFor({ tours: [THREE] })
    expect(tourRegistry.get('t')).not.toBeNull()

    engine.destroy()

    expect(tourRegistry.get('t')).toBeNull()
  })
})

describe('headless proof — a branching tour, driven with no React anywhere', () => {
  it('runs a hidden hop through to completion', async () => {
    // a (visible) -> h (hidden, onNext -> 'c') -> b (skipped by the hop) -> c
    const tour = makeTour('flow', [
      visibleStep('a'),
      hiddenStep('h', { onNext: 'c' }),
      visibleStep('b'),
      visibleStep('c'),
    ])
    const { engine } = engineFor({ tours: [tour] })

    await engine.start('flow')
    expect(engine.getState().currentStep?.id).toBe('a')

    // next() walks into the hidden step, fires its lifecycle, and its onNext
    // redirects past 'b' to 'c'.
    await engine.next()
    expect(engine.getState().currentStep?.id).toBe('c')

    await engine.next()
    const final = engine.getState()
    expect(final.isActive).toBe(false)
    expect(final.completedTours).toContain('flow')
  })

  it('skips a when:false step on an ordinary next()', async () => {
    const tour = makeTour('flow', [
      visibleStep('a'),
      visibleStep('b', { when: () => false }),
      visibleStep('c'),
    ])
    const { engine } = engineFor({ tours: [tour] })

    await engine.start('flow')
    await engine.next()

    expect(engine.getState().currentStep?.id).toBe('c')
  })

  it("a visible step's branch respects when: and completes if nothing follows", async () => {
    const tour = makeTour('flow', [
      visibleStep('a', { onNext: 'c' }),
      visibleStep('b'),
      visibleStep('c', { when: () => false }),
    ])
    const { engine } = engineFor({ tours: [tour] })

    await engine.start('flow')
    await engine.next()

    expect(engine.getState().isActive).toBe(false)
    expect(engine.getState().completedTours).toContain('flow')
  })

  it("a HIDDEN step's onNext does NOT respect when: — pinned, not endorsed", async () => {
    // FINDING. handleBranchTargetImpl evaluates `when` on the target and walks
    // on if it is false; the hidden-step walk inside navigateToStepImpl
    // resolves through resolveTargetToIndex and never asks. So the same branch
    // target behaves differently depending on whether the step declaring it is
    // visible or hidden, and a hidden hop can land the tour on a step the
    // author said to hide.
    //
    // Pinned as current behaviour — it predates §1.3 and a refactor is not
    // where it changes. Recorded for §1.4.
    const tour = makeTour('flow', [
      visibleStep('a'),
      hiddenStep('h', { onNext: 'c' }),
      visibleStep('b'),
      visibleStep('c', { when: () => false }),
      visibleStep('d'),
    ])
    const { engine } = engineFor({ tours: [tour] })

    await engine.start('flow')
    await engine.next()

    expect(engine.getState().currentStep?.id).toBe('c')
  })

  it('walks a plain three-step tour forward and back', async () => {
    const { engine } = engineFor({ tours: [THREE] })

    await engine.start('t')
    await engine.next()
    expect(engine.getState().currentStep?.id).toBe('b')

    await engine.prev()
    expect(engine.getState().currentStep?.id).toBe('a')

    await engine.goToStep('c')
    expect(engine.getState().currentStep?.id).toBe('c')
  })

  it('reaches a second tour through startTour', async () => {
    const other = makeTour('other', [visibleStep('o1'), visibleStep('o2')])
    const { engine } = engineFor({ tours: [THREE, other] })

    await engine.start('t')
    await engine.startTour('other', 'o2')

    expect(engine.getState().tourId).toBe('other')
    expect(engine.getState().currentStep?.id).toBe('o2')
  })

  it('skip ends the tour and records it', async () => {
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')

    engine.skip()

    expect(engine.getState().isActive).toBe(false)
    expect(engine.getState().skippedTours).toContain('t')
  })
})

describe('boot', () => {
  it('is a no-op with nothing to restore', async () => {
    const { engine } = engineFor({ tours: [THREE] })

    await engine.boot()

    expect(engine.getState().isActive).toBe(false)
  })

  it('autostarts a tour that asks for it', async () => {
    const auto = makeTour('auto', [visibleStep('a1')], { autoStart: true })
    const { engine } = engineFor({ tours: [auto] })

    await engine.boot()

    expect(engine.getState().tourId).toBe('auto')
  })

  it('is idempotent — a second boot does not restart', async () => {
    const auto = makeTour('auto', [visibleStep('a1'), visibleStep('a2')], { autoStart: true })
    const { engine } = engineFor({ tours: [auto] })

    await engine.boot()
    await engine.next()
    await engine.boot()

    expect(engine.getState().currentStep?.id).toBe('a2')
  })

  it('skips an autostart tour the terminal store says is already completed', async () => {
    const auto = makeTour('auto', [visibleStep('a1')], { autoStart: true })
    const { engine, storage } = (() => {
      const handle = makeEngine({
        tours: [auto],
        persistence: { enabled: true, storage: 'localStorage' },
      })
      live.push(handle.engine)
      return handle
    })()
    storage.setItem('tourkit:completed', JSON.stringify(['auto']))

    await engine.boot()

    expect(engine.getState().isActive).toBe(false)
  })
})

describe('US-1 guard', () => {
  it('this file imports no react and no testing-library', () => {
    // The headless proof is only a proof if the file proving it is itself
    // React-free. Asserted structurally so it cannot rot.
    const source = readFileSync(new URL(import.meta.url), 'utf8')

    expect(source).not.toMatch(/from ['"](react|react-dom|@testing-library)/)
  })
})
