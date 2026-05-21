'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearCache, hasFreshCache } from '../lib/cache'
import { getCurrentDomain, isDevEnvironment } from '../lib/domain'
import {
  createDevBypassState,
  createUnlicensedState,
  normalizeLicenseKey,
} from '../lib/license-state'
import { validateLicenseKey } from '../lib/polar-client'
import { getDaysLeft } from '../lib/trial'
import type {
  LicenseContextValue,
  LicenseProviderProps,
  LicenseState,
  TrialContextValue,
} from '../types'

const LOADING_STATE: LicenseState = {
  status: 'loading',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: 0,
  serverValidatedAt: null,
  renderKey: undefined,
}

export const LicenseContext = createContext<LicenseContextValue | null>(null)

export const LicenseRenderContext = createContext<string | undefined>(undefined)

export function LicenseProvider({
  licenseKey,
  organizationId,
  trialDays,
  trialIssuedAt,
  children,
  onValidate,
  onError,
}: LicenseProviderProps) {
  const [state, setState] = useState<LicenseState>(LOADING_STATE)

  // Stabilize user-supplied callbacks via refs so inline `onValidate`/`onError`
  // props do not invalidate `validate` on every render and trigger a re-validation loop.
  const onValidateRef = useRef(onValidate)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onValidateRef.current = onValidate
    onErrorRef.current = onError
  })

  const validate = useCallback(async () => {
    const normalizedKey = normalizeLicenseKey(licenseKey)

    // Missing key is unlicensed on every host — including localhost. This must
    // run before the dev short-circuit so a missing env var surfaces the same
    // unlicensed watermark locally that it would in production.
    if (normalizedKey.length === 0) {
      const next = createUnlicensedState()
      setState(next)
      onValidateRef.current?.(next)
      return
    }

    if (isDevEnvironment()) {
      const next = createDevBypassState()
      setState(next)
      onValidateRef.current?.(next)
      return
    }

    try {
      const result = organizationId
        ? await validateLicenseKey(normalizedKey, organizationId)
        : await validateLicenseKey(normalizedKey)
      setState(result)
      onValidateRef.current?.(result)
    } catch (error) {
      const errorState: LicenseState = {
        status: 'error',
        tier: 'free',
        activations: 0,
        maxActivations: 0,
        domain: null,
        expiresAt: null,
        validatedAt: Date.now(),
        serverValidatedAt: null,
        renderKey: undefined,
      }
      setState(errorState)
      onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [licenseKey, organizationId])

  useEffect(() => {
    validate()
  }, [validate])

  const refresh = useCallback(async () => {
    const domain = getCurrentDomain()
    if (domain) {
      clearCache(domain)
    }
    await validate()
  }, [validate])

  // Derived gating signals — computed once per state change so consumers
  // (`useLicenseGate`, `<LicenseGate>`, `<ProGate>`) never read localStorage
  // on every render. Both gates now share this single source of truth.
  const { isGated, isLoading, gracePeriodActive } = useMemo(() => {
    const normalizedKey = normalizeLicenseKey(licenseKey)

    // Dev bypass only applies when a non-empty key is configured. A missing
    // key on localhost falls through to the normal status-based gating so the
    // unlicensed watermark appears just like in production.
    if (isDevEnvironment() && normalizedKey.length > 0) {
      return { isGated: false, isLoading: false, gracePeriodActive: false }
    }
    if (state.status === 'loading') {
      return { isGated: false, isLoading: true, gracePeriodActive: false }
    }
    if (state.status === 'valid' && state.tier === 'pro' && state.renderKey !== undefined) {
      return { isGated: false, isLoading: false, gracePeriodActive: false }
    }
    if (state.status === 'error') {
      const domain = getCurrentDomain()
      // Use the normalized key so the hash matches what polar-client writes.
      const grace = domain ? hasFreshCache(domain, normalizedKey) : false
      return { isGated: !grace, isLoading: false, gracePeriodActive: grace }
    }
    return { isGated: true, isLoading: false, gracePeriodActive: false }
  }, [state, licenseKey])

  // Trial slice — client-derived from issuedAt + trialDays because Polar's
  // validate endpoint has no `tier` field (Phase 0 task 0.6, memory #187).
  const trial = useMemo<TrialContextValue | null>(() => {
    if (trialDays === undefined) return null
    if (trialDays <= 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('<LicenseProvider> received non-positive trialDays; ignoring')
      }
      return null
    }
    const issuedAt = trialIssuedAt ?? state.serverValidatedAt ?? state.validatedAt
    if (!issuedAt || issuedAt <= 0) return null
    const daysLeft = getDaysLeft({
      issuedAt,
      trialDays,
      validatedAt: state.validatedAt,
      serverValidatedAt: state.serverValidatedAt,
    })
    return { daysLeft, isTrialing: daysLeft > 0 }
  }, [trialDays, trialIssuedAt, state.validatedAt, state.serverValidatedAt])

  const contextValue = useMemo<LicenseContextValue>(
    () => ({ state, refresh, isGated, isLoading, gracePeriodActive, trial }),
    [state, refresh, isGated, isLoading, gracePeriodActive, trial]
  )

  return (
    <LicenseContext.Provider value={contextValue}>
      <LicenseRenderContext.Provider value={state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    </LicenseContext.Provider>
  )
}
