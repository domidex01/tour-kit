/**
 * v2 §1.4b — a lazily-constructing facade over one `TourEngine`.
 *
 * React's lifecycle is not the engine's, and three of its rules each kill an
 * otherwise obvious design:
 *
 *  1. **Child effects run before the parent's.** `useEffect(() => start('t'),
 *     [])` in a child is the documented "start on mount" pattern, and it lands
 *     before the provider's own boot effect. An engine created in that effect
 *     would not exist yet.
 *  2. **React 18/19 double-invoke `useState` initialisers and effects under
 *     StrictMode and discard one result.** `createTourEngine` registers every
 *     tour with `tourRegistry` at construction, so building one in render logs
 *     `Tour "t" registered twice` in dev and leaves a dead `WeakRef` behind.
 *     Construction in render is therefore out — which is why 1 cannot simply
 *     be solved by `useState(() => createTourEngine())`.
 *  3. **Action identities must be stable for the provider's lifetime.**
 *     Consumers put them in dependency arrays and the tour registry closes
 *     over them. A remount that swapped in a fresh engine would change all
 *     thirteen.
 *
 * So: nothing is built until the first *verb* or an explicit `ensure()`.
 * `getState()` and `subscribe()` — the only two members render may touch —
 * never construct. The listener set lives on the handle rather than on the
 * engine (whose `destroy()` clears its own), so `release()` can throw an
 * engine away and the next verb re-attaches a single fan-out to its
 * replacement without any subscriber noticing.
 *
 * Exported from `@tour-kit/core/engine` since v2 §1.5: two non-React bindings
 * needed exactly the handle and `pickActions`, and nothing else off this list —
 * the port and the persistence factories stay unexported.
 */
import { initialTourState } from '../../types/state'
import type { TourActions, TourCallbackContext } from '../../types/state'
import type { TourEngine } from './create-tour-engine'

/**
 * The snapshot every binding reads before its first verb — on the server,
 * where no effect ever runs, that is the only snapshot it ever reads.
 *
 * `useSyncExternalStore` compares with `Object.is`, so this has to be one
 * module-level constant rather than a fresh object per call. It is only ever
 * read: the engine builds its own state and never receives this, so sharing it
 * (including the `stepVisitCount` Map inside it) across every provider on the
 * page is safe.
 */
export const INITIAL_SNAPSHOT: TourCallbackContext = Object.freeze({
  ...initialTourState,
  tour: null,
  data: {},
})

/**
 * v3 Phase 1 — the engine-agnostic half of the handle.
 *
 * Lazy `ensure()`, a listener set that outlives any one engine, one fan-out on
 * construction, and a microtask-deferred `release()`. Nothing here knows what a
 * tour is; `createEngineHandle` below is this plus the seventeen tour verbs.
 * `flush` is optional because an engine whose writes are synchronous has
 * nothing to flush.
 */
export interface EngineLike<S> {
  getState: () => S
  subscribe: (listener: () => void) => () => void
  destroy: () => void
  flush?: () => void
}

export interface Handle<E extends EngineLike<S>, S> {
  /** Construct on the first call and return the live engine. Never from render. */
  ensure: () => E
  /** `initial` until the first `ensure()`; then the engine's own snapshot. */
  getState: () => S
  subscribe: (listener: () => void) => () => void
  /** Flush now; destroy one microtask later unless a verb takes it back. Idempotent. */
  release: () => void
}

export function createHandle<E extends EngineLike<S>, S>(
  factory: () => E,
  initial: S
): Handle<E, S> {
  let engine: E | null = null
  let off: (() => void) | null = null
  let pendingRelease = false
  const listeners = new Set<() => void>()

  const fanOut = (): void => {
    for (const listener of listeners) listener()
  }

  const ensure = (): E => {
    // A release scheduled earlier in this same tick was React tearing the
    // effect down before re-running it. Take it back.
    pendingRelease = false
    if (engine) return engine
    engine = factory()
    off = engine.subscribe(fanOut)
    // One fan-out on construction: the snapshot identity just moved from the
    // constant to the engine's, so a store subscriber has to re-read even
    // though the values are equal. That extra render is the price of not
    // constructing during render.
    fanOut()
    return engine
  }

  return {
    ensure,

    getState: () => (engine ? engine.getState() : initial),

    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    /**
     * Deferred by one microtask, and that is the whole StrictMode story.
     *
     * React tears an effect down and re-runs it inside one synchronous commit,
     * so a release followed by an `ensure()` in the same tick is a remount,
     * not an unmount. Destroying eagerly there is a real dev-mode regression,
     * not a cosmetic one: the engine's state dies with it, so the replacement
     * has to boot again and every restore side effect — `onEnter`, `onStart`,
     * the analytics `onTourStart` — fires a second time. Adapter A never had
     * this, because its `bootPhaseRef` and its reducer state both outlived the
     * remount; the engine's do not.
     *
     * A real unmount has nothing to take it back, so the destroy lands on the
     * next microtask: in-flight work aborted, channel closed, registry entries
     * dropped. Anything asserting on that after an `unmount()` needs one
     * `await`.
     *
     * The one thing that cannot wait is a pending throttled write, so
     * `flush()` runs NOW. Core's flow-session save is trailing-edge throttled
     * at 200 ms, and an unmount immediately followed by a remount — a fast
     * client-side route change — would otherwise let the new engine boot and
     * read the step the old one had already left. `flush` is optional on
     * `EngineLike`: an engine whose writes are synchronous has none pending.
     *
     * No fan-out either way: the binding is either leaving or about to re-read.
     */
    release: () => {
      if (!engine || pendingRelease) return
      engine.flush?.()
      pendingRelease = true
      queueMicrotask(() => {
        if (!pendingRelease) return
        pendingRelease = false
        off?.()
        off = null
        engine?.destroy()
        engine = null
      })
    },
  }
}

