// ============================================
// STYLED COMPONENTS
// ============================================

export { Hint } from './components/hint'
export { HintHotspot } from './components/hint-hotspot'
export { HintTooltip } from './components/hint-tooltip'
export type { HintProps, HintHotspotProps, HintTooltipProps } from './components'

// ============================================
// CONTEXT & PROVIDERS
// ============================================

export { HintsProvider } from './context/hints-provider'
export { HintsContext, useHintsContext } from './context/hints-context'

// ============================================
// UI VARIANTS (for customization)
// ============================================

export {
  hintHotspotVariants,
  hintTooltipVariants,
  hintCloseVariants,
  type HintHotspotVariants,
  type HintTooltipVariants,
  type HintCloseVariants,
} from './components/ui'

// ============================================
// HOOKS
// ============================================

export { useHints } from './hooks/use-hints'
export { useHint } from './hooks/use-hint'

// ============================================
// UTILITIES
// ============================================

export { cn } from '@tour-kit/core'
export { Slot, Slottable, UnifiedSlot, type UnifiedSlotProps } from './lib/slot'

// UI Library Provider (Base UI support)
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from './lib/ui-library-context'

// ============================================
// TYPES
// ============================================

export type {
  HintConfig,
  HintState,
  HotspotPosition,
  HintsContextValue,
  Placement,
} from './types'
