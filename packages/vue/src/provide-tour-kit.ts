/**
 * The Vue provider. Mirrors `<TourProvider>` (core, React) verb for verb; what
 * differs is only the lifecycle vocabulary.
 *
 * Two rules the shape depends on, both from `engine-handle.ts`:
 *
 * 1. **Nothing constructs an engine in `setup()`.** Every kit member except
 *    `state` is `ensure()` in disguise — `setOptions` and `setTours` included.
 *    That is why the two watchers below are non-immediate: a `watchEffect`, or
 *    a `watch(..., { immediate: true })`, runs its callback synchronously
 *    inside `setup()`, which on Nuxt means registry writes, four storage
 *    adapters and a `BroadcastChannel` on the server. Watchers do not run
 *    during SSR at all, so a non-immediate `watch` is inert there by
 *    construction.
 * 2. **`release()`, never `destroy()`.** The handle flushes synchronously and
 *    defers its `destroy()` by a microtask, so a teardown immediately followed
 *    by a re-`ensure()` takes the same engine back.
 *
 * @module provide-tour-kit
 */
import {
  type BindingOptions,
  attachAdvanceOn,
  attachKeyboard,
  attachTestBridge,
  engineOptionsFrom,
  liveOptionsFrom,
  validateTour,
} from '@tour-kit/core/engine'
import {
  type InjectionKey,
  type MaybeRefOrGetter,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  toValue,
  watch,
} from 'vue'
import { type TourKit, createTourKit } from './create-tour-kit'

export const TOUR_KIT_KEY: InjectionKey<TourKit> = Symbol('tour-kit')

/**
 * Everything `provideTourKit` accepts.
 *
 * `BindingOptions` is core's — derived from `CreateTourEngineOptions`, so a new
 * engine option arrives here without an edit and a renamed one stops compiling.
 * Re-exported under the binding's own name because that is what a Vue consumer
 * will look for; it is an alias, not a second declaration.
 */
export type TourKitOptions = BindingOptions

/**
 * Provide a tour kit to this component's subtree.
 *
 * Call from `setup()` — or from `<TourProvider>`, which is a two-line wrapper
 * around this. Construction is deferred to the first verb, so `setup()` and the
 * server are untouched.
 */
export function provideTourKit(options: MaybeRefOrGetter<TourKitOptions>): TourKit {
  // Parity with the React provider's render-time check: a misconfigured hidden
  // step should throw where the author is. The engine validates again at
  // construction, which is the real trust boundary.
  for (const tour of toValue(options).tours) validateTour(tour)

  const kit = createTourKit(() => engineOptionsFrom(toValue(options)))
  provide(TOUR_KIT_KEY, kit)

  // NON-immediate, on purpose — see rule 1 in the module header.
  watch(
    () => liveOptionsFrom(toValue(options)),
    (live) => kit.setOptions(live)
  )
  watch(
    () => toValue(options).tours,
    (tours) => kit.setTours(tours)
  )

  const detach: Array<() => void> = []

  onMounted(() => {
    const o = toValue(options)
    // Parity with `tour-provider.tsx`'s post-commit push. Cheap, and not
    // strictly needed — the factory reads `toValue(options)` lazily at
    // `ensure()` time anyway — but it keeps the two bindings identical.
    kit.setOptions(liveOptionsFrom(o))
    void kit.handle.boot()

    if (o.keyboard !== false) {
      detach.push(
        attachKeyboard(kit, typeof o.keyboard === 'object' ? o.keyboard : undefined, {
          isEnabled: () => kit.handle.getState().isActive,
        })
      )
    }
    detach.push(attachAdvanceOn(kit.handle))
    if (o.enableTestBridge) detach.push(attachTestBridge(kit.handle))
  })

  onScopeDispose(() => {
    for (const d of detach) d()
    detach.length = 0
    kit.handle.release()
  })

  return kit
}

/** Read the kit provided by an ancestor. Throws outside one. */
export function useTour(): TourKit {
  const kit = inject(TOUR_KIT_KEY)
  if (!kit) throw new Error('useTour must be used within provideTourKit() or <TourProvider>')
  return kit
}
