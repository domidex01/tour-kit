import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Run against live source so tests pick up the latest TourCard without
      // a rebuild step in between. Aligns with how the @tour-kit/react
      // package tests its own source tree.
      '@tour-kit/core': resolve(__dirname, '../core/src'),
      '@tour-kit/react': resolve(__dirname, '../react/src'),
      '@tour-kit/media': resolve(__dirname, '../media/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
})
