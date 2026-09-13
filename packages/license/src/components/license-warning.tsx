'use client'

import { useEffect } from 'react'

// Module-level guard so the unlicensed warning prints once per page load even
// when several Pro packages each mount a <LicenseGate> (and therefore a
// <LicenseWarning>). Also absorbs React Strict Mode's double effect invocation.
let hasWarned = false

/** Test-only: reset the once-per-session warning guard. */
export function __resetLicenseWarningForTests(): void {
  hasWarned = false
}

export function LicenseWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (hasWarned) return
    hasWarned = true

    console.warn(
      '%c[TourKit]%c This application is using Tour Kit Pro without a valid license.\nA production licence is a one-time purchase from $9.99 — https://usertourkit.com/pricing',
      'color: #e74c3c; font-weight: bold',
      'color: inherit'
    )
  }, [])

  return null
}
