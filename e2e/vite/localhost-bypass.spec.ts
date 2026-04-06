import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Localhost dev bypass', () => {
  for (const scenario of ['licensed', 'invalid-key', 'no-provider', 'empty-key'] as const) {
    test(`all packages render with ${scenario}`, async ({ page }) => {
      await page.goto('/license-test')
      await page.getByTestId(`scenario-selector-${scenario}`).click()
      // Wait for components to mount
      await page.waitForTimeout(1000)

      const ltp = new LicenseTestPage(page)
      await ltp.assertAllFreeRender()
      await ltp.assertAllProRender()
    })
  }
})
