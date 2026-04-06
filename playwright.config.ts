import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  projects: [
    // Localhost tests — dev bypass active, all packages render
    {
      name: 'vite-localhost',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
      testMatch: /vite\/.*localhost/,
    },
    {
      name: 'next-localhost',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: /next\/.*localhost/,
    },
    // Production domain tests — gate active
    // Requires: 127.0.0.1 tourkit-test.dev in /etc/hosts
    {
      name: 'vite-production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://tourkit-test.dev:5173',
      },
      testMatch: /vite\/.*production/,
    },
    {
      name: 'next-production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://tourkit-test.dev:3000',
      },
      testMatch: /next\/.*production/,
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter vite-tour-kit-demo dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter next-tour-kit-demo dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
