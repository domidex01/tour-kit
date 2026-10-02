'use client'

import {
  AnnouncementBanner,
  type AnnouncementConfig,
  AnnouncementsProvider,
} from '@tour-kit/announcements'

import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'

const BANNER_ID = 'mit-relicense-2026-10'

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
 * Brand-blue strip rendered at the top of every page (mounted in
 * app/layout.tsx), stating the licence.
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
    <AnnouncementsProvider
      announcements={BANNER_ANNOUNCEMENTS}
      storage={typeof window === 'undefined' ? null : window.sessionStorage}
      storageKey="utk-docs-announcements"
    >
      <AnnouncementBanner
        id={BANNER_ID}
        useConfig={false}
        sticky={false}
        className="border-transparent bg-[var(--tk-cta)] text-[var(--tk-cta-ink)] dark:border-transparent dark:bg-[var(--tk-cta)] dark:text-[var(--tk-cta-ink)]"
      >
        <TrackedCtaLink
          href="/pricing"
          placement="site_banner"
          className="group flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-medium"
        >
          <span>
            Tour Kit is now <strong className="font-semibold">MIT</strong>: every package, free in
            production too
          </span>
          <span className="underline underline-offset-4 group-hover:no-underline">
            What changed →
          </span>
        </TrackedCtaLink>
      </AnnouncementBanner>
    </AnnouncementsProvider>
  )
}
