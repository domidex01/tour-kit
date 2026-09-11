'use client'

import type { CapabilitySlug } from '@/components/capability/types'
import { STARTER_PRICE, type TierId } from '@/lib/pricing'
import { sendGAEvent } from '@next/third-parties/google'
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

export function TrackedBuyButton({
  href,
  placement,
  className,
  children,
  value = STARTER_PRICE,
}: TrackedBuyButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        sendGAEvent('event', 'pricing_buy_clicked', {
          placement,
          destination: href,
          value,
          currency: 'USD',
        })
      }}
    >
      {children}
    </a>
  )
}
