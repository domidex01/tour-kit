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
  type KeyboardConfig,
  type MultiPagePersistenceConfig,
  type PersistenceConfig,
  type RouterAdapter,
  type Tour,
  type TourEngineAnalytics,
  type TourRouteError,
  attachAdvanceOn,
  attachKeyboard,
  attachTestBridge,
  validateTour,
} from '@tour-kit/core/engine'
import { getContext, onMount, setContext } from 'svelte'
import { type TourKit, createTourKit } from './create-tour-kit'

export const TOUR_KIT_KEY: symbol = Symbol('tour-kit')

/** Everything `provideTourKit` accepts. Mirrors the Vue binding's bag exactly. */
export interface TourKitOptions {
  tours: Tour[]
  router?: RouterAdapter
  routePersistence?: MultiPagePersistenceConfig
  persistence?: PersistenceConfig
  autoNavigate?: boolean
  analytics?: TourEngineAnalytics
  onNavigationRequired?: (route: string, stepId: string) => void
  onStepError?: (err: TourRouteError) => void
  onTourPaused?: (tourId: string, reason: 'cross-tab') => void
  /**
   * `false` disables keyboard navigation; an object customises it. Default: on.
   *
   * A headless consumer renders their own card, so the binding wires the keys
   * or nobody does.
   */
  keyboard?: boolean | KeyboardConfig
  /** Dev-only `window.__tourKit__`. Default `false`. */
  enableTestBridge?: boolean
}

function optionsFrom(src: TourKitOptions) {
  return {
    tours: src.tours,
    router: src.router,
    routePersistence: src.routePersistence,
    persistence: src.persistence,
    autoNavigate: src.autoNavigate,
    analytics: src.analytics,
    onNavigationRequired: src.onNavigationRequired,
    onStepError: src.onStepError,
    onTourPaused: src.onTourPaused,
  }
}

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

  const kit = createTourKit(() => optionsFrom(options))
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
