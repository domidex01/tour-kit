import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/', 'dist/', '**/*.d.ts', '**/index.ts'],
      // Slice 7 coverage-truth floor (raised from the phase-5 lows with
      // URL-parse / responsive / embed-builder + embed-component behavior tests;
      // no S1-5 feature touched media — pure test-debt repayment).
      // Earned actuals well above these; see CLAUDE.md coverage claim.
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
})
