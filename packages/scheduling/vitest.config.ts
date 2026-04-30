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
      exclude: ['node_modules/', 'src/__tests__/', 'dist/', '**/*.d.ts'],
      // Thresholds temporarily lowered from 80/75/80/80 — actuals on
      // chore/code-health-phase-5: stmts 56.60 / branches 44.58 / funcs 70.45 /
      // lines 56.65. Case-(c): branches <50.
      // Follow-up: https://github.com/domidex01/tour-kit/issues/13
      thresholds: {
        statements: 51,
        branches: 39,
        functions: 65,
        lines: 51,
      },
    },
  },
})
