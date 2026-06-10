import { hintsPlugin } from '@tour-kit/hints/tailwind'
import { mediaPlugin } from '@tour-kit/media/tailwind'
import { tourKitPlugin } from '@tour-kit/react/tailwind'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Consumer-fidelity: scan the INSTALLED packages in node_modules, not the
    // monorepo source. A real npm consumer only has node_modules/@tour-kit/*.
    './node_modules/@tour-kit/react/dist/**/*.js',
    './node_modules/@tour-kit/hints/dist/**/*.js',
    './node_modules/@tour-kit/checklists/dist/**/*.js',
    './node_modules/@tour-kit/adoption/dist/**/*.js',
    './node_modules/@tour-kit/ai/dist/**/*.js',
    './node_modules/@tour-kit/media/dist/**/*.js',
    './node_modules/@tour-kit/announcements/dist/**/*.js',
    './node_modules/@tour-kit/surveys/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  // biome-ignore lint/suspicious/noExplicitAny: Tailwind v3/v4 plugin type compatibility
  plugins: [tourKitPlugin as any, hintsPlugin as any, mediaPlugin as any],
} satisfies Config
