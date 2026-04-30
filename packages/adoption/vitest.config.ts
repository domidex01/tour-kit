import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'dist/',
        '**/*.d.ts',
        'src/types/',
        'src/index.ts',
        'src/hooks/index.ts',
        'src/components/index.ts',
        'src/components/ui/*.ts',
        'src/components/dashboard/index.ts',
        'src/engine/index.ts',
        'src/storage/index.ts',
        'src/analytics/index.ts',
        'src/lib/',
        'src/tailwind/',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
