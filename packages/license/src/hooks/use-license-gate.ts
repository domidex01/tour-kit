'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import { hasFreshCache } from '../lib/cache'
import { getCurrentDomain, isDevEnvironment } from '../lib/domain'

export interface LicenseGateResult {
  /** True if the component should be blocked (show placeholder) */
  isGated: boolean
  /** True while license validation is in progress */
  isLoading: boolean
}

/**
 * Determines whether a pro component should render or show a placeholder.
 *
 * Logic:
 * - Dev environment (localhost, 127.0.0.1, *.local) → never gated
 * - No LicenseProvider in tree → gated
 * - status 'valid' → not gated
 * - status 'loading' → not gated (avoid flash)
 * - status 'error' + fresh cache → not gated (grace period)
 * - status 'error' + no cache → gated
 * - status 'invalid' / 'expired' / 'revoked' → gated
 */
export function useLicenseGate(): LicenseGateResult {
  const context = useContext(LicenseContext)

  // Dev bypass — never gate locally
  if (isDevEnvironment()) {
    return { isGated: false, isLoading: false }
  }

  // No LicenseProvider in tree — gated
  if (context === null) {
    return { isGated: true, isLoading: false }
  }

  const { state } = context
  const { status } = state

  if (status === 'loading') {
    return { isGated: false, isLoading: true }
  }

  if (status === 'valid') {
    return { isGated: false, isLoading: false }
  }

  if (status === 'error') {
    // Grace period: trust cache if it exists and is fresh
    const domain = getCurrentDomain()
    if (domain && hasFreshCache(domain)) {
      return { isGated: false, isLoading: false }
    }
    // No cache — treat as unlicensed
    return { isGated: true, isLoading: false }
  }

  // 'invalid' | 'expired' | 'revoked'
  return { isGated: true, isLoading: false }
}
