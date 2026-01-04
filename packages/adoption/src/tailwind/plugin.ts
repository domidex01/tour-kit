import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * TourKit Adoption Tailwind CSS Plugin
 *
 * Provides custom utilities for adoption components.
 *
 * @example
 * // tailwind.config.js
 * import { adoptionPlugin } from '@tour-kit/adoption/tailwind'
 *
 * export default {
 *   plugins: [adoptionPlugin],
 * }
 */
export const adoptionPlugin: ReturnType<typeof plugin> = plugin(
  ({ addBase }) => {
    addBase({
      ':root': {
        '--tour-adoption-z': '9999',
      },
    })
  },
  {
    theme: {
      extend: {
        zIndex: {
          'adoption-nudge': '9999',
        },
      },
    },
  } as Partial<Config>
)

export default adoptionPlugin
