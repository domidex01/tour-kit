/**
 * @tour-kit/hints/headless
 *
 * Unstyled, logic-only hint components for full customization.
 * Use these when you want complete control over styling.
 */

// Headless components
export * from './components/headless'

// Context and provider
export { HintsProvider } from './context/hints-provider'
export { HintsContext, useHintsContext } from './context/hints-context'

// Hooks
export { useHint } from './hooks/use-hint'
export { useHints } from './hooks/use-hints'

// Types
export * from './types'

// Re-export core hooks and types
export * from '@tour-kit/core'
