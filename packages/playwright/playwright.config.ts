import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for `@tour-kit/playwright` smoke E2E.
 *
 * Spins up a Vite dev server serving the three fixture HTML pages
 * (`two-step`, `no-bridge`, `two-step-with-diagnose`). The dev server
 * (not `vite preview`) is used so the workspace `@tour-kit/core` and
 * `@tour-kit/react` sources resolve through pnpm symlinks without
 * requiring a pre-build of the entire monorepo.
 */
export default defineConfig({
  testDir: './__tests__',
  testMatch: /smoke\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  webServer: {
    command: 'pnpm fixtures:serve',
    url: 'http://localhost:5180/two-step.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://localhost:5180',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
