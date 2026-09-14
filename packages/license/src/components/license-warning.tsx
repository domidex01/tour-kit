'use client'

import { useEffect } from 'react'
import { warnUnlicensed } from '../lib/watermark-dom'

export { __resetLicenseWarningForTests } from '../lib/watermark-dom'

/**
 * The unlicensed console warning, as a React component.
 *
 * A binding over `warnUnlicensed()`, which holds the once-per-page-load guard
 * and the message itself so the non-React bindings warn in exactly the same
 * words. Prints in development builds only.
 */
export function LicenseWarning() {
  useEffect(() => {
    warnUnlicensed()
  }, [])

  return null
}
