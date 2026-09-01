import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.tsx'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Several render-heavy suites (spotlight axe scans, turnkey modals with
    // Floating UI + portals) exceed vitest's 5000ms default on shared CI
    // runners while passing comfortably locally. Raise the package-wide
    // timeout so these a11y/interaction tests are not flaky under load.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/', 'dist/', '**/*.d.ts', '**/index.ts'],
      // Slice 7 coverage-truth floor (raised from the phase-5 lows with wired
      // schedule-$ref / frequency / spotlight-merge / hook / headless + variant
      // render behavior tests). Earned actuals well above these.
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 80,
        lines: 75,
      },
    },
  },
})
