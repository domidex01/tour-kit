import type { LicenseState } from '../types'
import { hasFreshCache } from './cache'
import { getCurrentDomain, isDevEnvironment } from './domain'

/**
 * Trim a raw license key. Used everywhere a key is checked for presence,
 * compared, hashed for cache, or sent to Polar so that accidental whitespace
 * (env var with trailing newline, copy-pasted with spaces) is normalized
 * exactly once.
 */
export function normalizeLicenseKey(key: string): string {
  return key.trim()
}

/**
 * True when the key has at least one non-whitespace character.
 *
 * Empty and whitespace-only keys are unlicensed on every host — including
 * localhost. The dev bypass only applies when a non-empty key is configured.
 */
export function hasLicenseKey(key: string): boolean {
  return normalizeLicenseKey(key).length > 0
}

/**
 * Canonical unlicensed state. Returned whenever the configured key is missing
 * or blank. Kept as `status: 'invalid'` (instead of introducing a new `missing`
 * status) so downstream gating logic in `<LicenseGate>`, `<ProGate>`, and
 * `useLicenseGate()` keeps working without type churn.
 */
export function createUnlicensedState(now: number = Date.now()): LicenseState {
  return {
    status: 'invalid',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    serverValidatedAt: null,
    renderKey: undefined,
  }
}

/**
 * Canonical dev-bypass state. Returned on localhost / 127.0.0.1 / *.local when
 * a non-empty key is configured. Skips Polar so local dev does not consume
 * activation slots — but only when the developer has at least set a key, so a
 * missing env var still surfaces as an unlicensed watermark before deploy.
 */
export function createDevBypassState(now: number = Date.now()): LicenseState {
  return {
    status: 'valid',
    tier: 'pro',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    serverValidatedAt: null,
    renderKey: 'dev_bypass',
  }
}

/**
 * Canonical error state — a validation that threw rather than answered.
 *
 * Not "unlicensed": `gateSignalsFor` gives `error` the cache grace window, so a
 * network blip inside the 72h TTL never badges a paying customer.
 */
export function createErrorState(now: number = Date.now()): LicenseState {
  return {
    status: 'error',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    serverValidatedAt: null,
    renderKey: undefined,
  }
}

/**
 * Canonical preview-bypass state. Returned on ephemeral / preview hosts
 * (Vercel/Netlify/Cloudflare preview URLs, tunnels, raw IPs — see
 * `isEphemeralHost`). Like the dev bypass it unlocks Pro and skips Polar so a
 * throwaway deploy URL never consumes one of the key's finite activation slots.
 * A distinct `renderKey` keeps the debug panel and any anti-bypass consumer
 * able to tell a preview bypass apart from a localhost dev bypass.
 */
export function createPreviewBypassState(now: number = Date.now()): LicenseState {
  return {
    status: 'valid',
    tier: 'pro',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    serverValidatedAt: null,
    renderKey: 'preview_bypass',
  }
}

/** What a gate needs to know, derived from one validation. */
export type GateSignals = {
  isGated: boolean
  isLoading: boolean
  gracePeriodActive: boolean
}

/**
 * The single gating decision, for every binding.
 *
 * `<LicenseProvider>`'s memo and `startLicenseGate()` both call this rather
 * than each re-deriving the same four rules. They were written twice once, and
 * the drift that invites is the expensive kind: a new bypass `renderKey` added
 * on the React side would have left Vue and Svelte badging paying customers,
 * with no failing test to say so.
 *
 * Reads `location` and the cache, so it belongs to render-time, not to module
 * scope.
 */
export function gateSignalsFor(state: LicenseState, licenseKey: string): GateSignals {
  const key = normalizeLicenseKey(licenseKey)
  const open = { isGated: false, isLoading: false, gracePeriodActive: false }

  // Dev bypass only applies when a non-empty key is configured. A missing key
  // on localhost falls through to normal gating, so it surfaces before deploy.
  if (isDevEnvironment() && key.length > 0) return open
  if (state.status === 'loading')
    return { isGated: false, isLoading: true, gracePeriodActive: false }
  if (state.status === 'valid' && state.tier === 'pro' && state.renderKey !== undefined) return open
  if (state.status === 'error') {
    // Use the normalized key so the hash matches what polar-client writes.
    const domain = getCurrentDomain()
    const grace = domain ? hasFreshCache(domain, key) : false
    return { isGated: !grace, isLoading: false, gracePeriodActive: grace }
  }
  return { isGated: true, isLoading: false, gracePeriodActive: false }
}
