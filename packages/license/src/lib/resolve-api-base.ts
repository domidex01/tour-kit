/**
 * Default issuer URL. Polar in v1.x; flips to tourkit-dash in v2.x at T+90
 * per plan/15m. v1.x customers point at tourkit-dash by overriding this
 * default — never by upgrading the SDK during the dual-run window.
 */
export const DEFAULT_API_BASE = 'https://api.polar.sh/v1/customer-portal/license-keys'

/**
 * Reads `process.env.X` defensively for browsers without a bundler-injected
 * `process.env`. Returns `undefined` when the var is missing or the runtime
 * has no `process` global.
 */
function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined
  const value = process.env?.[name]
  return value && value.length > 0 ? value : undefined
}

/**
 * Resolve which issuer base URL a call should hit.
 *
 * Precedence (highest first):
 *   1. `override` passed by the caller (`options.apiBase` on `validateLicenseKey`,
 *      `validateKey`, `activateKey`, `deactivateKey`, or the `apiBase` prop on
 *      `<LicenseProvider>`).
 *   2. `process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_API_BASE` — Next.js client +
 *      server (the same prefix used by `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` so
 *      customer apps configure both vars the same way).
 *   3. `process.env.TOUR_KIT_LICENSE_API_BASE` — server-side / Node /
 *      Vite-with-define / customers using a non-Next.js bundler that inlines
 *      bare env names.
 *   4. {@link DEFAULT_API_BASE}.
 *
 * The override mechanism is the load-bearing seam for the Polar → tourkit-dash
 * issuer migration (plan/15f). Without it a v1.x customer cannot point at the
 * cloud issuer until they upgrade to v2.x — which is the whole reason this
 * function exists.
 */
export function resolveApiBase(override?: string): string {
  if (override && override.length > 0) return override
  const nextPublic = readEnv('NEXT_PUBLIC_TOUR_KIT_LICENSE_API_BASE')
  if (nextPublic) return nextPublic
  const bare = readEnv('TOUR_KIT_LICENSE_API_BASE')
  if (bare) return bare
  return DEFAULT_API_BASE
}
