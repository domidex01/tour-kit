import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '__tests__/phase-0/**/*.test.ts',
      // Cross-package invariants live one level up and had no runner at all,
      // so `free-package-isolation.test.ts` sat asserting a `react`/`hints`
      // rule that the licence work reversed, with nothing to catch it.
      '../__tests__/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/', 'dist/', '**/*.d.ts'],
      thresholds: {
        statements: 80,
        // Slice 7 coverage-truth: branches restored to canonical 75
        // (dead position.ts engine removed in S0 shrank the uncovered denominator).
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
