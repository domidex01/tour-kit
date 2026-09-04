// @vitest-environment node
/**
 * v2 §1.3f — the factory under a real absence of the DOM.
 *
 * A separate file with a `node` environment docblock rather than
 * `vi.stubGlobal('window', undefined)` inside jsdom: stubbing leaves
 * `document`, `Storage` and `BroadcastChannel` alive, so it proves nothing.
 * Here there is genuinely no `window`, which is what a Next.js server render
 * or a Node script actually sees.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTourEngine } from '../create-tour-engine'
import { makeTour, visibleStep } from './_helpers/make-tour'

const TOUR = makeTour('t', [visibleStep('a'), visibleStep('b')])

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SSR construction', () => {
  it('there really is no window here', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('constructs without touching storage, window or BroadcastChannel', () => {
    expect(() => createTourEngine({ tours: [TOUR] })).not.toThrow()
  })

  it('opens NO BroadcastChannel, even with cross-tab enabled', () => {
    // `not.toThrow()` is not enough to prove this and never was: Node 18+
    // ships a global BroadcastChannel, so the constructor happily opened a
    // real one here — and an open channel refs the event loop, which hung any
    // Node process that built an engine and never called destroy().
    const opened: string[] = []
    class CountingChannel {
      constructor(name: string) {
        opened.push(name)
      }
      postMessage() {}
      addEventListener() {}
      removeEventListener() {}
      close() {}
    }
    vi.stubGlobal('BroadcastChannel', CountingChannel)

    createTourEngine({
      tours: [TOUR],
      routePersistence: {
        enabled: true,
        storage: 'localStorage',
        crossTab: { enabled: true },
      },
    })

    expect(opened).toEqual([])
  })

  it('constructs with every persistence option turned on', () => {
    // The adapters each guard for a missing `window` and hand back a working
    // no-op shape; this asserts the factory composes them without a branch of
    // its own.
    expect(() =>
      createTourEngine({
        tours: [TOUR],
        persistence: { enabled: true, storage: 'localStorage' },
        routePersistence: {
          enabled: true,
          storage: 'localStorage',
          flowSession: { storage: 'sessionStorage' },
          crossTab: { enabled: true },
        },
      })
    ).not.toThrow()
  })

  it('reports the idle state before boot', () => {
    const engine = createTourEngine({ tours: [TOUR] })

    const state = engine.getState()
    expect(state.isActive).toBe(false)
    expect(state.tourId).toBeNull()
    expect(state.tour).toBeNull()
    expect(state.currentStep).toBeNull()
  })

  it('boot() resolves to a no-op with nothing persisted', async () => {
    const engine = createTourEngine({
      tours: [TOUR],
      routePersistence: {
        enabled: true,
        storage: 'localStorage',
        flowSession: { storage: 'sessionStorage' },
      },
    })

    await expect(engine.boot()).resolves.toBeUndefined()
    expect(engine.getState().isActive).toBe(false)
  })

  it('still autostarts on the server when a tour asks for it', async () => {
    // Nothing about autostart needs the DOM — the decision is pure and the
    // dispatch is in-memory. A server render that wants the first step
    // rendered into the HTML depends on this.
    const auto = makeTour('auto', [visibleStep('a1')], { autoStart: true })
    const engine = createTourEngine({ tours: [auto] })

    await engine.boot()

    expect(engine.getState().tourId).toBe('auto')
  })

  it('destroy() is safe with nothing to tear down', () => {
    const engine = createTourEngine({ tours: [TOUR] })

    expect(() => engine.destroy()).not.toThrow()
    expect(() => engine.destroy()).not.toThrow()
  })

  it('keeps the snapshot reference-stable here too', () => {
    const engine = createTourEngine({ tours: [TOUR] })

    expect(engine.getState()).toBe(engine.getState())
  })
})
