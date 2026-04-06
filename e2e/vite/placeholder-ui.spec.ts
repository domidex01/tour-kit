import { test, expect } from '@playwright/test'
import { LicenseTestPage, PRO_PACKAGES, PRO_PACKAGE_NAMES } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, placeholder UI verification', () => {
  test('placeholder shows correct text, package name, and accessible markup', async ({
    page,
  }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-invalid-key').click()
    await page.waitForTimeout(2000)

    const ltp = new LicenseTestPage(page)

    for (const id of PRO_PACKAGES) {
      const ph = ltp.placeholder(id)
      await expect(ph).toBeVisible()
      await expect(ph).toContainText('Tour Kit Pro license required')

      // Verify package name is shown
      const pkgName = PRO_PACKAGE_NAMES[id]
      await expect(ph).toContainText(pkgName)

      // Verify accessible attributes
      await expect(ph).toHaveAttribute('role', 'status')
      await expect(ph).toHaveAttribute('aria-label', 'License required')

      // Verify pricing link
      const link = ltp.placeholderLink(id)
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link).toContainText('Get a license')
    }
  })
})
