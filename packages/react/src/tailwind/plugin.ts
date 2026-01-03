import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * TourKit Tailwind CSS Plugin
 *
 * Provides custom animations and utilities for TourKit components.
 * Compatible with Tailwind CSS v3 and v4.
 *
 * @example
 * // tailwind.config.js
 * import { tourKitPlugin } from '@tour-kit/react/tailwind'
 *
 * export default {
 *   plugins: [tourKitPlugin],
 * }
 */
export const tourKitPlugin: ReturnType<typeof plugin> = plugin(
  ({ addBase, addUtilities }) => {
    // Add CSS custom properties as base styles
    addBase({
      ':root': {
        // Z-index layers
        '--tour-z-overlay': '9998',
        '--tour-z-card': '9999',

        // Animation durations (respects prefers-reduced-motion via Tailwind)
        '--tour-duration-fast': '150ms',
        '--tour-duration-normal': '200ms',
        '--tour-duration-slow': '300ms',
      },
    })

    // Add custom utilities
    addUtilities({
      '.tour-spotlight-cutout': {
        'box-shadow': '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      },
      '.tour-spotlight-cutout-light': {
        'box-shadow': '0 0 0 9999px rgba(0, 0, 0, 0.3)',
      },
      '.tour-spotlight-cutout-dark': {
        'box-shadow': '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      },
    })
  },
  {
    // Extend Tailwind theme
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
          'tour-spotlight-in': {
            from: {
              opacity: '0',
            },
            to: {
              opacity: '1',
            },
          },
          'tour-card-in': {
            from: {
              opacity: '0',
              transform: 'scale(0.95)',
            },
            to: {
              opacity: '1',
              transform: 'scale(1)',
            },
          },
        },
        animation: {
          'tour-pulse': 'tour-pulse 1.5s ease-in-out infinite',
          'tour-spotlight-in': 'tour-spotlight-in var(--tour-duration-normal) ease-out',
          'tour-card-in': 'tour-card-in var(--tour-duration-normal) ease-out',
        },
      },
    },
  } as Partial<Config>
)

export default tourKitPlugin
