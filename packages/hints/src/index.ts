// Context
export { HintsContext } from './context/hints-context'
export { HintsProvider } from './context/hints-provider'

// Components (styled by default)
export { Hint, HintHotspot, HintTooltip } from './components'

// Headless components (explicit import)
export * from './components/headless'

// Hooks
export { useHint, useHints } from './hooks'

// Types
export type {
  HintConfig,
  HintsContextValue,
  HintState,
  HotspotPosition,
} from './types'
