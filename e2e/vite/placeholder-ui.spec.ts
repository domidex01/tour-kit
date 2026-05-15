import { expect, test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, watermark UI verification', () => {
  test('renders a single accessible watermark with correct text and CTA link', async ({ page }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-invalid-key').click()
    await page.waitForTimeout(2000)

    const ltp = new LicenseTestPage(page)
    const watermark = ltp.watermark()

    // Singleton: exactly one badge regardless of how many pro packages mount.
    await expect(watermark).toHaveCount(1)
    await expect(watermark).toBeVisible()

    // Content matches the soft-gate badge copy.
    await expect(watermark).toContainText('Tour Kit')
    await expect(watermark).toContainText('Unlicensed')
    await expect(watermark).toContainText('Buy license')

    // Accessible region with a meaningful name.
    await expect(watermark).toHaveAttribute('role', 'region')
    await expect(watermark).toHaveAttribute('aria-label', 'Tour Kit license required')

    // Pricing link opens in a new tab with UTM tagging.
    const link = watermark.locator('a')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    const href = await link.getAttribute('href')
    expect(href).toContain('usertourkit.com/pricing')
    expect(href).toContain('utm_source=unlicensed_badge')
    expect(href).toContain('utm_campaign=watermark')
  })
})
