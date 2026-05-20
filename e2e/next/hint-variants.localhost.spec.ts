import { expect, test } from '@playwright/test'

/**
 * Phase 3 — Hint preset visual regression.
 *
 * Six snapshots: three variants × two themes. The fixture route lives at
 * `/hint-variants` in `examples/next-app`; each cell carries a stable
 * `data-testid` and anchors the hotspot off a fixed 100×40 box so the
 * resolved position is deterministic.
 */

const VARIANTS = ['badge', 'beacon-with-label', 'whats-new-pill'] as const
const THEMES = ['light', 'dark'] as const

test.describe('Phase 3 — hint variants visual regression', () => {
  for (const variant of VARIANTS) {
    for (const theme of THEMES) {
      const testId = `${variant}-${theme}`
      const snapshotName = `${testId}.png`

      test(`${variant} on ${theme} background`, async ({ page }) => {
        await page.goto('/hint-variants')
        const cell = page.getByTestId(testId)
        await cell.waitFor({ state: 'visible' })
        await expect(cell).toHaveScreenshot(snapshotName)
      })
    }
  }

  test('badge hit-target is at least 24×24 px', async ({ page }) => {
    await page.goto('/hint-variants')
    const cell = page.getByTestId('badge-light')
    await cell.waitFor({ state: 'visible' })
    const button = cell.getByRole('button', { name: 'Show hint' })
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24)
  })
})
