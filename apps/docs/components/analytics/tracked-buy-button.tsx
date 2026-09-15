'use client'

import type { CapabilitySlug } from '@/components/capability/types'
import { trackEvent } from '@/lib/analytics'
import { ATTRIBUTION_PARAMS, withAttribution } from '@/lib/polar-config'
import { STARTER_PRICE, type TierId } from '@/lib/pricing'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * `pricing_page_${TierId}` is what makes the three tiers distinguishable in
 * GA4: `placement` is an event-scoped custom dimension, so without a per-tier
 * value all three Buy buttons collapse into one undifferentiated total and the
 * ladder cannot be evaluated.
 */
export type BuyButtonPlacement =
  | 'pricing_page'
  | `pricing_page_${TierId}`
  | 'home_teaser'
  | `${CapabilitySlug}_teaser`

interface TrackedBuyButtonProps {
  href: string
  placement: BuyButtonPlacement
  className?: string
  children: ReactNode
  /** Price (USD) reported to GA as the conversion value. Defaults to Starter. */
  value?: number
}

const STORAGE_KEY = 'tk_attribution'

/**
 * The visitor's attribution query string, remembered for the session so it
 * survives a wander through the docs between landing and buying.
 *
 * ponytail: first touch is captured when a Buy button mounts, not on every
 * route. Every page that can sell carries one — and the watermark badge points
 * straight at `/pricing`, which is such a page — so the case this exists for is
 * covered. Ceiling: someone who arrives with a UTM on a page with no Buy button
 * and reaches checkout without passing one is unattributed. Upgrade path: call
 * this from the analytics component in the root layout instead.
 */
function readAttributionSearch(): string {
  const live = window.location.search
  try {
    if (ATTRIBUTION_PARAMS.some((key) => new URLSearchParams(live).has(key))) {
      sessionStorage.setItem(STORAGE_KEY, live)
      return live
    }
    return sessionStorage.getItem(STORAGE_KEY) ?? live
  } catch {
    // Private mode or blocked storage. Current-page attribution still works.
    return live
  }
}

export function TrackedBuyButton({
  href,
  placement,
  className,
  children,
  value = STARTER_PRICE,
}: TrackedBuyButtonProps) {
  // Starts as the bare checkout URL and gains attribution after hydration.
  // Rewriting in `onClick` instead would miss middle-click, "open in new tab"
  // and "copy link address", which are how a developer audience opens a
  // purchase page.
  const [destination, setDestination] = useState(href)

  useEffect(() => {
    setDestination(withAttribution(href, readAttributionSearch()))
  }, [href])

  return (
    <a
      href={destination}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        trackEvent('pricing_buy_clicked', {
          placement,
          destination,
          value,
          currency: 'USD',
        })
      }}
    >
      {children}
    </a>
  )
}
