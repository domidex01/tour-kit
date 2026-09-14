/**
 * `<LicenseGate>` and `<LicenseProvider>` collapsed into one framework-free
 * call, for the bindings that have no React to mount a component with.
 *
 * The two React pieces split the job because a provider has to hold state a
 * gate can re-read on every render. Nothing outside React needs that: a
 * binding starts the gate once when it mounts and releases it when it goes
 * away, so the state never has to be observable — it only has to decide, once,
 * whether the badge goes up.
 *
 * The decision itself is NOT written here. `gateSignalsFor` in
 * `lib/license-state.ts` is the one copy, shared with `<LicenseProvider>`'s
 * memo, because a second hand-written copy of those four rules drifts — and
 * the drift is the expensive kind, a paying customer's production app wearing
 * the badge. What this module owns is the ORDER, which the React pair splits
 * across a provider effect and a gate render:
 *
 * - A missing key is unlicensed on **every** host, so a forgotten env var
 *   surfaces locally instead of on the deploy.
 * - A configured key on a development host skips Polar entirely, so local work
 *   never burns one of the key's finite activation slots.
 * - A development host never gets the badge. The licence grants development,
 *   evaluation, testing and CI use without charge; badging one would have the
 *   runtime contradict the terms the package ships under. The warning is the
 *   half worth keeping — it tells a developer their key is missing *before*
 *   they deploy.
 *
 * @module license-gate-dom
 */
import type { LicenseState } from '../types'
import { isDevEnvironment } from './domain'
import {
  createErrorState,
  createUnlicensedState,
  gateSignalsFor,
  normalizeLicenseKey,
} from './license-state'
import { validateLicenseKey } from './polar-client'
import { mountWatermark, warnUnlicensed } from './watermark-dom'

/** Everything {@link startLicenseGate} accepts. */
export interface LicenseGateOptions {
  /**
   * The licence key covering this deployment. Absent or blank is unlicensed:
   * the badge appears on any production host.
   */
  licenseKey?: string
  /** Polar organization id, when the key is scoped to one. */
  organizationId?: string
  /** Override the validation endpoint. Defaults to the hosted issuer. */
  apiBase?: string
}

const NOOP = (): void => {}

/**
 * Start the licence gate for a non-React binding. Returns the release.
 *
 * Safe to call during server rendering: it does nothing there and hands back a
 * no-op, the same way a React effect simply never fires.
 */
export function startLicenseGate(options: LicenseGateOptions = {}): () => void {
  if (typeof document === 'undefined') return NOOP

  const key = normalizeLicenseKey(options.licenseKey ?? '')

  let disposed = false
  let release: (() => void) | null = null

  const gate = (): void => {
    if (disposed || release !== null) return
    warnUnlicensed()
    // A dev host WITH a key never reaches here — `gateSignalsFor` cleared it.
    // A dev host without one does, and keeps the warning but not the badge.
    if (isDevEnvironment()) return
    release = mountWatermark()
  }

  const decide = (state: LicenseState): void => {
    if (gateSignalsFor(state, key).isGated) gate()
  }

  if (key.length === 0) {
    decide(createUnlicensedState())
  } else if (isDevEnvironment()) {
    // Dev bypass — no Polar call at all, so no activation slot is consumed.
    return NOOP
  } else {
    validateLicenseKey(
      key,
      options.organizationId,
      options.apiBase ? { apiBase: options.apiBase } : undefined
    ).then(
      // TWO-argument `then`, not `.then(...).catch(...)`: a chained catch also
      // catches a throw from `decide` itself — a Trusted Types CSP refusing the
      // badge, say — and would re-run the gate, taking a second hold while only
      // one release is kept. The badge would then outlive its own provider.
      decide,
      // A thrown validation IS the provider's error state, grace window and all.
      () => decide(createErrorState())
    )
  }

  return () => {
    disposed = true
    release?.()
    release = null
  }
}
