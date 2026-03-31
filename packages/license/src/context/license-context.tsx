'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { clearCache } from '../lib/cache'
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

  const validate = useCallback(async () => {
    if (isDevEnvironment()) {
      const devState: LicenseState = {
        ...DEV_BYPASS_STATE,
        validatedAt: Date.now(),
      }
      setState(devState)
      onValidate?.(devState)
      return
    }

    try {
      const result = organizationId
        ? await validateLicenseKey(licenseKey, organizationId)
        : await validateLicenseKey(licenseKey)
      setState(result)
      onValidate?.(result)
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
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [licenseKey, organizationId, onValidate, onError])

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

  const contextValue = useMemo<LicenseContextValue>(() => ({ state, refresh }), [state, refresh])

  return (
    <LicenseContext.Provider value={contextValue}>
      <LicenseRenderContext.Provider value={state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    </LicenseContext.Provider>
  )
}
