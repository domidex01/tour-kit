/**
 * Central pricing source of truth for the docs/marketing site.
 *
 * IMPORTANT: the *charged* price lives in Polar (merchant of record) — these
 * constants only control what the site DISPLAYS. They must be kept in sync with
 * the Polar product price / discount, otherwise the page will advertise a price
 * the checkout doesn't honor. See the "Changing the price in Polar" runbook
 * (docs PR description) before editing these values.
 */

/** Standard Pro list price, in whole USD. */
export const REGULAR_PRICE = 99

/** Discounted Pro price during the launch promo, in whole USD (≈49% off $99). */
export const SALE_PRICE = 49

/** Headline discount percentage shown in the promo badge/banner. */
export const DISCOUNT_PERCENT = 49

/**
 * When the launch promo ends (inclusive end-of-day, UTC). After this instant
 * the site reverts to {@link REGULAR_PRICE} and the countdown disappears.
 * Window: 2026-06-04 → +2 weeks.
 */
export const SALE_END_ISO = '2026-06-18T23:59:59Z'

const SALE_END_MS = new Date(SALE_END_ISO).getTime()

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** True while the launch promo is still running. */
export function isSaleActive(now: number = Date.now()): boolean {
  return now < SALE_END_MS
}

/**
 * Time left until {@link SALE_END_ISO}, or `null` once the promo has ended.
 */
export function getTimeRemaining(now: number = Date.now()): TimeRemaining | null {
  const diff = SALE_END_MS - now
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  }
}
