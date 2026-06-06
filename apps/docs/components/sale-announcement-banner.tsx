'use client'

import {
  AnnouncementBanner,
  type AnnouncementConfig,
  AnnouncementsProvider,
} from '@tour-kit/announcements'
import { LicenseProvider } from '@tour-kit/license'
import type { ReactNode } from 'react'

import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { useSaleCountdown } from '@/components/landing/sale-countdown'
import { DISCOUNT_PERCENT } from '@/lib/pricing'

const BANNER_ID = 'launch-sale-2026-06'

/**
 * Launch-promo banner config, dogfooding @tour-kit/announcements on our own
 * site. `frequency: 'session'` + the sessionStorage adapter below means a
 * dismissal hides the banner for the current browser session only — it
 * returns on the next visit while the promo window (lib/pricing.ts) is open.
 */
const SALE_ANNOUNCEMENTS: AnnouncementConfig[] = [
  {
    id: BANNER_ID,
    variant: 'banner',
    priority: 'high',
    frequency: 'session',
    bannerOptions: { position: 'top', sticky: false, dismissable: true },
  },
]

/**
 * Self-issued Polar license for usertourkit.com itself — announcements is a
 * Pro package, and without a valid key `<LicenseGate>` renders the
 * "Unlicensed" watermark badge on production hosts (localhost is bypassed).
 * Set both vars in the deploy environment (Dokploy), per the env-var rule.
 */
const LICENSE_KEY = process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY
const POLAR_ORG_ID = process.env.NEXT_PUBLIC_POLAR_ORG_ID

function MaybeLicensed({ children }: { children: ReactNode }) {
  if (!LICENSE_KEY) return <>{children}</>
  return (
    <LicenseProvider licenseKey={LICENSE_KEY} organizationId={POLAR_ORG_ID}>
      {children}
    </LicenseProvider>
  )
}

/**
 * Brand-blue launch-sale strip rendered at the top of every page (mounted in
 * app/layout.tsx). Renders nothing once the promo ends (SALE_END_ISO).
 *
 * SSR renders null — the announcement only becomes visible after the
 * provider's auto-show effect runs on the client, so there is no hydration
 * mismatch and no banner in the static HTML after the sale.
 */
export function SaleAnnouncementBanner() {
  const sale = useSaleCountdown()
  if (sale.expired) return null

  return (
    <MaybeLicensed>
      <AnnouncementsProvider
        announcements={SALE_ANNOUNCEMENTS}
        storage={typeof window === 'undefined' ? null : window.sessionStorage}
        storageKey="utk-docs-announcements"
      >
        <AnnouncementBanner
          id={BANNER_ID}
          useConfig={false}
          sticky={false}
          className="border-transparent bg-[#0197f6] text-white dark:border-transparent dark:bg-[#0197f6] dark:text-white"
        >
          <TrackedCtaLink
            href="/pricing"
            placement="site_banner"
            className="group flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-medium"
          >
            <span>
              Launch sale — <strong className="font-semibold">{DISCOUNT_PERCENT}% off</strong> Tour
              Kit Pro
            </span>
            {sale.mounted && sale.remaining ? (
              <span className="hidden text-white/80 sm:inline">
                · ends in {sale.remaining.days}d {sale.remaining.hours}h
              </span>
            ) : null}
            <span className="underline underline-offset-4 group-hover:no-underline">
              Get the deal →
            </span>
          </TrackedCtaLink>
        </AnnouncementBanner>
      </AnnouncementsProvider>
    </MaybeLicensed>
  )
}
