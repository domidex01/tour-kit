import { type Page, expect, test } from '@playwright/test'

/**
 * v2 §1.5 — the eight cases that prove a non-React binding runs a real tour.
 *
 * Shared by the Vue and Svelte lanes because they run the SAME three-step tour
 * against the same `data-testid` map — the whole point of §1.5 is that the two
 * bindings behave identically over one engine, so a divergence should show up
 * as one lane failing a case the other passes, not as two drifting files.
 *
 * Every case is its own `test()`, which matters for more than isolation:
 * `Escape` maps to `skip()`, not `stop()`, and a skip is PERSISTED. Sharing a
 * browser context between the Escape case and the reload-resume case would let
 * the skipped mark decide the resume.
 */

/** The tour, for reference — see `src/tours.ts` in either example. */
const STEP_1 = 'Step one'
const STEP_2 = 'Step two'
const STEP_3 = 'Step three'

const title = (page: Page) => page.getByTestId('tour-card-title')

async function startTour(page: Page) {
  await page.goto('/')
  await page.waitForSelector('#start-here')
  await page.getByTestId('start-tour').click()
  await expect(title(page)).toHaveText(STEP_1)
}

export function describeBindingTourFlow(binding: 'Vue' | 'Svelte') {
  test.describe(`${binding} binding — tour flow`, () => {
    test('a click on Start opens the card on step 1', async ({ page }) => {
      await startTour(page)
      await expect(page.getByTestId('tour-card')).toBeVisible()
    })

    test('ArrowRight advances', async ({ page }) => {
      await startTour(page)

      // `attachKeyboard` is wired by the binding, not by a card: a headless
      // consumer would otherwise have to find it themselves.
      await page.keyboard.press('ArrowRight')

      await expect(title(page)).toHaveText(STEP_2)
    })

    test('a cross-route step navigates and the card resumes on the target', async ({ page }) => {
      await startTour(page)
      await page.keyboard.press('ArrowRight')

      await expect(page).toHaveURL(/\/settings$/)
      await expect(title(page)).toHaveText(STEP_2)
      await expect(page.getByTestId('tour-card')).toBeVisible()
    })

    test('a real click on step 1s target lands on step 2, not step 3', async ({ page }) => {
      await startTour(page)

      // `page.click()`, never `dispatchEvent`. A real click dispatches with an
      // empty JS stack, so the microtask checkpoint between listeners runs and
      // the transition completes before the event bubbles to `document` — the
      // exact window in which the unfixed `attachAdvanceOn` bound step 2's
      // document-fallback listener and ate the same click.
      await page.click('#start-here')

      await expect(title(page)).toHaveText(STEP_2)
      await expect(title(page)).not.toHaveText(STEP_3)
    })

    test('a real click on the page during step 2 advances exactly one step', async ({ page }) => {
      await startTour(page)
      await page.click('#start-here')
      await expect(title(page)).toHaveText(STEP_2)

      // Step 2 is document-bound (no `selector`), so any click advances it.
      await page.click('body', { position: { x: 5, y: 5 } })

      await expect(title(page)).toHaveText(STEP_3)
    })

    test('the cards Back on step 2 goes back, it does not advance', async ({ page }) => {
      await startTour(page)
      await page.click('#start-here')
      await expect(title(page)).toHaveText(STEP_2)

      // The card's button row stops propagation. Without it the document-bound
      // step would swallow Back's own click and advance instead —
      // `bindStepAdvance` has no card guard.
      await page.getByTestId('tour-back').click()

      await expect(title(page)).toHaveText(STEP_1)
    })

    test('a hard reload mid-tour resumes on the same step in under 200ms', async ({ page }) => {
      // Inline, not `e2e/fixtures/console.ts`: that fixture collects
      // `msg.type() === 'error'` only and never sees `console.timeEnd`.
      // Runtimes disagree about which type `timeEnd` logs as, so match the
      // text prefix.
      let flowRestoreMs: number | null = null
      page.on('console', (msg) => {
        const text = msg.text()
        if (text.startsWith('flow-restore:')) {
          const match = text.match(/([\d.]+)\s*ms/)
          if (match) flowRestoreMs = Number.parseFloat(match[1] ?? '0')
        }
      })

      await startTour(page)
      await page.keyboard.press('ArrowRight')
      await expect(page).toHaveURL(/\/settings$/)
      await expect(title(page)).toHaveText(STEP_2)

      // The flow-session write is TRAILING-EDGE throttled at 200 ms
      // (`adapters/flow-session-store.ts`, `SAVE_THROTTLE_MS`), and a hard
      // browser reload runs no teardown, so it never gets the `flush()` that
      // an unmount would give it. Reloading inside that window resumes on the
      // PREVIOUS step — measured here, and true of the React provider too; the
      // existing React resume spec only avoids it because its assertions
      // happen to take longer than 200 ms. Waiting explicitly is the honest
      // version of what that spec does by accident. (A `pagehide` flush in the
      // engine would close the gap for all three bindings; out of scope here.)
      await page.waitForTimeout(300)

      await page.reload()

      await expect(page).toHaveURL(/\/settings$/)
      await expect(title(page)).toHaveText(STEP_2)

      // Assert the timer was SEEN before comparing: a `null` satisfies no
      // comparison, so a broken restore would otherwise pass as "fast".
      expect(flowRestoreMs, 'no flow-restore console timer was emitted').not.toBeNull()
      expect(flowRestoreMs as unknown as number).toBeLessThan(200)
    })

    test('Escape ends the tour and focus returns to the Start button', async ({ page }) => {
      await startTour(page)

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('tour-card')).toHaveCount(0)
      await expect(page.getByTestId('start-tour')).toBeFocused()
    })
  })
}
