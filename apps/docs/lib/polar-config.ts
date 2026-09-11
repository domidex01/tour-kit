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
