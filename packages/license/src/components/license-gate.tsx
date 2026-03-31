'use client'

import type { LicenseGateProps } from '../types'
import { useLicense } from '../hooks/use-license'
import { LicenseRenderContext } from '../context/license-context'
import { LicenseWatermark } from './license-watermark'
import { LicenseWarning } from './license-warning'

export function LicenseGate({ require: _require, children, fallback, loading }: LicenseGateProps) {
  const { state } = useLicense()

  if (state.status === 'loading') {
    return <>{loading ?? null}</>
  }

  const isValid = state.status === 'valid' && state.tier === 'pro' && state.renderKey !== undefined

  if (isValid) {
    return (
      <LicenseRenderContext.Provider value={state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    )
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <>
      {children}
      <LicenseWatermark />
      <LicenseWarning />
    </>
  )
}
