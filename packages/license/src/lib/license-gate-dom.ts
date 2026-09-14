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
 * Branch order is deliberately the same as the React pair's, for the same
 * reasons:
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
import { hasFreshCache } from './cache'
import { getCurrentDomain, isDevEnvironment } from './domain'
import { normalizeLicenseKey } from './license-state'
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

  // Dev bypass — only with a key actually configured.
  if (key.length > 0 && isDevEnvironment()) return NOOP

  let disposed = false
  let release: (() => void) | null = null

  const gate = (): void => {
    if (disposed) return
    warnUnlicensed()
    if (isDevEnvironment()) return
    release = mountWatermark()
  }

  // A reachability failure inside the cache TTL is not an unlicensed app —
  // both the returned `error` state and a thrown one get the same grace.
  const gateUnlessGrace = (): void => {
    const domain = getCurrentDomain()
    if (domain && hasFreshCache(domain, key)) return
    gate()
  }

  if (key.length === 0) {
    gate()
  } else {
    validateLicenseKey(
      key,
      options.organizationId,
      options.apiBase ? { apiBase: options.apiBase } : undefined
    )
      .then((state) => {
        if (state.status === 'valid' && state.tier === 'pro' && state.renderKey !== undefined)
          return
        if (state.status === 'error') return gateUnlessGrace()
        gate()
      })
      .catch(gateUnlessGrace)
  }

  return () => {
    disposed = true
    release?.()
    release = null
  }
}
