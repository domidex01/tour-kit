import type {
  AudienceProp,
  FrequencyRule,
  HotspotPosition,
  LocalizedText,
  Placement,
} from '@tour-kit/core'
import type { MediaSlotProps } from '@tour-kit/media'
import type * as React from 'react'

// Re-export Placement from core for convenience
export type { Placement }
export type { HotspotPosition }

export interface HintConfig {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  /** Optional title rendered above the tooltip content (Phase 3a). */
  title?: LocalizedText
  /**
   * Tooltip body. Accepts a string (interpolated), a `{ key }` dictionary
   * lookup, or any `ReactNode` for arbitrary JSX. The original
   * `React.ReactNode`-only contract stays assignable.
   */
  content: React.ReactNode | LocalizedText
  position?: HotspotPosition
  tooltipPlacement?: Placement
  pulse?: boolean
  autoShow?: boolean
  persist?: boolean
  /**
   * Filter this hint for users who don't match. Phase 3a addition. Same
   * shape as `Tour.audience` — array (legacy `AudienceCondition[]`) or
   * `{ segment: string }`.
   */
  audience?: AudienceProp
  /**
   * Optional media (video / GIF / Lottie / image) rendered above the tooltip
   * content. Auto-detects the embed provider via URL pattern matching.
   */
  media?: MediaSlotProps
  /**
   * How often this hint can be re-shown. Phase 3a addition. Lifted from
   * `@tour-kit/announcements` to `@tour-kit/core` so hints + announcements
   * share one canonical type.
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
