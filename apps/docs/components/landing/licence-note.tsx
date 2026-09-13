'use client'

import { Scale } from 'lucide-react'
import Link from 'next/link'

import { STARTER_PRICE, formatPrice } from '@/lib/pricing'

/**
 * Homepage hero strip stating the licence model, linking to /pricing.
 *
 * Replaces `HeroSaleCountdown`, which returned `null` on every render from
 * 2026-06-18 (the launch promo's end) until 2026-09-11 — the hero's secondary
 * CTA was silently empty for three months. This one has no expiry to fall off:
 * the model it states is the model.
 */
export function HeroLicenceNote() {
  return (
    <Link
      href="/pricing"
      className="mt-8 inline-flex items-center gap-3 rounded-xl border border-[#0197f6]/30 bg-fd-card/70 px-4 py-3 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#0197f6]/50 hover:shadow-md"
    >
      <Scale className="h-4 w-4 shrink-0 text-[#0197f6]" aria-hidden="true" />
      <span className="text-[13px] font-semibold text-[#02182b] dark:text-white">
        Free in development —{' '}
        <span className="text-[#0197f6]">from {formatPrice(STARTER_PRICE)} one-time</span> when you
        ship
      </span>
    </Link>
  )
}
