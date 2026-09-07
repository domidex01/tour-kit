/** v2 §1.3b — RED STUB for `computeSpotlight`. */
import type { SpotlightConfig } from '../types'

export interface SpotlightOverlayStyle {
  position: 'fixed'
  inset: 0
  backgroundColor: string
  transition?: string
  pointerEvents: 'auto'
}

export interface SpotlightCutoutStyle {
  position: 'absolute'
  top: number
  left: number
  width: number
  height: number
  borderRadius: number
  boxShadow: string
  transition?: string
  pointerEvents: 'none'
}

export function computeSpotlight(
  _rect: DOMRect | null,
  _config?: SpotlightConfig
): { overlayStyle: SpotlightOverlayStyle; cutoutStyle: SpotlightCutoutStyle | null } {
  throw new Error('computeSpotlight: not implemented')
}
