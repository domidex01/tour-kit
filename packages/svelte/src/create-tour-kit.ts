/**
 * The reactivity bridge — `createSubscriber` from `svelte/reactivity`.
 *
 * `createSubscriber(start)` returns a `subscribe()`. Calling it inside a getter
 * makes any `$derived`, `$effect` or template expression that reads the getter
 * track it; `start` runs once for the first effect and its cleanup when the last
 * one is destroyed, so a component that never renders tour state never
 * subscribes at all. A plain event handler that reads `kit.state` is not
 * tracked and simply gets the current snapshot — which is exactly right.
 *
 * This is the idiom `MediaQuery` and `SvelteURL` use in `svelte/reactivity`, and
 * it is a plain runtime import: no `.svelte.ts` in the package, so tsup builds
 * it like every other one here. Requires `svelte >= 5.7`.
 *
 * The engine's `getState()` returns the same reference until the next
 * transition, so the reducer's identity fast paths cost nothing.
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
import { createSubscriber } from 'svelte/reactivity'

/** What `provideTourKit` puts in context and `getTour` returns. */
export interface TourKit extends TourActions {
  /** Reactive inside `$derived` / `$effect` / a template; a plain read elsewhere. */
  readonly state: TourCallbackContext
  setOptions: (patch: Partial<TourEngineLiveOptions>) => void
  setTours: EngineHandle['setTours']
  /**
   * @internal — the provider's mount hook and the `attach*` calls need the
   *   handle itself. Consumers use the verbs above.
   */
  handle: EngineHandle
}

/**
 * Build a kit over a lazily-constructed engine.
 *
 * Safe to call from a component `<script>` and on the server: nothing here is a
 * verb, and `createSubscriber`'s `start` is lazy.
 */
export function createTourKit(factory: () => CreateTourEngineOptions): TourKit {
  const handle = createEngineHandle(() => createTourEngine(factory()))
  const subscribe = createSubscriber((update) => handle.subscribe(update))

  return {
    get state() {
      subscribe()
      return handle.getState()
    },
    ...pickActions(handle),
    setOptions: handle.setOptions,
    setTours: handle.setTours,
    handle,
  }
}
