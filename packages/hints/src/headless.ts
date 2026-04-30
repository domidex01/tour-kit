/**
 * Headless components for @tour-kit/hints
 *
 * These components provide all the logic without any styling.
 * Use them when you want full control over the UI.
 *
 * @example
 * import { HintHeadless } from '@tour-kit/hints/headless'
 *
 * function CustomHint({ id, target }) {
 *   return (
 *     <HintHeadless
 *       id={id}
 *       target={target}
 *       render={({ isOpen, show, hide, targetRect }) => (
 *         <>
 *           <button
 *             onClick={isOpen ? hide : show}
 *             style={{ position: 'fixed', top: targetRect.top, left: targetRect.right }}
 *           >
 *             ?
 *           </button>
 *           {isOpen && <div>Custom tooltip content</div>}
 *         </>
 *       )}
 *     />
 *   )
 * }
 */

export {
  HintHeadless,
  type HintHeadlessProps,
  type HintHeadlessRenderProps,
} from './components/headless/hint'

export {
  HintHotspotHeadless,
  type HintHotspotHeadlessProps,
  type HintHotspotRenderProps,
} from './components/headless/hint-hotspot'

export {
  HintTooltipHeadless,
  type HintTooltipHeadlessProps,
  type HintTooltipRenderProps,
} from './components/headless/hint-tooltip'

// Re-export utilities
export { cn } from '@tour-kit/core'
export { Slot, Slottable } from './lib/slot'
