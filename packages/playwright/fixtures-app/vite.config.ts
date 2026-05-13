import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Vite dev server that backs `@tour-kit/playwright`'s smoke E2E.
 *
 * Three entries (one HTML per fixture page) are required by the smoke
 * spec — each mounts `<TourProvider>` with a different combination of
 * `enableTestBridge` and `diagnose` so the spec can prove:
 *   1. the bridge round-trip happy path,
 *   2. the absent-by-default invariant,
 *   3. the diagnose round-trip,
 *   4. the assertBridge() error message.
 *
 * `@tour-kit/core` and `@tour-kit/react` resolve through the pnpm
 * workspace; the Vite default condition selects the ESM `dist/index.js`
 * entries so a `pnpm --filter=<pkg> build` is required before
 * `pnpm --filter @tour-kit/playwright test` (CI runs them in order).
 */
export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  preview: {
    port: 5180,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        'two-step': resolve(__dirname, 'two-step.html'),
        'no-bridge': resolve(__dirname, 'no-bridge.html'),
        'two-step-with-diagnose': resolve(__dirname, 'two-step-with-diagnose.html'),
      },
    },
  },
})
