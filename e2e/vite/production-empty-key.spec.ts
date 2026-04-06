import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, empty key', () => {
  test('free packages render, pro packages show placeholder', async ({ page }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-empty-key').click()
    await page.waitForTimeout(2000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProGated()
  })
})
