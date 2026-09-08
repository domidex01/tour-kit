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
 * Not exported from `@tour-kit/core/engine`: §1.5 names what a binding needs,
 * and the handle joins the port and the persistence factories on that list.
 */
import { initialTourState } from '../../types/state'
import type { TourCallbackContext } from '../../types/state'
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
   * `destroy()` the current engine, if any, and forget it. Subscribers
   * survive, so the next verb builds a replacement and re-attaches them.
   * Idempotent.
   */
  release: () => void
}

export function createEngineHandle(factory: () => TourEngine): EngineHandle {
  let engine: TourEngine | null = null
  let off: (() => void) | null = null
  const listeners = new Set<() => void>()

  const fanOut = (): void => {
    for (const listener of listeners) listener()
  }

  const ensure = (): TourEngine => {
    if (engine) return engine
    engine = factory()
    off = engine.subscribe(fanOut)
    // One fan-out on construction: the snapshot identity just moved from the
    // module constant to the engine's, so `useSyncExternalStore` has to
    // re-read even though the values are equal. That extra render is the price
    // of not constructing during render.
    fanOut()
    return engine
  }

  return {
    ensure,

    getState: () => engine?.getState() ?? INITIAL_SNAPSHOT,

    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    release: () => {
      off?.()
      off = null
      engine?.destroy()
      engine = null
      // No fan-out: after a release the binding is either unmounting or about
      // to `ensure()` again, and both re-read on their own.
    },

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
  }
}
