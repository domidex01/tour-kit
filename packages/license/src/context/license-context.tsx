'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearCache, hasFreshCache } from '../lib/cache'
import { getCurrentDomain, isDevEnvironment } from '../lib/domain'
import { validateLicenseKey } from '../lib/polar-client'
import type { LicenseContextValue, LicenseProviderProps, LicenseState } from '../types'

const LOADING_STATE: LicenseState = {
  status: 'loading',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: 0,
  renderKey: undefined,
}

const DEV_BYPASS_STATE: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'dev_bypass',
}

export const LicenseContext = createContext<LicenseContextValue | null>(null)

export const LicenseRenderContext = createContext<string | undefined>(undefined)

export function LicenseProvider({
  licenseKey,
  organizationId,
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
    if (isDevEnvironment()) {
      const devState: LicenseState = {
        ...DEV_BYPASS_STATE,
        validatedAt: Date.now(),
      }
      setState(devState)
      onValidateRef.current?.(devState)
      return
    }

    try {
      const result = organizationId
        ? await validateLicenseKey(licenseKey, organizationId)
        : await validateLicenseKey(licenseKey)
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
    if (isDevEnvironment()) {
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
      const grace = domain ? hasFreshCache(domain, licenseKey) : false
      return { isGated: !grace, isLoading: false, gracePeriodActive: grace }
    }
    return { isGated: true, isLoading: false, gracePeriodActive: false }
  }, [state, licenseKey])

  const contextValue = useMemo<LicenseContextValue>(
    () => ({ state, refresh, isGated, isLoading, gracePeriodActive }),
    [state, refresh, isGated, isLoading, gracePeriodActive]
  )

  return (
    <LicenseContext.Provider value={contextValue}>
      <LicenseRenderContext.Provider value={state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    </LicenseContext.Provider>
  )
}
