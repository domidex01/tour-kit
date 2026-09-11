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

  // Loading default is children, not null: `useEffect` doesn't fire during SSR,
  // so the loading state is the *only* state the server ever sees. Returning
  // null here blanks every Pro provider's subtree in SSR HTML and forces a
  // post-hydration pop-in. Consumers who want a skeleton still pass `loading`.
  if (context.isLoading) return <>{loading ?? children}</>
  if (!context.isGated) return <>{children}</>
  if (fallback) return <>{fallback}</>

  // Gated, but on a development host: keep the console warning, drop the badge.
  // The licence grants development, evaluation, testing and CI use without
  // charge, so badging a dev host would have the runtime contradict the terms
  // the package ships under. The warning is the half worth keeping — it tells a
  // developer their key is missing before they deploy.
  //
  // Guarded here rather than inside <LicenseWatermark> on purpose: that
  // component is also mounted directly by <LicenseTestMode>, whose documented
  // job is previewing the badge locally. A host check inside it would defeat
  // the one workflow that needs the badge on localhost.
  if (isDevEnvironment()) {
    return (
      <>
        {children}
        <LicenseWarning />
      </>
    )
  }

  return (
    <>
      {children}
      <LicenseWatermark />
      <LicenseWarning />
    </>
  )
}
