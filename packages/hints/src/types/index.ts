import type {
  AudienceProp,
  FrequencyRule,
  HintState,
  HotspotPosition,
  LocalizedText,
  Placement,
  TourNode,
} from '@tour-kit/core'
import type { MediaSlotProps } from '@tour-kit/media'
import type * as React from 'react'

// Re-export Placement from core for convenience
export type { Placement }
export type { HotspotPosition }
// Core owns `HintState`, as it owns `HotspotPosition` above. This package
// declared its own byte-identical copy until the v3 Phase 1 review: with the
// engine subpath publishing core's, `@tour-kit/hints` and
// `@tour-kit/hints/engine` were exporting two different declarations under one
// name. Identical today, so it compiled — and the day either grew a field, a
// consumer mixing the two entry points got an inscrutable `Map` variance error.
export type { HintState }

export interface HintConfig {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  /** Optional title rendered above the tooltip content (Phase 3a). */
  title?: LocalizedText
  /**
   * Tooltip body. Accepts a string (interpolated), a `{ key }` dictionary
   * lookup, or any `TourNode` for arbitrary JSX. The original
   * `React.ReactNode`-only contract stays assignable.
   *
   * This type is a near-copy of `@tour-kit/core`'s `HintConfig` (they differ
   * on `target` and `media`); `content` is kept in step with core's so the two
   * published shapes don't drift further. Reconciling them is its own task.
   */
  content: TourNode | LocalizedText
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
