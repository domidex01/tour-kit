import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The license suite passes 177/177 in isolation but flakes under the full
    // parallel `pnpm -r test` run (next-app dev + Chrome + ~11 packages testing
    // at once) where polar-client fetch mocks and jsdom timers contend for the
    // shared runner. Raise the package-wide timeout so concurrency load can't
    // turn CI intermittently red. Mirrors @tour-kit/announcements.
    testTimeout: 20000,
    hookTimeout: 20000,
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
