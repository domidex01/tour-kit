/**
 * v2 §1.3b-3 — the two spotlight style shapes must assign to
 * `React.CSSProperties` without a cast, so `UseSpotlightReturn` can keep
 * declaring `React.CSSProperties` while the factory that builds them never
 * names React.
 *
 * This lives under `__tests__/types/` because core's vitest config has no
 * `typecheck` block — an `expectTypeOf` inside a `.test.ts` would run as a
 * silent no-op. `pnpm typecheck:types` compiles this file; vitest's include
 * glob never matches `*.test-d.ts`.
 */
import type { CSSProperties } from 'react'
import type { SpotlightCutoutStyle, SpotlightOverlayStyle } from '../../lib/spotlight'

declare const overlay: SpotlightOverlayStyle
declare const cutout: SpotlightCutoutStyle

export const overlayAsCss: CSSProperties = overlay
export const cutoutAsCss: CSSProperties = cutout
