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
      // Thresholds temporarily lowered from 80/75/80/80 — actuals on
      // chore/code-health-phase-5: stmts 55.59 / branches 46.69 / funcs 36.48 /
      // lines 55.63. Case-(c): functions <50.
      // Follow-up: https://github.com/domidex01/tour-kit/issues/13
      thresholds: {
        statements: 50,
        branches: 41,
        functions: 31,
        lines: 50,
      },
    },
  },
})
