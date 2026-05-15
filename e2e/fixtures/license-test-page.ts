import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const FREE_PACKAGES = ['core', 'react', 'hints'] as const
export const PRO_PACKAGES = [
  'adoption',
  'ai',
  'analytics',
  'announcements',
  'checklists',
  'media-youtube',
  'media-vimeo',
  'media-native',
  'scheduling',
] as const

/** Maps test IDs to npm package names (used in console.error messages) */
export const PRO_PACKAGE_NAMES: Record<(typeof PRO_PACKAGES)[number], string> = {
  adoption: '@tour-kit/adoption',
  ai: '@tour-kit/ai',
  analytics: '@tour-kit/analytics',
  announcements: '@tour-kit/announcements',
  checklists: '@tour-kit/checklists',
  'media-youtube': '@tour-kit/media',
  'media-vimeo': '@tour-kit/media',
  'media-native': '@tour-kit/media',
  scheduling: '@tour-kit/scheduling',
}

/** Unique package names for console error checks (deduplicated) */
export const PRO_CONSOLE_PACKAGES = [
  '@tour-kit/adoption',
  '@tour-kit/ai',
  '@tour-kit/analytics',
  '@tour-kit/announcements',
  '@tour-kit/checklists',
  '@tour-kit/media',
  '@tour-kit/scheduling',
] as const

export class LicenseTestPage {
  constructor(private page: Page) {}

  testBlock(id: string): Locator {
    return this.page.getByTestId(`test-block-${id}`)
  }

  testContent(id: string): Locator {
    return this.page.getByTestId(`test-content-${id}`)
  }

  /**
   * Hard-placeholder locator. Only meaningful when the test app wraps the pro
   * package in `<ProGate>`. The license test apps use `<LicenseGate>` (soft),
   * so prefer {@link watermark} for unlicensed-state assertions.
   */
  placeholder(id: string): Locator {
    return this.testBlock(id).locator('[role="status"][aria-label="License required"]')
  }

  placeholderLink(id: string): Locator {
    return this.placeholder(id).locator('a[href="https://tourkit.dev/pricing"]')
  }

  /** Singleton unlicensed badge layered by `<LicenseGate>`. */
  watermark(): Locator {
    return this.page.locator('[data-tourkit-watermark]')
  }

  async assertWatermarkVisible(): Promise<void> {
    await expect(this.watermark()).toHaveCount(1)
    await expect(this.watermark()).toBeVisible()
  }

  async assertWatermarkHidden(): Promise<void> {
    await expect(this.watermark()).toHaveCount(0)
  }

  async assertAllFreeRender(): Promise<void> {
    for (const id of FREE_PACKAGES) {
      const block = this.testBlock(id)
      await expect(block).toBeVisible()
      // Free packages should NOT show a placeholder
      const ph = this.placeholder(id)
      await expect(ph).toHaveCount(0)
    }
  }

  async assertAllProRender(): Promise<void> {
    for (const id of PRO_PACKAGES) {
      const block = this.testBlock(id)
      await expect(block).toBeVisible()
      // Pro packages should NOT show a placeholder when licensed
      const ph = this.placeholder(id)
      await expect(ph).toHaveCount(0)
    }
  }

  /**
   * Soft-gate unlicensed assertion: pro packages still render their UI and
   * one global watermark badge is layered on top. This is the contract the
   * license test apps actually use (they mount the pro providers directly,
   * relying on `<LicenseGate>` inside each package to layer the watermark).
   */
  async assertAllProSoftRender(): Promise<void> {
    await this.assertAllProRender()
    await this.assertWatermarkVisible()
  }

  async assertAllProGated(): Promise<void> {
    for (const id of PRO_PACKAGES) {
      const ph = this.placeholder(id)
      await expect(ph).toBeVisible()
      await expect(ph).toContainText('Tour Kit Pro license required')
    }
  }
}
