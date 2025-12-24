import type React from 'react'
import type { Placement } from './config'

export type HotspotPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

export interface HintConfig {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  content: React.ReactNode
  position?: HotspotPosition
  tooltipPlacement?: Placement
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

export interface HintsState {
  hints: Map<string, HintState>
  activeHint: string | null
}

export interface HintsActions {
  registerHint: (id: string) => void
  unregisterHint: (id: string) => void
  showHint: (id: string) => void
  hideHint: (id: string) => void
  dismissHint: (id: string) => void
  resetHint: (id: string) => void
  resetAllHints: () => void
}

export interface HintsContextValue extends HintsState, HintsActions {}
