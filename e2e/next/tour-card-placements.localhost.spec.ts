import { expect, test } from '@playwright/test'

/**
 * Phase 4 — TourCard placement matrix.
 *
 * Twelve `<TourCard>` placements × screenshot + arrow-tip distance check.
 * For each placement, we navigate to the fixture route, wait for the dialog,
 * snapshot it, and assert the FloatingArrow's tip is within 4px of the
 * relevant edge of the target.
 *
 * Fixture lives at `examples/next-app/src/app/tour-card-placement/page.tsx`,
 * exposes `?placement=`, and anchors a fixed-position 100×40 target button
 * centered in the viewport so geometry is deterministic.
 */

const PLACEMENTS = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
] as const

type Placement = (typeof PLACEMENTS)[number]

function getSide(placement: Placement): 'top' | 'bottom' | 'left' | 'right' {
  return placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'
}

test.describe
  .parallel('TourCard placement matrix', () => {
    for (const placement of PLACEMENTS) {
      test(`renders correctly at placement=${placement}`, async ({ page }) => {
        await page.goto(`/tour-card-placement?placement=${placement}`)

        const dialog = page.locator('[role="dialog"][data-tour-step^="placement-"]')
        await dialog.waitFor({ state: 'visible' })

        // The arrow is rendered as a direct child of the dialog
        // (`> svg[aria-hidden]`). The close-button icon is also aria-hidden
        // but is nested inside `> div > button > svg`.
        const arrow = dialog.locator('> svg[aria-hidden="true"]')
        const anchor = page.locator('#tour-card-anchor')

        // Poll for a stable arrow box. Floating UI writes computed offset
        // on the second paint; this beats a hardcoded `waitForTimeout` —
        // fast when the box settles fast, patient when CI is slow.
        await expect
          .poll(async () => (await arrow.boundingBox())?.width ?? 0, { timeout: 2000 })
          .toBeGreaterThan(0)

        await expect(dialog).toHaveScreenshot(`${placement}.png`, {
          maxDiffPixelRatio: 0.02,
        })

        const [arrowBox, anchorBox] = await Promise.all([arrow.boundingBox(), anchor.boundingBox()])

        expect(arrowBox, 'arrow has a layout box').not.toBeNull()
        expect(anchorBox, 'anchor has a layout box').not.toBeNull()
        if (!arrowBox || !anchorBox) return

        const side = getSide(placement)
        const tolerance = 4

        // For each side, the arrow's "tip-facing" edge must be within
        // `tolerance` pixels of the target's nearest edge along that axis.
        if (side === 'top') {
          // Card sits above the anchor; arrow's bottom touches anchor's top.
          const arrowBottom = arrowBox.y + arrowBox.height
          expect(Math.abs(arrowBottom - anchorBox.y)).toBeLessThanOrEqual(tolerance)
        } else if (side === 'bottom') {
          const anchorBottom = anchorBox.y + anchorBox.height
          expect(Math.abs(arrowBox.y - anchorBottom)).toBeLessThanOrEqual(tolerance)
        } else if (side === 'left') {
          const arrowRight = arrowBox.x + arrowBox.width
          expect(Math.abs(arrowRight - anchorBox.x)).toBeLessThanOrEqual(tolerance)
        } else {
          const anchorRight = anchorBox.x + anchorBox.width
          expect(Math.abs(arrowBox.x - anchorRight)).toBeLessThanOrEqual(tolerance)
        }
      })
    }
  })
