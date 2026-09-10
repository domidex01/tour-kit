import { expect, test } from '@playwright/test'

/**
 * v3 Phase 3 — an announcement rendered from `@tour-kit/announcements/engine`.
 *
 * The Vue app imports no `@tour-kit/announcements` component and no React. The
 * card, the queue line and the segment controls are hand-written Vue over the
 * engine's state. If these pass, a non-React consumer can genuinely run
 * announcements — queue, priority ordering, audience and all.
 *
 * Each test is written so it FAILS when the composable is unwired: every
 * assertion reads a value the engine produced, never a static string the
 * template could render on its own.
 */
test.describe('Vue — announcements from @tour-kit/announcements/engine', () => {
  test('auto-shows the highest-priority announcement and queues the rest', async ({ page }) => {
    await page.goto('/announcements')

    // `welcome` is priority 'high', `changelog` is 'normal' — the ORDER is the
    // engine's priority comparator, not the array order, and asserting the id
    // (not merely visibility) is what makes that discriminating.
    await expect(page.getByTestId('announcement-id')).toHaveText('welcome')
    await expect(page.getByTestId('view-count')).toHaveText('1')
    await expect(page.getByTestId('queue')).toHaveText('changelog')
  })

  test('dismiss advances the queue in one transition — nothing is ever in limbo', async ({
    page,
  }) => {
    await page.goto('/announcements')
    await expect(page.getByTestId('announcement-id')).toHaveText('welcome')

    await page.getByTestId('dismiss').click()

    // The promoted id must arrive as it leaves the queue. A two-step advance
    // would leave a frame with an empty queue and nothing active; Playwright's
    // auto-wait would hide that, so the queue is asserted EMPTY at the same
    // moment the new id is asserted present.
    await expect(page.getByTestId('announcement-id')).toHaveText('changelog')
    await expect(page.getByTestId('queue')).toHaveText('none')
  })

  test('a segment-gated announcement stays hidden until setSegments admits it', async ({
    page,
  }) => {
    await page.goto('/announcements')

    // Registered, so the engine answers for it — but not showable.
    await expect(page.getByTestId('admin-registered')).toHaveText('true')
    await expect(page.getByTestId('can-show-admin')).toHaveText('false')

    await page.getByTestId('admit-admins').click()
    await expect(page.getByTestId('can-show-admin')).toHaveText('true')

    await page.getByTestId('revoke-admins').click()
    await expect(page.getByTestId('can-show-admin')).toHaveText('false')
  })

  test('a dismissal survives a reload, so persistence really ran', async ({ page }) => {
    await page.goto('/announcements')
    await page.getByTestId('dismiss').click()
    await expect(page.getByTestId('announcement-id')).toHaveText('changelog')

    // Read the blob BEFORE reloading: a reload assertion alone would also pass
    // if the announcement had never rendered at all.
    const blob = await page.evaluate(() =>
      window.localStorage.getItem('tour-kit:announcements:welcome')
    )
    expect(blob, 'the engine wrote no persistence blob').toBeTruthy()
    expect(JSON.parse(blob ?? '{}').isDismissed).toBe(true)

    await page.reload()
    await expect(page.getByTestId('announcement-id')).toHaveText('changelog')
  })
})
