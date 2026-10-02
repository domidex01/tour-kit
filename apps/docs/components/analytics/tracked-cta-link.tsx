'use client'

import type { CapabilityCtaPlacement, CapabilitySlug } from '@/components/capability/types'
import { trackEvent } from '@/lib/analytics'
import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Placement values for in-app CTA links. These point at /docs and /pricing
 * and fire a top-of-funnel `cta_clicked` event: install intent is the metric
 * that moves, since every package is free (MIT) and there is nothing to buy.
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
  | 'home_teaser'
  | `${CapabilitySlug}_teaser`

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
        trackEvent('cta_clicked', {
          placement,
          destination: href,
        })
      }}
    >
      {children}
    </Link>
  )
}
