/**
 * `@tour-kit/svelte` — the Svelte 5 binding over `@tour-kit/core/engine`.
 *
 * The star re-export is deliberate, and identical to `@tour-kit/vue`'s
 * (Decision 3). `/engine` is already the curated React-free public surface, and
 * a binding's job is "that surface plus framework glue". A hand-picked subset
 * would need its own alignment test and would still be wrong the day `/engine`
 * grows. A local named export shadows a star export without error, so nothing
 * below can collide.
 *
 * @module @tour-kit/svelte
 */
export * from '@tour-kit/core/engine'

export { type TourKit, createTourKit } from './create-tour-kit'
export {
  TOUR_KIT_KEY,
  type TourKitOptions,
  getTour,
  provideTourKit,
} from './provide-tour-kit'
export { type Spotlight, createSpotlight } from './create-spotlight'
export { type FocusTrapParams, focusTrap } from './focus-trap'
export {
  type SvelteKitRouterAdapterInput,
  createSvelteKitRouterAdapter,
} from './adapters/sveltekit'
