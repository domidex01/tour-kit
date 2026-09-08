import { defineConfig } from 'vitest/config'

export default defineConfig({
  // No plugin: the package ships zero `.vue` files (Decision 7), and
  // @vue/test-utils mounts `defineComponent` render functions without one.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
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
