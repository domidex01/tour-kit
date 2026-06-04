'use client'

import { Timer } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { DISCOUNT_PERCENT, type TimeRemaining, getTimeRemaining } from '@/lib/pricing'

interface SaleState {
  /** False during SSR and the first hydration render; true after mount. */
  mounted: boolean
  /** Time left, or null once the promo ends. Null until mounted. */
  remaining: TimeRemaining | null
  /** True only once we know (post-mount) the promo has ended. */
  expired: boolean
}

/**
 * Live launch-promo state. Ticks once per second on the client.
 *
 * SSR and the first hydration render return `mounted: false` so the markup is
 * deterministic (no hydration mismatch on the live digits); the real numbers
 * only appear after the mount effect runs. During the promo window the static
 * build optimistically shows the sale, then the effect confirms (or, post-promo,
 * flips the price back to regular).
 */
export function useSaleCountdown(): SaleState {
  const [mounted, setMounted] = useState(false)
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null)

  useEffect(() => {
    setMounted(true)
    const tick = () => setRemaining(getTimeRemaining())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { mounted, remaining, expired: mounted && remaining === null }
}

const UNITS: { key: keyof TimeRemaining; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hrs' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
]

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/**
 * Compact four-cell countdown. Renders a stable `--` skeleton until mounted to
 * avoid a hydration mismatch on the live digits.
 */
export function SaleCountdown({
  remaining,
  mounted,
}: {
  remaining: TimeRemaining | null
  mounted: boolean
}) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      role="timer"
      aria-label={
        mounted && remaining
          ? `Launch offer ends in ${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes`
          : 'Launch offer countdown'
      }
    >
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className="flex min-w-[2.75rem] flex-col items-center rounded-lg border border-[var(--tk-primary)]/20 bg-fd-card px-2 py-1.5 shadow-sm"
        >
          <span className="font-mono text-lg font-bold tabular-nums leading-none tracking-tight text-fd-foreground">
            {mounted && remaining ? pad(remaining[key]) : '--'}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-fd-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Self-contained launch-promo strip for the homepage hero's left column.
 * Owns its own countdown state and renders nothing once the promo ends. The
 * whole strip links to /pricing where the discount is actioned.
 */
export function HeroSaleCountdown() {
  const sale = useSaleCountdown()

  if (sale.expired) return null

  return (
    <Link
      href="/pricing"
      className="mt-8 inline-flex flex-col items-start gap-3 rounded-xl border border-[#0197f6]/30 bg-fd-card/70 px-4 py-3 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#0197f6]/50 hover:shadow-md sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="flex items-center gap-2">
        <Timer className="h-4 w-4 shrink-0 text-[#0197f6]" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-[#02182b] dark:text-white">
          Launch sale — <span className="text-[#0197f6]">{DISCOUNT_PERCENT}% off</span> Pro
        </span>
      </span>
      <SaleCountdown remaining={sale.remaining} mounted={sale.mounted} />
    </Link>
  )
}
