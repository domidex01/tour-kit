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
 * The gating decision is computed once per validation inside `LicenseProvider`
 * and exposed on the context, so this hook reads it directly — no localStorage
 * access on every render.
 *
 * Logic (mirrors LicenseProvider's derived signals):
 * - Dev environment (localhost, 127.0.0.1, *.local) → never gated
 * - No LicenseProvider in tree → gated
 * - status 'loading' → not gated, isLoading=true (avoid flash)
 * - status 'valid' + pro + renderKey → not gated
 * - status 'error' + fresh cache → not gated (grace period)
 * - status 'error' + no cache → gated
 * - status 'invalid' / 'expired' / 'revoked' → gated
 */
export function useLicenseGate(): LicenseGateResult {
  const context = useContext(LicenseContext)

  // Dev bypass — never gate locally, even when no provider is mounted.
  if (isDevEnvironment()) {
    return { isGated: false, isLoading: false }
  }

  // No LicenseProvider in tree — gated.
  if (context === null) {
    return { isGated: true, isLoading: false }
  }

  return { isGated: context.isGated, isLoading: context.isLoading }
}
