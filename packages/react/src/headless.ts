/**
 * Headless components for @tour-kit/react
 *
 * These components provide all the logic without any styling.
 * Use them when you want full control over the UI.
 *
 * @example
 * import { TourCardHeadless } from '@tour-kit/react/headless'
 *
 * function CustomTourCard() {
 *   return (
 *     <TourCardHeadless
 *       render={({ currentStep, next, prev, floatingStyles }) => (
 *         <div style={floatingStyles}>
 *           <h2>{currentStep?.title}</h2>
 *           <button onClick={prev}>Back</button>
 *           <button onClick={next}>Next</button>
 *         </div>
 *       )}
 *     />
 *   )
 * }
 */

export {
  TourCardHeadless,
  type TourCardHeadlessProps,
  type TourCardRenderProps,
} from './components/headless/tour-card'

export {
  TourCloseHeadless,
  type TourCloseHeadlessProps,
} from './components/headless/tour-close'

export {
  TourNavigationHeadless,
  type TourNavigationHeadlessProps,
  type TourNavigationRenderProps,
} from './components/headless/tour-navigation'

export {
  TourOverlayHeadless,
  type TourOverlayHeadlessProps,
  type TourOverlayRenderProps,
} from './components/headless/tour-overlay'

export {
  TourProgressHeadless,
  type TourProgressHeadlessProps,
  type TourProgressRenderProps,
} from './components/headless/tour-progress'

// Re-export utilities that are useful for headless components
export { cn } from './lib/utils'
export { Slot, Slottable } from './lib/slot'
