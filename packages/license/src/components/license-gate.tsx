'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import { isDevEnvironment } from '../lib/domain'
import type { LicenseGateProps } from '../types'
import { LicenseWarning } from './license-warning'
import { LicenseWatermark } from './license-watermark'

/**
 * Soft gate for Tour Kit Pro packages.
 *
 * Renders children unconditionally; on non-localhost hosts without a valid
 * license, layers a single small badge ({@link LicenseWatermark}) and a
 * dev-only console warning ({@link LicenseWarning}) on top. Tolerates a
 * missing `<LicenseProvider>` so Pro packages stay rendered during evaluation.
 */
export function LicenseGate({ require: _require, children, fallback, loading }: LicenseGateProps) {
  const context = useContext(LicenseContext)

  // No-provider branch. Provider's internal dev short-circuit cannot help here,
  // so check the host directly to keep localhost quiet.
  if (context === null) {
    if (isDevEnvironment()) return <>{children}</>
    return (
      <>
        {children}
        <LicenseWatermark />
        <LicenseWarning />
      </>
    )
  }

  if (context.isLoading) return <>{loading ?? null}</>
  if (!context.isGated) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <>
      {children}
      <LicenseWatermark />
      <LicenseWarning />
    </>
  )
}
