import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: /(manual-qa-phase-8|debug-production-host)\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3000',
  },
})