export interface EngineHandle extends Omit<TourEngine, 'destroy'> {
  /**
   * Construct on the first call and return the live engine.
   *
   * Never call this from render — that is the `registered twice` hazard. The
   * provider's own mount effect is the latest it can happen; a child's verb is
   * the earliest.
   */
  ensure: () => TourEngine
  /** `INITIAL_SNAPSHOT` until the first `ensure()`; then the engine's cached snapshot. */
  getState: () => TourCallbackContext
  /**
   * Stop being the live engine.
   *
   * Pending writes are flushed synchronously; the `destroy()` itself lands one
   * microtask later, so a verb or `ensure()` in the same tick — React tearing
   * an effect down and re-running it — takes the release back and keeps the
   * engine, its state and its completed boot. Subscribers survive either way,
   * so a genuinely new engine re-attaches them. Idempotent.
   */
  release: () => void
}

export function createEngineHandle(factory: () => TourEngine): EngineHandle {
  const h = createHandle<TourEngine, TourCallbackContext>(factory, INITIAL_SNAPSHOT)
  const ensure = h.ensure
  return {
    ...h,

    boot: (...a) => ensure().boot(...a),
    start: (...a) => ensure().start(...a),
    next: (...a) => ensure().next(...a),
    prev: (...a) => ensure().prev(...a),
    goTo: (...a) => ensure().goTo(...a),
    goToStep: (...a) => ensure().goToStep(...a),
    startTour: (...a) => ensure().startTour(...a),
    triggerBranchAction: (...a) => ensure().triggerBranchAction(...a),
    skip: (...a) => ensure().skip(...a),
    complete: (...a) => ensure().complete(...a),
    stop: (...a) => ensure().stop(...a),
    reset: (...a) => ensure().reset(...a),
    setData: (...a) => ensure().setData(...a),
    setTours: (...a) => ensure().setTours(...a),
    setDontShowAgain: (...a) => ensure().setDontShowAgain(...a),
    setOptions: (...a) => ensure().setOptions(...a),
    flush: (...a) => ensure().flush(...a),
  }
}

/**
 * Narrow a handle to exactly the thirteen `TourActions` keys.
 *
 * A binding's context value is `{ ...snapshot, ...pickActions(handle) }`, and
 * without this `setOptions`, `boot`, `ensure`, `release` and `subscribe` would
 * all leak into it. The return type is the contract: if `TourActions` grows a
 * key this stops compiling, which is how `setDontShowAgain` was found missing
 * from `TourEngine` in the first place.
 *
 * Lives here rather than in the React provider — where the §1.4 plan put it —
 * so the claim it makes can be stated in a `.test-d.ts` without exporting a
 * new symbol from `context/`. It is React-free, and v2 §1.5 re-exported it
 * from `@tour-kit/core/engine`: every binding spreads it onto its own kit.
 *
 * Every value is the handle's own closure, so the result is stable for the
 * handle's lifetime and safe to spread into a memoised context value.
 */
export function pickActions(handle: EngineHandle): TourActions {
  return {
    start: handle.start,
    next: handle.next,
    prev: handle.prev,
    goTo: handle.goTo,
    skip: handle.skip,
    complete: handle.complete,
    stop: handle.stop,
    setDontShowAgain: handle.setDontShowAgain,
    reset: handle.reset,
    setData: handle.setData,
    goToStep: handle.goToStep,
    startTour: handle.startTour,
    triggerBranchAction: handle.triggerBranchAction,
  }
}
