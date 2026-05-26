import type { Config } from 'tailwindcss'
import { mediaPlugin } from './plugin'

/** A Tailwind `safelist` entry: a literal class or an arbitrary-value pattern. */
export type MediaSafelistEntry = string | { pattern: RegExp; variants?: string[] }

/**
 * Safelist entries for `@tour-kit/media`.
 *
 * The fixed aspect-ratio utilities are force-emitted by {@link mediaPlugin}, but
 * runtime-computed `aspect-[w/h]` arbitrary values (e.g. a ratio derived from a
 * video's intrinsic dimensions) cannot be statically extracted by Tailwind's
 * content scanner. Spread this into your `safelist` if you pass dynamic aspect
 * ratios. (Tailwind v4 ignores JS-config `safelist`; use the plugin or
 * `@source inline(...)` there.)
 *
 * @example
 * // tailwind.config.ts (Tailwind v3)
 * import { mediaSafelist } from '@tour-kit/media/tailwind'
 *
 * export default {
 *   safelist: [...mediaSafelist],
 * }
 */
export const mediaSafelist: MediaSafelistEntry[] = [
  'aspect-video',
  'aspect-square',
  // Arbitrary aspect-ratio values like `aspect-[4/3]`, `aspect-[16/10]`, etc.
  { pattern: /^aspect-\[\d+\/\d+\]$/ },
]

/**
 * TourKit Media Tailwind CSS Preset
 *
 * Bundles {@link mediaPlugin} (force-emits the layout utilities embeds depend
 * on, v3 + v4) and {@link mediaSafelist} (protects dynamic `aspect-[w/h]`
 * values on v3). Use this if you want all `@tour-kit/media` Tailwind features
 * in one entry.
 *
 * @example
 * // tailwind.config.ts
 * import { tourKitMediaPreset } from '@tour-kit/media/tailwind'
 *
 * export default {
 *   presets: [tourKitMediaPreset],
 *   // your config...
 * }
 */
export const tourKitMediaPreset: Partial<Config> & { safelist?: MediaSafelistEntry[] } = {
  plugins: [mediaPlugin],
  safelist: mediaSafelist,
}
