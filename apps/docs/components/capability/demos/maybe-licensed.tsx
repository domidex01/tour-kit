'use client'

import { LicenseProvider } from '@tour-kit/license'
import type { ReactNode } from 'react'

/**
 * Same pattern as the site banner (components/sale-announcement-banner.tsx):
 * the Pro live demos (checklists, surveys, announcements) dogfood
 * license-gated packages, so on production hosts they need the site's own
 * Polar license or `<LicenseGate>` renders the "Unlicensed" watermark badge.
 * localhost is bypassed. Both vars are set in the deploy environment.
 */
const LICENSE_KEY = process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY
const POLAR_ORG_ID = process.env.NEXT_PUBLIC_POLAR_ORG_ID

export function MaybeLicensed({ children }: { children: ReactNode }) {
  if (!LICENSE_KEY) return <>{children}</>
  return (
    <LicenseProvider licenseKey={LICENSE_KEY} organizationId={POLAR_ORG_ID}>
      {children}
    </LicenseProvider>
  )
}
