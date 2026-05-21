'use client'

import { useEffect, useMemo } from 'react'
import { LicenseContext, LicenseRenderContext } from '../context/license-context'
import type { LicenseContextValue, LicenseState } from '../types'

export type LicenseTestModeProps =
  | { tier: 'invalid'; children: React.ReactNode }
  | { tier: 'pro'; children: React.ReactNode }
  | { tier: 'free'; children: React.ReactNode }

/**
 * QA-only: override `<LicenseProvider>` context with a simulated state so the
 * watermark, adoption gate, and Pro fallbacks can be verified on a real
 * production-like domain without unsetting `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`
 * or hitting the live Polar API.
 *
 * MUST NOT be imported from application src/. Use only in __tests__/ and
 * examples/. Enforced by `packages/license/scripts/check-license-test-mode.mjs`.
 * Production use also emits a loud `console.warn` so an accidental ship is
 * detectable in the browser console.
 */
export function LicenseTestMode(props: LicenseTestModeProps) {
  const { tier, children } = props

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '<LicenseTestMode> active in production — this overrides real license state and MUST be removed before deploy.'
      )
    }
  }, [])

  const value = useMemo<LicenseContextValue>(() => {
    const now = Date.now()
    let state: LicenseState
    if (tier === 'pro') {
      state = {
        status: 'valid',
        tier: 'pro',
        activations: 1,
        maxActivations: 5,
        domain: 'test-mode.local',
        expiresAt: null,
        validatedAt: now,
        serverValidatedAt: null,
        renderKey: 'test_mode_pro',
      }
    } else if (tier === 'free') {
      state = {
        status: 'valid',
        tier: 'free',
        activations: 0,
        maxActivations: 0,
        domain: null,
        expiresAt: null,
        validatedAt: now,
        serverValidatedAt: null,
        renderKey: undefined,
      }
    } else {
      state = {
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

    return {
      state,
      refresh: async () => {},
      isGated: tier !== 'pro',
      isLoading: false,
      gracePeriodActive: false,
      trial: null,
    }
  }, [tier])

  return (
    <LicenseContext.Provider value={value}>
      <LicenseRenderContext.Provider value={value.state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    </LicenseContext.Provider>
  )
}
