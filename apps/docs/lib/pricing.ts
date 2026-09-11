/**
 * Central pricing source of truth for the docs/marketing site.
 *
 * IMPORTANT: the *charged* price lives in Polar (merchant of record) — these
 * constants only control what the site DISPLAYS. They must be kept in sync with
 * the Polar products, otherwise the page advertises a price the checkout does
 * not honor.
 *
 * The model: every @tour-kit/* package is source-available under BSL 1.1. Free
 * for development, evaluation, testing and CI; a key to serve it to end users
 * of a deployed application. Tiers differ only in how many projects one key
 * covers — a "project" is a registrable domain, so `app.foo.com` and
 * `www.foo.com` are one project (see `toRegistrableDomain` in
 * `@tour-kit/license`).
 */

export interface PricingTier {
  /** Stable id. Also the key of the checkout-URL map in `polar-config.ts`. */
  readonly id: string
  readonly name: string
  /** Display price in whole-and-cents USD, one-time. */
  readonly price: number
  /** How many projects (registrable domains) one key activates. */
  readonly projects: number | 'unlimited'
  readonly blurb: string
  readonly highlight: boolean
}

/**
 * `as const` so `TierId` below is a literal union rather than `string`. That is
 * what makes the checkout-URL map exhaustive: drop a tier from the map and
 * `pnpm --filter docs typecheck` fails instead of the button going dead.
 */
export const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    projects: 1,
    blurb: 'One production project. The whole library, not a cut-down tier.',
    highlight: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 49.99,
    projects: 5,
    blurb: 'Five production projects. For an agency or a small portfolio.',
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299.99,
    projects: 'unlimited',
    blurb: 'Unlimited production projects, forever, on the versions you buy.',
    highlight: false,
  },
] as const satisfies readonly PricingTier[]

export type TierId = (typeof TIERS)[number]['id']

/** The entry price, for the many places that say "from $X". */
export const STARTER_PRICE = TIERS[0].price

/** Formats a tier price the way every surface should show it: `$9.99`. */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/** `1 project` / `5 projects` / `Unlimited projects`. */
export function formatProjects(projects: PricingTier['projects']): string {
  if (projects === 'unlimited') return 'Unlimited projects'
  return projects === 1 ? '1 project' : `${projects} projects`
}
