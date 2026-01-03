import type { Config } from 'tailwindcss'
import { tourKitPlugin } from './plugin'

/**
 * TourKit Tailwind CSS Preset
 *
 * Includes the plugin and additional configuration for TourKit.
 * Use this if you want all TourKit Tailwind features.
 *
 * @example
 * // tailwind.config.js
 * import { tourKitPreset } from '@tour-kit/react/tailwind'
 *
 * export default {
 *   presets: [tourKitPreset],
 *   // your config...
 * }
 */
export const tourKitPreset: Partial<Config> = {
  plugins: [tourKitPlugin],
  theme: {
    extend: {
      // Additional theme extensions can go here
      zIndex: {
        'tour-overlay': '9998',
        'tour-card': '9999',
      },
    },
  },
}

export default tourKitPreset
