import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
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
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
