import type { TierId } from '@/lib/pricing'

/**
 * One Polar checkout URL per tier, read from the environment. Never hardcode a
 * service URL — these are set in Dokploy.
 *
 * The `Record<TierId, string>` annotation is the point: `TierId` is a literal
 * union derived from `TIERS`, so adding a tier without adding its URL is a
 * `pnpm --filter docs typecheck` failure rather than a button that silently
 * goes nowhere.
 */
export const POLAR_CHECKOUT_URLS: Record<TierId, string> = {
  starter: process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_STARTER ?? '',
  business: process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_BUSINESS ?? '',
  premium: process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_PREMIUM ?? '',
}

/**
 * The URL a "Buy" button should point at, with a fail-visible fallback.
 *
 * An unset env var resolves to `/pricing` rather than to a dead `''` href: a
 * button that goes nowhere is the failure mode this whole exercise exists to
 * fix (measured 2026-09-02: 2.56% of visitors click Buy, 0% complete).
 */
export function checkoutUrl(tier: TierId): string {
  return POLAR_CHECKOUT_URLS[tier] || '/pricing'
}

// Polar-hosted customer portal. Customers sign in with the email they used to
// purchase; Polar mails them a one-time code. Set NEXT_PUBLIC_POLAR_PORTAL_URL
// to your org's portal, e.g. https://polar.sh/<your-org-slug>/portal.
export const POLAR_PORTAL_URL = process.env.NEXT_PUBLIC_POLAR_PORTAL_URL ?? 'https://polar.sh/login'

/**
 * The attribution keys Polar accepts on a Checkout Link and records in the
 * checkout session's metadata. Forwarding these is what joins "the watermark
 * badge sent them" to "they bought" — GA can see the badge UTM land on
 * `/pricing`, and Polar can see a sale, but without the hand-off nothing
 * connects the two and the badge's value stays unmeasurable.
 *
 * Only these keys are forwarded. A blind copy of the incoming query string
 * would also carry `product_id`, `discount_code` and `customer_email`, which
 * are checkout *inputs* — letting a crafted inbound link rewrite the cart.
 */
export const ATTRIBUTION_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'reference_id',
] as const

/**
 * Copy the visitor's attribution params from `search` onto a checkout `url`.
 *
 * Pure, and takes the query string rather than reading `window`, so the
 * forwarding rule is unit-testable without a DOM.
 */
export function withAttribution(url: string, search: string): string {
  const incoming = new URLSearchParams(search)
  const forwarded = ATTRIBUTION_PARAMS.filter((key) => incoming.has(key))
  if (forwarded.length === 0) return url

  // `url` can be the relative `/pricing` fallback, which `new URL` rejects
  // without a base. The base is only ever used to parse, never to emit.
  const target = new URL(url, 'https://usertourkit.com')
  for (const key of forwarded) {
    // A value already on the link was configured deliberately; an incoming one
    // is a guess at the source. The deliberate one wins.
    if (target.searchParams.has(key)) continue
    target.searchParams.set(key, incoming.get(key) as string)
  }

  return /^https?:/.test(url) ? target.toString() : `${target.pathname}${target.search}`
}
