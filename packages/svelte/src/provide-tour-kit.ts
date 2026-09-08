/**
 * The Svelte provider. Same three rules as the Vue one, different vocabulary.
 *
 * - `setContext` must run during component initialisation, and a `<script>` IS
 *   initialisation, so calling `provideTourKit` there satisfies it by
 *   construction.
 * - `onMount` does not run on the server, and the function it returns runs on
 *   unmount. `onDestroy` is the one lifecycle hook that ALSO runs inside a
 *   server-rendered component, which is why the teardown hangs off `onMount`.
 * - Options are read ONCE, because a `<script>` runs once. `setOptions` and
 *   `setTours` are exposed as the escape hatch — there is no Vue-style watcher
 *   to write here, and inventing reactivity the framework does not have would
 *   be the wrong shape.
 *
 * @module provide-tour-kit
 */
import {
  type BindingOptions,
  attachAdvanceOn,
  attachKeyboard,
  attachTestBridge,
  engineOptionsFrom,
  validateTour,
} from '@tour-kit/core/engine'
import { getContext, onMount, setContext } from 'svelte'
import { type TourKit, createTourKit } from './create-tour-kit'

export const TOUR_KIT_KEY: symbol = Symbol('tour-kit')

/**
 * Everything `provideTourKit` accepts.
 *
 * `BindingOptions` is core's — derived from `CreateTourEngineOptions`, so a new
 * engine option arrives here without an edit and a renamed one stops compiling.
 * Re-exported under the binding's own name because that is what a Svelte
 * consumer will look for; it is an alias, not a second declaration.
 */
export type TourKitOptions = BindingOptions

/**
 * Provide a tour kit to this component's subtree.
 *
 * Call from a component `<script>` — typically `+layout.svelte`. Construction is
 * deferred to the first verb, so SvelteKit's server render is untouched.
 */
export function provideTourKit(options: TourKitOptions): TourKit {
  // Parity with the React provider's render-time check: a misconfigured hidden
  // step should throw where the author is. The engine validates again at
  // construction, which is the real trust boundary.
  for (const tour of options.tours) validateTour(tour)

  const kit = createTourKit(() => engineOptionsFrom(options))
  setContext(TOUR_KIT_KEY, kit)

  onMount(() => {
    void kit.handle.boot()

    const detach: Array<() => void> = []
    if (options.keyboard !== false) {
      detach.push(
        attachKeyboard(kit, typeof options.keyboard === 'object' ? options.keyboard : undefined, {
          isEnabled: () => kit.handle.getState().isActive,
        })
      )
    }
    detach.push(attachAdvanceOn(kit.handle))
    if (options.enableTestBridge) detach.push(attachTestBridge(kit.handle))

    return () => {
      for (const d of detach) d()
      kit.handle.release()
    }
  })

  return kit
}

/** Read the kit provided by an ancestor. Throws outside one. */
export function getTour(): TourKit {
  const kit = getContext<TourKit | undefined>(TOUR_KIT_KEY)
  if (!kit) throw new Error('getTour() must be called in a component below provideTourKit()')
  return kit
}
