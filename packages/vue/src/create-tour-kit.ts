/**
 * The reactivity bridge — the only Vue this file names is `shallowRef`.
 *
 * Two facts from `@tour-kit/core/engine` shape it:
 *
 * - `createEngineHandle` constructs nothing until the first *verb*. `getState()`
 *   and `subscribe()` never construct, which is what makes `setup()` and the
 *   server safe, and what makes a child's `onMounted(() => tour.start())` — which
 *   fires BEFORE the provider's own mount hook — work anyway.
 * - `getState()` returns the same object reference until the next transition.
 *   `shallowRef` triggers on identity change, so the reducer's identity fast
 *   paths cost nothing here. A deep `ref` would proxy the `stepVisitCount` Map
 *   and the `tour` object, and every downstream `Object.is` would break against
 *   the proxy — that is why this is `shallowRef` and not `ref`.
 *
 * @module create-tour-kit
 */
import {
  type CreateTourEngineOptions,
  type EngineHandle,
  type TourActions,
  type TourCallbackContext,
  type TourEngineLiveOptions,
  createEngineHandle,
  createTourEngine,
  pickActions,
} from '@tour-kit/core/engine'
import { type ShallowRef, shallowRef } from 'vue'

/** What `provideTourKit` provides and `useTour` returns. */
export interface TourKit extends TourActions {
  /** The engine snapshot. Read `state.value` — new identity per transition. */
  state: Readonly<ShallowRef<TourCallbackContext>>
  setOptions: (patch: Partial<TourEngineLiveOptions>) => void
  setTours: EngineHandle['setTours']
  /**
   * @internal — the provider's mount/unmount hooks and the `attach*` calls
   *   need the handle itself. Consumers use the verbs above.
   */
  handle: EngineHandle
}

/**
 * Build a kit over a lazily-constructed engine.
 *
 * Safe to call in `setup()` and on the server: nothing here is a verb.
 */
export function createTourKit(factory: () => CreateTourEngineOptions): TourKit {
  const handle = createEngineHandle(() => createTourEngine(factory()))
  const state = shallowRef(handle.getState())
  // Never unsubscribed on purpose: the handle's listener set outlives
  // `release()` (that is how a released handle can be taken back by the next
  // verb), and the kit dies with the provider scope that owns it.
  handle.subscribe(() => {
    state.value = handle.getState()
  })
  return {
    state,
    ...pickActions(handle),
    setOptions: handle.setOptions,
    setTours: handle.setTours,
    handle,
  }
}
