import type * as React from 'react'

// Re-export Placement from core for convenience
export type { Placement } from '@tour-kit/core'

export type HotspotPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

export interface HintConfig {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  content: React.ReactNode
  position?: HotspotPosition
  tooltipPlacement?: import('@tour-kit/core').Placement
  pulse?: boolean
  autoShow?: boolean
  persist?: boolean
  onClick?: () => void
  onShow?: () => void
  onDismiss?: () => void
}

export interface HintState {
  id: string
  isOpen: boolean
  isDismissed: boolean
}

export interface HintsContextValue {
  hints: Map<string, HintState>
  activeHint: string | null
  registerHint: (id: string) => void
  unregisterHint: (id: string) => void
  showHint: (id: string) => void
  hideHint: (id: string) => void
  dismissHint: (id: string) => void
  resetHint: (id: string) => void
  resetAllHints: () => void
}
