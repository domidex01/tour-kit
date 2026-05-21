import type { LicenseState } from '../types'

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
