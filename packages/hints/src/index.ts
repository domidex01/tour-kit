// Context
export { HintsContext } from './context/hints-context'
export { HintsProvider } from './context/hints-provider'

// Components (styled by default)
export { Hint, HintHotspot, HintTooltip } from './components'

// Headless components (explicit import)
export * from './components/headless'

// UI variants (for customization)
export * from './components/ui'

// Hooks
export { useHint, useHints } from './hooks'

// Utilities
export { cn } from './lib/utils'
export { Slot, Slottable } from './lib/slot'

// Types
export type {
  HintConfig,
  HintsContextValue,
  HintState,
  HotspotPosition,
} from './types'
