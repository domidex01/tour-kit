import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  projects: [
    {
      name: 'next-localhost',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: /next\/.*localhost/,
    },
    // v2 §1.5 — the two non-React bindings. Both examples run the same
    // three-step tour, so both lanes run the same eight cases.
    {
      name: 'vue-localhost',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5175',
      },
      testMatch: /vue\/.*localhost/,
    },
    {
      name: 'svelte-localhost',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5176',
      },
      testMatch: /svelte\/.*localhost/,
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter next-tour-kit-demo dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter vue-tour-kit-demo dev',
      port: 5175,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter svelte-tour-kit-demo dev',
      port: 5176,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
