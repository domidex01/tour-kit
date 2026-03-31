'use client'

import { useEffect } from 'react'

export function LicenseWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return

    console.warn(
      '%c[TourKit]%c This application is using Tour Kit Pro without a valid license.\nPurchase a license at https://tourkit.dev/pricing',
      'color: #e74c3c; font-weight: bold',
      'color: inherit'
    )
  }, [])

  return null
}
