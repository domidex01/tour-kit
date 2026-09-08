import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte({ hot: false })],
  // MANDATORY, not a nicety. Without the browser condition Svelte 5 resolves
  // its server build under vitest and every lifecycle call — `onMount`,
  // `setContext`, `createSubscriber` — throws `lifecycle_function_unavailable`,
  // so the whole provider suite fails at once and reads like a broken binding
  // rather than a config line.
  resolve: { conditions: ['browser'] },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.svelte.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/', 'dist/', '**/*.d.ts', '**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
