import { defineConfig } from 'vitest/config'

/**
 * Vitest is used in this package ONLY to run the strict-typing gate
 * (`entry-types.test.ts`) — a grep against the built `dist/index.d.ts`
 * verifying the surface contains no `any` types. Playwright tests run
 * via `playwright.config.ts` instead.
 */
export default defineConfig({
  test: {
    include: ['__tests__/entry-types.test.ts'],
    environment: 'node',
  },
})
