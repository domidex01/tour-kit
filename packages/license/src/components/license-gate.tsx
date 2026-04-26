'use client'

import { LicenseRenderContext } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
import type { LicenseGateProps } from '../types'
import { LicenseWarning } from './license-warning'
import { LicenseWatermark } from './license-watermark'

export function LicenseGate({ require: _require, children, fallback, loading }: LicenseGateProps) {
  const { state, isGated, isLoading } = useLicense()

  if (isLoading) {
    return <>{loading ?? null}</>
  }

  if (!isGated) {
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
