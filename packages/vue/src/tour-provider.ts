/**
 * `<TourProvider>` for Vue — a two-line wrapper over `provideTourKit`.
 *
 * A render function, not an SFC: a package that ships `.vue` files has to be
 * published as source for the consumer's compiler to process, and this package
 * is built by tsup like every other one here (Decision 7).
 *
 * @module tour-provider
 */
import type { Tour } from '@tour-kit/core/engine'
import { type PropType, defineComponent } from 'vue'
import { type TourKitOptions, provideTourKit } from './provide-tour-kit'

export const TourProvider = defineComponent({
  name: 'TourProvider',
  props: {
    tours: { type: Array as PropType<TourKitOptions['tours']>, required: true },
    router: { type: Object as PropType<TourKitOptions['router']>, default: undefined },
    routePersistence: {
      type: Object as PropType<TourKitOptions['routePersistence']>,
      default: undefined,
    },
    persistence: { type: Object as PropType<TourKitOptions['persistence']>, default: undefined },
    autoNavigate: { type: Boolean, default: undefined },
    analytics: { type: Object as PropType<TourKitOptions['analytics']>, default: undefined },
    onNavigationRequired: {
      type: Function as PropType<TourKitOptions['onNavigationRequired']>,
      default: undefined,
    },
    onStepError: { type: Function as PropType<TourKitOptions['onStepError']>, default: undefined },
    onTourPaused: {
      type: Function as PropType<TourKitOptions['onTourPaused']>,
      default: undefined,
    },
    keyboard: { type: [Boolean, Object] as PropType<TourKitOptions['keyboard']>, default: true },
    enableTestBridge: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // `props` is a reactive object, so the getter is all the reactivity the
    // non-immediate watchers in `provideTourKit` need.
    provideTourKit(() => props as TourKitOptions & { tours: Tour[] })
    return () => slots.default?.()
  },
})
