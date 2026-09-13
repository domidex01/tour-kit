import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendGAEvent = vi.fn()
const capture = vi.fn()

vi.mock('@next/third-parties/google', () => ({ sendGAEvent }))
vi.mock('posthog-js', () => ({ default: { capture } }))

/**
 * `POSTHOG_ENABLED` is read from the environment when the module first
 * evaluates, so each case has to set the variable and then import fresh.
 */
async function loadAnalytics(posthogKey: string | undefined) {
  vi.resetModules()
  // Empty and unset are the same thing to POSTHOG_ENABLED, and assigning
  // avoids `delete` on process.env.
  process.env.NEXT_PUBLIC_POSTHOG_KEY = posthogKey ?? ''
  return import('../analytics')
}

describe('trackEvent', () => {
  beforeEach(() => {
    sendGAEvent.mockClear()
    capture.mockClear()
  })

  it('sends one event to both systems under the same name', async () => {
    const { trackEvent } = await loadAnalytics('phc_test')

    trackEvent('pricing_buy_clicked', { placement: 'pricing_page_business', value: 49.99 })
    // the PostHog leg is a dynamic import, so it lands a microtask later
    await vi.waitFor(() => expect(capture).toHaveBeenCalledTimes(1))

    expect(sendGAEvent).toHaveBeenCalledWith('event', 'pricing_buy_clicked', {
      placement: 'pricing_page_business',
      value: 49.99,
    })

    // The shared name is the point: GA and PostHog run side by side through
    // the migration, and the overlap window is only comparable if one click
    // means the same event in both.
    const [gaName] = sendGAEvent.mock.calls[0].slice(1)
    const [phName, phProps] = capture.mock.calls[0]
    expect(phName).toBe(gaName)
    expect(phProps).toEqual({ placement: 'pricing_page_business', value: 49.99 })
  })

  it('still reaches GA when PostHog is not configured', async () => {
    const { trackEvent, POSTHOG_ENABLED } = await loadAnalytics(undefined)

    expect(POSTHOG_ENABLED).toBe(false)
    trackEvent('cta_clicked', { placement: 'home_after_features' })

    expect(sendGAEvent).toHaveBeenCalledTimes(1)
    // No key means posthog-js is never even imported, so no bytes ship.
    await new Promise((r) => setTimeout(r, 10))
    expect(capture).not.toHaveBeenCalled()
  })
})
