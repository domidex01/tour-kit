'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import { isDevEnvironment } from '../lib/domain'

export interface LicenseGateResult {
  /** True if the component should be blocked (show placeholder) */
  isGated: boolean
  /** True while license validation is in progress */
  isLoading: boolean
}

/**
 * Determines whether a pro component should render or show a placeholder.
 *
 * Provider state wins over hostname. When `<LicenseProvider>` is mounted, the
 * provider's derived `isGated`/`isLoading` flags drive the result so a missing
 * key on localhost still surfaces as gated. Only when no provider is in the
 * tree do we fall back to the hostname check — at that point we have no key to
 * inspect, so localhost stays quiet.
 *
 * Provider-derived signals (see LicenseProvider for the full table):
 * - status 'loading' → not gated, isLoading=true (avoid flash)
 * - status 'valid' + pro + renderKey → not gated
 * - status 'error' + fresh cache → not gated (grace period)
 * - status 'error' + no cache → gated
 * - status 'invalid' / 'expired' / 'revoked' → gated
 *
 * No-provider fallback:
 * - dev host → not gated (cannot inspect a key that does not exist)
 * - non-dev host → gated
 */
export function useLicenseGate(): LicenseGateResult {
  const context = useContext(LicenseContext)

  // Provider precedence: when a `<LicenseProvider>` is in the tree, trust its
  // derived gate state. The provider already accounts for the dev bypass for
  // non-empty keys and falls through to gated state when the key is missing.
  if (context !== null) {
    return { isGated: context.isGated, isLoading: context.isLoading }
  }

  // No provider — fall back to the hostname check. Locally we cannot tell
  // whether a key was configured, so stay quiet on dev hosts.
  if (isDevEnvironment()) {
    return { isGated: false, isLoading: false }
  }

  return { isGated: true, isLoading: false }
}
