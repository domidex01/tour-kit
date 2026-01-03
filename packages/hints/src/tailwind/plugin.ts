import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * TourKit Hints Tailwind CSS Plugin
 *
 * Provides custom animations for hint components.
 *
 * @example
 * // tailwind.config.js
 * import { hintsPlugin } from '@tour-kit/hints/tailwind'
 *
 * export default {
 *   plugins: [hintsPlugin],
 * }
 */
export const hintsPlugin: ReturnType<typeof plugin> = plugin(
  ({ addBase }) => {
    addBase({
      ':root': {
        '--tour-hint-z': '9999',
      },
    })
  },
  {
    theme: {
      extend: {
        keyframes: {
          'tour-pulse': {
            '0%, 100%': {
              opacity: '1',
              boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)',
            },
            '50%': {
              opacity: '1',
              boxShadow: '0 0 0 8px hsl(var(--primary) / 0)',
            },
          },
          'hint-bounce': {
            '0%, 100%': {
              transform: 'translateY(0)',
            },
            '50%': {
              transform: 'translateY(-4px)',
            },
          },
        },
        animation: {
          'tour-pulse': 'tour-pulse 1.5s ease-in-out infinite',
          'hint-bounce': 'hint-bounce 1s ease-in-out infinite',
        },
      },
    },
  } as Partial<Config>
)

export default hintsPlugin
