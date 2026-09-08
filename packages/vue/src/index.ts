/**
 * `@tour-kit/vue` — the Vue 3 binding over `@tour-kit/core/engine`.
 *
 * The star re-export is deliberate (Decision 3). `/engine` is already the
 * curated React-free public surface — every line of it is a decision — and a
 * binding's job is "that surface plus framework glue". A hand-picked subset
 * would need its own alignment test and would still be wrong the day `/engine`
 * grows. Adding to `/engine` is never breaking; removing from it is already
 * breaking for every consumer. A local named export shadows a star export
 * without error, so nothing below can collide.
 *
 * @module @tour-kit/vue
 */
export * from '@tour-kit/core/engine'

export { type TourKit, createTourKit } from './create-tour-kit'
export {
  TOUR_KIT_KEY,
  type TourKitOptions,
  provideTourKit,
  useTour,
} from './provide-tour-kit'
export { TourProvider } from './tour-provider'
export { type UseSpotlightReturn, useSpotlight } from './use-spotlight'
export { type UseFocusTrapReturn, useFocusTrap } from './use-focus-trap'
export { type VueRouterLike, createVueRouterAdapter } from './adapters/vue-router'
