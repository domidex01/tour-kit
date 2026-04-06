import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Next.js — Localhost dev bypass', () => {
  const routes = [
    { name: 'valid license', path: '/license-valid' },
    { name: 'invalid key', path: '/license-invalid' },
    { name: 'no provider', path: '/license-none' },
    { name: 'empty key', path: '/license-empty' },
  ]

  for (const { name, path } of routes) {
    test(`all packages render with ${name}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(1000)

      const ltp = new LicenseTestPage(page)
      await ltp.assertAllFreeRender()
      await ltp.assertAllProRender()
    })
  }
})
