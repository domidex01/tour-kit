'use client'

import { sendGAEvent } from '@next/third-parties/google'
import type { ReactNode } from 'react'

export type BuyButtonPlacement = 'pricing_page' | 'home_teaser'

interface TrackedBuyButtonProps {
  href: string
  placement: BuyButtonPlacement
  className?: string
  children: ReactNode
}

export function TrackedBuyButton({ href, placement, className, children }: TrackedBuyButtonProps) {
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
          value: 99,
          currency: 'USD',
        })
      }}
    >
      {children}
    </a>
  )
}
