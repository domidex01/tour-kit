import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    // Render-heavy modal suites (CSAT/NPS turnkey modals with Floating UI +
    // portals) flake at vitest's 5000ms default on shared CI runners while
    // passing locally. Raise the package-wide timeout so they aren't flaky
    // under load — same remedy as packages/announcements.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/core/**/*.ts',
        'src/context/**/*.{ts,tsx}',
        'src/hooks/**/*.ts',
        'src/components/**/*.{ts,tsx}',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/types/**', 'src/__tests__/helpers*'],
      // Slice 7 coverage-truth: restored to the canonical 80/75/80/80 with real
      // behavior tests (validation gate, NPS/CSAT/CES scoring, scoring hook,
      // scheduler). Note: skipLogic/visitedPath (Slice 1) remain unimplemented,
      // so this floor is earned from other landed code, not survey branching.
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
