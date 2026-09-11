'use client'

import {
  AnnouncementBanner,
  type AnnouncementConfig,
  AnnouncementsProvider,
} from '@tour-kit/announcements'
import { LicenseProvider } from '@tour-kit/license'
import type { ReactNode } from 'react'

import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { STARTER_PRICE, formatPrice } from '@/lib/pricing'

const BANNER_ID = 'licence-model-2026-09'

/**
 * Banner config, dogfooding @tour-kit/announcements on our own site.
 * `frequency: 'session'` + the sessionStorage adapter below means a dismissal
 * hides the banner for the current browser session only — it returns on the
 * next visit.
 */
const BANNER_ANNOUNCEMENTS: AnnouncementConfig[] = [
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
 * Brand-blue strip rendered at the top of every page (mounted in
 * app/layout.tsx), stating the licence model.
 *
 * It used to be the launch-sale banner and returned `null` on every render
 * from 2026-06-18 to 2026-09-11 because the promo had expired — the site-wide
 * banner slot was silently empty for three months. There is no expiry here to
 * fall off.
 *
 * SSR renders null — the announcement only becomes visible after the
 * provider's auto-show effect runs on the client, so there is no hydration
 * mismatch.
 */
export function SaleAnnouncementBanner() {
  return (
    <MaybeLicensed>
      <AnnouncementsProvider
        announcements={BANNER_ANNOUNCEMENTS}
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
              Tour Kit is <strong className="font-semibold">free in development</strong> —{' '}
              {formatPrice(STARTER_PRICE)} one-time when you ship
            </span>
            <span className="underline underline-offset-4 group-hover:no-underline">
              See the tiers →
            </span>
          </TrackedCtaLink>
        </AnnouncementBanner>
      </AnnouncementsProvider>
    </MaybeLicensed>
  )
}
