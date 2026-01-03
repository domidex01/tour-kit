import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './content/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // TourKit custom colors using CSS variables
        tk: {
          primary: 'var(--tk-primary)',
          'primary-container': 'var(--tk-primary-container)',
          secondary: 'var(--tk-secondary)',
          tertiary: 'var(--tk-tertiary)',
          'secondary-container': 'color-mix(in srgb, var(--tk-secondary) 20%, transparent)',
          surface: 'var(--tk-surface)',
          'surface-variant': 'var(--tk-surface-variant)',
          container: 'var(--tk-container)',
          'container-dim': 'var(--tk-container-dim)',
          outline: 'var(--tk-outline)',
          'outline-variant': 'var(--tk-outline-variant)',
          error: 'var(--tk-error)',
          success: 'var(--tk-success)',
          warning: 'var(--tk-warning)',
          'on-surface': 'var(--tk-on-surface)',
          'on-surface-variant': 'var(--tk-on-surface-variant)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
}

export default config
