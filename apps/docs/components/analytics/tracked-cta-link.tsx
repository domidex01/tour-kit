'use client'

import type { CapabilityCtaPlacement } from '@/components/capability/types'
import { sendGAEvent } from '@next/third-parties/google'
import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Placement values for in-app (non-checkout) CTA links. Distinct from
 * `BuyButtonPlacement` in tracked-buy-button.tsx, which fires the revenue
 * `pricing_buy_clicked` event for the Polar checkout. These CTAs point at
 * /docs and /pricing, so they fire a top-of-funnel `cta_clicked` event —
 * the metric that actually moves at the blog stage is install intent, not
 * buy clicks (the purchase happens later, from the production watermark).
 */
export type CtaPlacement =
  | 'blog_index_footer'
  | 'blog_index_grid'
  | 'blog_post_footer'
  | 'home_after_features'
  | 'home_after_compare'
  | 'docs_footer'
  | 'docs_pro_callout'
  | 'site_banner'
  | CapabilityCtaPlacement

interface TrackedCtaLinkProps {
  href: string
  placement: CtaPlacement
  className?: string
  children: ReactNode
}

export function TrackedCtaLink({ href, placement, className, children }: TrackedCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        sendGAEvent('event', 'cta_clicked', {
          placement,
          destination: href,
        })
      }}
    >
      {children}
    </Link>
  )
}
