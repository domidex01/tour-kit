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
import type { Storage as TourKitStorage } from '../../../types/config'
import { TourValidationError } from '../../validate-tour'
import { createTourEngine } from '../create-tour-engine'
import type { TourEngine } from '../create-tour-engine'
import { fireCrossTabWrite } from './_helpers/cross-tab'
import { makeEngine } from './_helpers/make-engine'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'
import { stageFlow } from './_helpers/stage-storage'

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

describe('the published storage option takes the documented adapter', () => {
  // A compile-time guard as much as a runtime one. `storage?: Storage` without
  // an explicit import resolves to the DOM `Storage`, which demands `length`,
  // `clear` and `key` — so the 3-method shape the docs tell consumers to
  // implement was a type error against a just-published entry point. If that
  // regresses, this file stops typechecking.
  it('accepts a hand-written 3-method Storage and reads through it', async () => {
    const backing = new Map<string, string>()
    const custom: TourKitStorage = {
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => {
        backing.set(key, value)
      },
      removeItem: (key) => {
        backing.delete(key)
      },
    }

    const engine = createTourEngine({
      tours: [THREE],
      storage: custom,
      persistence: { enabled: true, storage: 'localStorage' },
    })
    live.push(engine)

    await engine.start('t')
    engine.complete()

    // The completion landed in OUR map, not in a DOM storage.
    expect([...backing.values()].join()).toContain('t')
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

describe('boot() is cancellable — v2 §1.3b-0', () => {
  it('destroy() during an in-flight boot leaves the staged flow session alone', async () => {
    // The discriminator is rejecting AFTER destroy(). A `navigate` left pending
    // hangs the await inside runBootStart, so its catch — and the onClear()
    // that wipes the session — is never reached, and the assertion would pass
    // against the very bug it exists to catch.
    let rejectNavigation: (reason: Error) => void = () => {}
    const navigate = vi.fn(
      () =>
        new Promise<boolean | undefined>((_resolve, reject) => {
          rejectNavigation = reject
        })
    )

    const { engine, storage } = engineFor({
      tours: [makeTour('t', [visibleStep('a')])],
      router: {
        getCurrentRoute: () => '/home',
        navigate,
        matchRoute: () => false,
        onRouteChange: () => () => {},
      },
      routePersistence: {
        enabled: true,
        storage: 'sessionStorage',
        flowSession: { storage: 'sessionStorage' },
      },
    })
    stageFlow(storage, { tourId: 't', currentRoute: '/pricing' })

    const booting = engine.boot()
    engine.destroy()
    rejectNavigation(new Error('route 404'))
    await booting

    expect(storage.getItem('tourkit:flow:active')).not.toBeNull()
  })
})

describe('setTours() keeps the tour registry in sync — v2 §1.3b-0', () => {
  const extra = makeTour('extra', [visibleStep('x')])

  it('registers a tour added after construction', () => {
    const { engine } = engineFor({ tours: [THREE] })
    expect(tourRegistry.get('extra')).toBeNull()

    engine.setTours([THREE, extra])

    expect(tourRegistry.get('extra')).not.toBeNull()
  })

  it('unregisters a tour that setTours dropped', () => {
    const { engine } = engineFor({ tours: [THREE, extra] })

    engine.setTours([THREE])

    expect(tourRegistry.get('extra')).toBeNull()
    expect(tourRegistry.get('t')).not.toBeNull()
  })

  it('leaves the running tour registry mirror intact', async () => {
    // Id-diff, not unregister-all-and-re-register: `register()` seeds
    // `isActive: false` and `mirrorToRegistry` writes only on a transition, so
    // re-registering the running tour would zero its mirror until the next one.
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')
    expect(tourRegistry.get('t')?.state.isActive).toBe(true)

    engine.setTours([THREE, extra])

    expect(tourRegistry.get('t')?.state.isActive).toBe(true)
  })

  it('unregisters setTours-added tours on destroy()', () => {
    const { engine } = engineFor({ tours: [THREE] })
    engine.setTours([THREE, extra])

    engine.destroy()

    expect(tourRegistry.get('extra')).toBeNull()
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

/**
 * Issue #121 — the five typed-but-dead step hooks, wired.
 *
 * This is the ORDER ORACLE. `applyTransitionEffects` runs inside the engine's
 * synchronous `dispatch`, and the microtask carrying `onHide`/`onShow` is
 * enqueued there — so the pinned order is only observable through a real
 * engine. An order assertion against `createFakeEngineContext` would be
 * asserting against a `vi.fn`, i.e. against the test's own arrangement.
 */
describe('step lifecycle callbacks — issue #121', () => {
  const callOrder: string[] = []

  /** Records the call and has no opinion — `undefined` ⇒ proceed. */
  const note = (name: string, id: string) => () => {
    callOrder.push(`${name}:${id}`)
    return undefined
  }

  /** Records the call and vetoes — a literal `false` ⇒ do not commit. */
  const veto = (name: string, id: string) => () => {
    callOrder.push(`${name}:${id}`)
    return false as const
  }

  /** Two visible steps with every hook wired. No `waitForTarget` — `visibleStep` hard-codes `target: '#x'`, which never exists here. */
  const hooked = () =>
    makeTour('t', [
      visibleStep('a', {
        onBeforeShow: note('onBeforeShow', 'a'),
        onEnter: note('onEnter', 'a'),
        onShow: note('onShow', 'a'),
        onBeforeHide: note('onBeforeHide', 'a'),
        onHide: note('onHide', 'a'),
      }),
      visibleStep('b', {
        onBeforeShow: note('onBeforeShow', 'b'),
        onEnter: note('onEnter', 'b'),
        onShow: note('onShow', 'b'),
        onBeforeHide: note('onBeforeHide', 'b'),
        onHide: note('onHide', 'b'),
      }),
    ])

  beforeEach(() => {
    callOrder.length = 0
  })

  describe('the pinned order', () => {
    it('next() runs beforeHide → beforeShow → enter → [commit] → hide → show', async () => {
      const { engine } = engineFor({ tours: [hooked()] })
      await engine.start('t')
      callOrder.length = 0 // start() fires its own onBeforeShow/onEnter/onShow for `a`

      await engine.next()

      expect(callOrder).toEqual([
        'onBeforeHide:a',
        'onBeforeShow:b',
        'onEnter:b',
        'onHide:a',
        'onShow:b',
      ])
    })

    it('prev() runs the same order in the other direction', async () => {
      // prevImpl returns early at currentStepIndex <= 0, so start AT 1 rather
      // than start() + next() — the arrange must not run the act's hooks.
      const { engine } = engineFor({ tours: [hooked()] })
      await engine.start('t', 1)
      callOrder.length = 0

      await engine.prev()

      expect(callOrder).toEqual([
        'onBeforeHide:b',
        'onBeforeShow:a',
        'onEnter:a',
        'onHide:b',
        'onShow:a',
      ])
    })

    it('start() runs onBeforeShow → onEnter → [commit] → onShow for the first step', async () => {
      const { engine } = engineFor({ tours: [hooked()] })

      await engine.start('t')

      expect(callOrder).toEqual(['onBeforeShow:a', 'onEnter:a', 'onShow:a'])
    })
  })

  describe('re-entrancy — the reason Group B is deferred', () => {
    it('an onShow that calls next() advances exactly once more and settles', async () => {
      // applyTransitionEffects runs INSIDE dispatch and must not dispatch.
      // Without the queueMicrotask this re-enters the reducer mid-transition.
      // The step needs the engine that is built from it, so the callback
      // reaches it through a holder rather than a forward-declared binding.
      const live: { current: TourEngine | null } = { current: null }
      const tour = makeTour('t', [
        visibleStep('a'),
        visibleStep('b', {
          onShow: () => {
            callOrder.push('onShow:b')
            void live.current?.next()
          },
        }),
        visibleStep('c', { onShow: note('onShow', 'c') }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      live.current = engine

      await engine.start('t')
      await engine.next()
      await vi.waitFor(() => expect(engine.getState().currentStep?.id).toBe('c'))

      expect(engine.getState().isTransitioning).toBe(false)
      expect(callOrder).toEqual(['onShow:b', 'onShow:c'])
    })
  })

  describe('fail-safe — a buggy callback is inert', () => {
    it('a throwing onShow does not reject next() and leaves the tour running', async () => {
      const tour = makeTour('t', [
        visibleStep('a'),
        visibleStep('b', {
          onShow: () => {
            throw new Error('consumer bug')
          },
        }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')

      await expect(engine.next()).resolves.toBeUndefined()
      await Promise.resolve()

      expect(engine.getState().isActive).toBe(true)
      expect(engine.getState().currentStep?.id).toBe('b')
      expect(engine.getState().isTransitioning).toBe(false)
    })

    it('a throwing onBeforeShow is "no opinion", not a veto', async () => {
      // Deliberately unlike evaluateStepWhen (throw ⇒ skip): blocking a
      // transition on a buggy guard is exactly the bricked tour D5 forbids.
      const tour = makeTour('t', [
        visibleStep('a'),
        visibleStep('b', {
          onBeforeShow: () => {
            throw new Error('consumer bug')
          },
        }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')

      await engine.next()

      expect(engine.getState().currentStep?.id).toBe('b')
    })

    it('a falsy non-false return is not a veto', async () => {
      // `undefined`, `null`, `0` and `''` all mean "proceed" — only a literal
      // `false` vetoes.
      const tour = makeTour('t', [
        visibleStep('a', { onBeforeHide: () => undefined }),
        visibleStep('b', { onBeforeShow: () => undefined }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')

      await engine.next()

      expect(engine.getState().currentStepIndex).toBe(1)
    })
  })

  describe('vetoes unwind through the real dispatch', () => {
    it('onBeforeHide false on next() changes nothing', async () => {
      const onStepChange = vi.fn()
      const tour = makeTour(
        't',
        [visibleStep('a', { onBeforeHide: veto('onBeforeHide', 'a') }), visibleStep('b')],
        { onStepChange }
      )
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')
      callOrder.length = 0

      await engine.next()

      expect(engine.getState().currentStepIndex).toBe(0)
      expect(engine.getState().isTransitioning).toBe(false) // the free unwind at actions.ts:174
      expect(onStepChange).not.toHaveBeenCalled()
      expect(callOrder).toEqual(['onBeforeHide:a'])
    })

    it('onBeforeHide false on prev() changes nothing — the reporter’s case', async () => {
      const tour = makeTour('t', [
        visibleStep('a'),
        visibleStep('b', { onBeforeHide: veto('onBeforeHide', 'b') }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t', 1)
      callOrder.length = 0

      await engine.prev()

      expect(engine.getState().currentStepIndex).toBe(1)
      expect(engine.getState().isTransitioning).toBe(false)
    })

    it('onBeforeShow false on goTo() changes nothing', async () => {
      const tour = makeTour('t', [
        visibleStep('a'),
        visibleStep('b'),
        visibleStep('c', { onBeforeShow: veto('onBeforeShow', 'c') }),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')
      callOrder.length = 0

      await engine.goTo(2)

      expect(engine.getState().currentStepIndex).toBe(0)
      expect(engine.getState().isTransitioning).toBe(false)
      expect(callOrder).toEqual(['onBeforeShow:c'])
    })

    it('onBeforeShow false on start() never starts the tour', async () => {
      const tour = makeTour('t', [
        visibleStep('a', { onBeforeShow: veto('onBeforeShow', 'a') }),
        visibleStep('b'),
      ])
      const { engine } = engineFor({ tours: [tour] })

      await engine.start('t')

      expect(engine.getState().isActive).toBe(false)
      expect(callOrder).toEqual(['onBeforeShow:a'])
    })

    it('an async Promise<false> vetoes too — the guard is awaited', async () => {
      const tour = makeTour('t', [
        visibleStep('a', { onBeforeHide: async () => false as const }),
        visibleStep('b'),
      ])
      const { engine } = engineFor({ tours: [tour] })
      await engine.start('t')

      await engine.next()

      expect(engine.getState().currentStepIndex).toBe(0)
    })
  })

  describe('the paths that bypass navigateToStep', () => {
    it('boot restore fires onEnter and onShow, never onBeforeShow', async () => {
      // A flow session only exists when `routePersistence.flowSession` is set.
      const { engine, storage } = engineFor({
        tours: [hooked()],
        routePersistence: {
          enabled: true,
          storage: 'sessionStorage',
          flowSession: { storage: 'sessionStorage' },
        },
      })
      stageFlow(storage, { tourId: 't', stepIndex: 1 }) // no currentRoute ⇒ sync path

      await engine.boot()
      await Promise.resolve()

      expect(engine.getState().currentStep?.id).toBe('b')
      expect(callOrder).toEqual(['onEnter:b', 'onShow:b'])
      expect(callOrder).not.toContain('onBeforeShow:b')
    })

    it('stop() fires onHide for the step that left, and no onShow', async () => {
      const { engine } = engineFor({ tours: [hooked()] })
      await engine.start('t')
      callOrder.length = 0

      engine.stop()
      await Promise.resolve() // stop() is synchronous; Group B is a microtask away

      expect(callOrder).toEqual(['onHide:a'])
    })

    it('next() on the last step completes and fires onHide only', async () => {
      // `next()` at the last step calls completeTour() and returns before any
      // Group A hook (actions.ts:145-148) — correct, there is no incoming
      // step, but a silent asymmetry with stop(). Pinned so nobody "fixes" it.
      const { engine } = engineFor({ tours: [hooked()] })
      await engine.start('t', 1)
      callOrder.length = 0

      await engine.next()
      await Promise.resolve()

      expect(engine.getState().isActive).toBe(false)
      expect(callOrder).toEqual(['onHide:b'])
    })
  })
})

/**
 * v2 §1.4a — the five adapter-A/B divergences, closed in the engine.
 *
 * Each of these is a behaviour `<TourProvider>` has had all along and
 * `createTourEngine` did not. Shipping the §1.4 swap without them would have
 * been a silent regression for every React user, so they land first, on their
 * own PR, with the engine as the only thing under test.
 */
describe('persistence default — v2 §1.4a row 1', () => {
  const ONE = makeTour('t', [visibleStep('a')])

  it('persists a completed tour with NO persistence option at all', async () => {
    // `defaultPersistenceConfig.enabled` is `true` (types/config.ts:195) and
    // the provider has always merged it. The engine read
    // `options.persistence?.enabled ?? false`, so a direct engine consumer
    // silently lost "don't show me this again" across a reload.
    const { engine, storage } = engineFor({ tours: [ONE] })
    await engine.start('t')
    engine.complete()

    // Prefixed by `createTerminalStore` — `tourkit:` + `completed`.
    expect(storage.getItem('tourkit:completed')).toBe(JSON.stringify(['t']))
  })

  it('writes nothing when persistence is explicitly disabled', async () => {
    const { engine, storage } = engineFor({ tours: [ONE], persistence: { enabled: false } })
    await engine.start('t')
    engine.complete()

    expect(storage.getItem('tourkit:completed')).toBeNull()
  })

  it('writes nothing when trackCompleted is off — the gate is an AND of two merged defaults', async () => {
    const { engine, storage } = engineFor({
      tours: [ONE],
      persistence: { enabled: true, trackCompleted: false },
    })
    await engine.start('t')
    engine.complete()

    expect(storage.getItem('tourkit:completed')).toBeNull()
  })
})

describe('setOptions() — v2 §1.4a rows 4', () => {
  const ROUTED = makeTour('t', [visibleStep('a'), visibleStep('b', { route: '/b' })])

  const makeRouter = (current: string) => ({
    getCurrentRoute: () => current,
    navigate: vi.fn(() => undefined),
    matchRoute: (pattern: string) => pattern === current,
    onRouteChange: () => () => {},
  })

  beforeEach(() => {
    // `visibleStep()` hard-codes `target: '#x'`, and a route hop always awaits
    // the target before committing.
    document.body.innerHTML = '<div id="x"></div>'
  })

  it('routes the next cross-route hop through the NEW router', async () => {
    // Every built-in adapter's identity changes after a route change
    // (`createReactRouterAdapter`'s navigate closes over `useNavigate()`), so
    // an engine that froze the router at construction navigates through a dead
    // one for the rest of the tour.
    const router1 = makeRouter('/a')
    const router2 = makeRouter('/a')
    const { engine } = engineFor({ tours: [ROUTED], router: router1 })
    await engine.start('t')

    engine.setOptions({ router: router2 })
    await engine.next()

    expect(router2.navigate).toHaveBeenCalledWith('/b')
    expect(router1.navigate).not.toHaveBeenCalled()
  })

  it('fans out to the NEW analytics sink', async () => {
    const onStepView1 = vi.fn()
    const onStepView2 = vi.fn()
    const { engine } = engineFor({
      tours: [makeTour('t', [visibleStep('a'), visibleStep('b')])],
      analytics: { onStepView: onStepView1 },
    })
    await engine.start('t')
    onStepView1.mockClear()

    engine.setOptions({ analytics: { onStepView: onStepView2 } })
    await engine.next()

    expect(onStepView2).toHaveBeenCalledWith('t', 'b', 1)
    expect(onStepView1).not.toHaveBeenCalled()
  })

  it('honours a live autoNavigate flip', async () => {
    const router = makeRouter('/a')
    const onNavigationRequired = vi.fn()
    const { engine } = engineFor({ tours: [ROUTED], router })
    await engine.start('t')

    engine.setOptions({ autoNavigate: false, onNavigationRequired })
    await engine.next()

    expect(onNavigationRequired).toHaveBeenCalledWith('/b', 'b')
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('is a silent no-op after destroy()', async () => {
    const router2 = makeRouter('/a')
    const { engine } = engineFor({ tours: [ROUTED], router: makeRouter('/a') })
    await engine.start('t')
    const before = engine.getState()

    engine.destroy()

    expect(() => engine.setOptions({ router: router2 })).not.toThrow()
    expect(engine.getState()).toBe(before)
  })
})

describe('boot() defers on an empty tour list — v2 §1.4a row 2', () => {
  const AUTO = makeTour('auto', [visibleStep('a1')], { autoStart: true })

  it('re-arms when setTours() finally supplies tours', async () => {
    // The `MultiTourKitProvider` + declarative `<Tour>` shape: children
    // register AFTER the parent's first effect. The provider has always
    // returned without latching here; the engine latched `ready` in its
    // `finally` and the late tour never started.
    const { engine } = engineFor({ tours: [] })

    await engine.boot()
    expect(engine.getState().isActive).toBe(false)

    engine.setTours([AUTO])
    await vi.waitFor(() => expect(engine.getState().isActive).toBe(true))
    expect(engine.getState().tourId).toBe('auto')
  })

  it('does NOT start anything when setTours() lands on an engine nobody booted', async () => {
    // Without this pair, "auto-boot on every setTours" — a different and wrong
    // behaviour — satisfies the case above. `bootRequested` is closure-private,
    // so the pair is the only way to see it from outside.
    const { engine } = engineFor({ tours: [] })

    engine.setTours([AUTO])
    await Promise.resolve()
    await Promise.resolve()

    expect(engine.getState().isActive).toBe(false)
  })
})

describe('syncTabs re-hydrates from a cross-tab route write — v2 §1.4a row 3', () => {
  const TWO_PLUS = makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])
  const SYNCED = {
    enabled: true,
    storage: 'localStorage',
    key: 'k',
    syncTabs: true,
  } as const

  beforeEach(() => {
    document.body.innerHTML = '<div id="x"></div>'
  })

  it('restores at the step the other tab persisted', async () => {
    const { engine, storage } = engineFor({ tours: [TWO_PLUS], routePersistence: SYNCED })
    await engine.boot()
    expect(engine.getState().isActive).toBe(false)

    fireCrossTabWrite(storage, 'k', { tourId: 't', stepIndex: 2 })

    await vi.waitFor(() => expect(engine.getState().currentStepIndex).toBe(2))
    expect(engine.getState().tourId).toBe('t')
  })

  it('ignores the event after destroy()', async () => {
    const { engine, storage } = engineFor({ tours: [TWO_PLUS], routePersistence: SYNCED })
    await engine.boot()
    engine.destroy()

    fireCrossTabWrite(storage, 'k', { tourId: 't', stepIndex: 2 })
    await Promise.resolve()

    expect(engine.getState().isActive).toBe(false)
  })

  it('never subscribes when syncTabs is off', async () => {
    const { engine, storage } = engineFor({
      tours: [TWO_PLUS],
      routePersistence: { enabled: true, storage: 'localStorage', key: 'k' },
    })
    await engine.boot()

    fireCrossTabWrite(storage, 'k', { tourId: 't', stepIndex: 2 })
    await Promise.resolve()

    expect(engine.getState().isActive).toBe(false)
  })
})

describe('setDontShowAgain() — v2 §1.4a row 5', () => {
  it('exists, does not throw, and does not notify', async () => {
    // `TourActions` has it and `TourEngine` did not, so `pickActions(handle)`
    // in §1.4c could not have type-checked. Still a no-op body by Decision 8 —
    // wiring it is the first post-1.4 item, not part of a swap.
    const { engine } = engineFor({ tours: [THREE] })
    await engine.start('t')
    const listener = vi.fn()
    engine.subscribe(listener)
    const before = engine.getState()

    expect(typeof engine.setDontShowAgain).toBe('function')
    expect(() => engine.setDontShowAgain('t', true)).not.toThrow()

    expect(listener).not.toHaveBeenCalled()
    expect(engine.getState()).toBe(before)
  })
})

describe('flow session parity — v2 §1.4a rows 6 and 7', () => {
  const TWO = makeTour('t', [visibleStep('a'), visibleStep('b')])
  const AUTO = makeTour('auto', [visibleStep('a'), visibleStep('b')], { autoStart: true })
  const FLOW = {
    enabled: true,
    storage: 'localStorage',
    key: 'myapp',
    flowSession: { storage: 'localStorage' },
  } as const

  beforeEach(() => {
    document.body.innerHTML = '<div id="x"></div>'
  })

  it('scopes the flow blob under routePersistence.key, as the provider does', async () => {
    // Row 6, found while writing the binding and not in the plan: the provider
    // builds its flow session with `{ ...flowSession, keyPrefix:
    // routePersistence.key }` (was `tour-provider.tsx:288`); the engine passed
    // the config straight through. A consumer who namespaced their route state
    // with `key` had the in-flight resume blob move to `tourkit:flow:active` —
    // silent data loss for exactly the multi-page tours the key exists for.
    const { engine, storage } = engineFor({ tours: [AUTO], routePersistence: FLOW })

    await engine.boot()
    engine.destroy() // flushes the 200 ms throttled save

    expect(storage.getItem('myapp:flow:active')).not.toBeNull()
    expect(storage.getItem('tourkit:flow:active')).toBeNull()
  })

  it('writes a resume blob for a tour started by hand, not only a booted one', async () => {
    // Row 7, and the sharper of the two. `useFlowSession(state.tourId ?? '')`
    // gave the provider the id REACTIVELY, so any start — a button, a
    // cross-tour branch, `startTour` — enabled the write. The engine called
    // `setTourId` only inside `boot()`, so a tour the user started by clicking
    // wrote nothing and a hard reload resumed nothing. That is the whole
    // feature.
    const { engine, storage } = engineFor({ tours: [TWO], routePersistence: FLOW })

    await engine.start('t')
    engine.destroy()

    expect(storage.getItem('myapp:flow:active')).not.toBeNull()
  })
})

describe('flush() — v2 §1.4b, the synchronous half of a release', () => {
  it('writes the pending throttled flow-session save without destroying the engine', async () => {
    // `save()` is trailing-edge throttled at 200 ms, so the blob on disk lags
    // the tour by up to one step. `destroy()` has always flushed it; the React
    // binding needs the same guarantee WITHOUT the teardown, because a
    // StrictMode remount tears the effect down and re-runs it in one tick and
    // must be able to take the teardown back. An unmount immediately followed
    // by a remount — a fast client-side route change — is the case that
    // breaks when the write lands too late: the new provider boots and reads
    // the previous step.
    const { engine, storage } = engineFor({
      tours: [makeTour('t', [visibleStep('a'), visibleStep('b'), visibleStep('c')])],
      routePersistence: { enabled: true, flowSession: { storage: 'sessionStorage' } },
    })
    document.body.innerHTML = '<div id="x"></div>'
    await engine.start('t')
    await engine.next()

    engine.flush()

    const blob = JSON.parse(storage.getItem('tourkit:flow:active') as string)
    expect(blob.stepIndex).toBe(1)
    // Still live afterwards — that is the whole difference from destroy().
    await engine.next()
    expect(engine.getState().currentStepIndex).toBe(2)
  })

  it('is a no-op after destroy()', () => {
    const { engine } = engineFor({ tours: [THREE] })
    engine.destroy()

    expect(() => engine.flush()).not.toThrow()
  })
})
