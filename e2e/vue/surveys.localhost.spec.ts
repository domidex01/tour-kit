import { expect, test } from '@playwright/test'

/**
 * v3 Phase 3 — a survey rendered from `@tour-kit/surveys/engine`.
 *
 * The Vue app imports no `@tour-kit/surveys` component and no React. The card,
 * the rating buttons and the score line are hand-written Vue over the engine's
 * state. The score in particular is the engine's: the page never computes one.
 */
test.describe('Vue — surveys from @tour-kit/surveys/engine', () => {
  test('shows a survey on demand and walks its steps', async ({ page }) => {
    await page.goto('/surveys')
    await expect(page.getByTestId('nothing-active')).toBeVisible()

    await page.getByTestId('show-nps').click()
    await expect(page.getByTestId('survey-id')).toHaveText('nps-q3')
    await expect(page.getByTestId('step')).toHaveText('0')

    await page.getByTestId('rate-9').click()
    // The step advanced, which is the engine's `nextQuestion`, and the answer
    // was recorded, which is its reducer.
    await expect(page.getByTestId('step')).toHaveText('1')
    await expect(page.getByTestId('answers')).toHaveText('9')
  })

  test('the ENGINE computes the score — the page never does', async ({ page }) => {
    await page.goto('/surveys')
    await page.getByTestId('show-nps').click()
    await page.getByTestId('rate-10').click()
    await page.getByTestId('finish').click()

    // Two promoters, zero detractors ⇒ NPS 100. A page that faked a score would
    // have to reimplement the bucketing to get this right.
    await expect(page.getByTestId('score')).toHaveText('100')
  })

  test('a detractor scores negative, so the bucketing is really running', async ({ page }) => {
    await page.goto('/surveys')
    await page.getByTestId('show-nps').click()
    await page.getByTestId('rate-0').click()
    await page.getByTestId('finish').click()
    await expect(page.getByTestId('score')).toHaveText('-100')
  })

  test('a dismissal persists, and the survey does not come back on reload', async ({ page }) => {
    await page.goto('/surveys')
    await page.getByTestId('show-nps').click()
    await expect(page.getByTestId('survey-id')).toHaveText('nps-q3')

    await page.getByTestId('dismiss').click()
    await expect(page.getByTestId('nothing-active')).toBeVisible()

    // Read the blob BEFORE reloading — a reload assertion alone would also pass
    // if the survey had never rendered.
    const blob = await page.evaluate(() => window.localStorage.getItem('tour-kit:surveys:state'))
    expect(blob, 'the engine wrote no persistence blob').toBeTruthy()
    const parsed = JSON.parse(blob ?? '{}')
    const nps = parsed.surveys.find(([id]: [string]) => id === 'nps-q3')
    expect(nps?.[1].isDismissed).toBe(true)

    await page.reload()
    await page.getByTestId('show-nps').click()
    // `canShow` refuses a dismissed survey, so nothing appears.
    await expect(page.getByTestId('nothing-active')).toBeVisible()
  })
})
