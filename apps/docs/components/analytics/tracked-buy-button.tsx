'use client'

import type { CapabilitySlug } from '@/components/capability/types'
import { sendGAEvent } from '@next/third-parties/google'
import type { ReactNode } from 'react'

export type BuyButtonPlacement = 'pricing_page' | 'home_teaser' | `${CapabilitySlug}_teaser`

interface TrackedBuyButtonProps {
  href: string
  placement: BuyButtonPlacement
  className?: string
  children: ReactNode
  /** Price (USD) reported to GA as the conversion value. Defaults to 99. */
  value?: number
}

export function TrackedBuyButton({
  href,
  placement,
  className,
  children,
  value = 99,
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
