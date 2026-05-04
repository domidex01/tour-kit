import type React from 'react'
import type { FrequencyRule } from '../lib/frequency'
import type { LocalizedText } from '../lib/localized-text'
import type { Placement } from './config'
import type { AudienceProp } from './step'

export type HotspotPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

export interface HintConfig {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  /** Optional title rendered above the content (Phase 3a). */
  title?: LocalizedText
  content: React.ReactNode | LocalizedText
  position?: HotspotPosition
  tooltipPlacement?: Placement
  pulse?: boolean
  autoShow?: boolean
  persist?: boolean
  /**
   * Filter this hint for users who don't match. Same shape as `Tour.audience`.
   * Phase 3a addition.
   */
  audience?: AudienceProp
  /**
   * How often this hint can be re-shown. Phase 3a addition. Persisted state
   * lives at `tourkit:hint:freq:<hintId>` via the provider's storage adapter.
   */
  frequency?: FrequencyRule
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
