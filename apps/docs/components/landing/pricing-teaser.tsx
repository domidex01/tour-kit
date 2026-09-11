import { ArrowRight, Check, Code2, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

import {
  type BuyButtonPlacement,
  TrackedBuyButton,
} from '@/components/analytics/tracked-buy-button'
import { checkoutUrl } from '@/lib/polar-config'
import { STARTER_PRICE, formatPrice } from '@/lib/pricing'

const DEV_HIGHLIGHTS = [
  'Every package — no feature gates',
  'Local development & evaluation',
  'CI, tests & preview deploys',
  'Read and modify the source',
]

const PROD_HIGHLIGHTS = [
  'Serve it to end users, no badge',
  '1, 5 or unlimited projects',
  'All future updates — no subscription',
  'Converts to MIT on its Change Date',
]

interface PricingTeaserProps {
  /** Buy-click analytics dimension; capability pages pass `<slug>_teaser`. */
  placement?: BuyButtonPlacement
}

export function PricingTeaser({ placement = 'home_teaser' }: PricingTeaserProps) {
  return (
    <section className="px-6 py-28 sm:px-8 md:py-36 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {/* Header — left-aligned to alternate with Packages (right) */}
        <div className="mb-16 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Own your code.
            <br />
            Pay once, when you ship.
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Every package is free while you build — development, evaluation, CI, the lot. A licence
            is for serving it to end users, and it is a{' '}
            <strong className="text-fd-foreground">
              one-time purchase from {formatPrice(STARTER_PRICE)}
            </strong>{' '}
            — not a monthly invoice.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Free tier */}
          <div className="group flex flex-col rounded-xl border border-fd-border bg-fd-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fd-border bg-fd-muted">
                <Code2 className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fd-foreground">In development</h3>
                <p className="text-[13px] text-fd-muted-foreground">Every package, no key</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $0
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">always</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {DEV_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/builder"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-6 py-3 text-[15px] font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Pro tier */}
          <div className="group relative flex flex-col rounded-xl border-2 border-[var(--tk-primary)] bg-fd-card p-8 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-primary)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[var(--tk-primary)]/20">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              One-time purchase
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tk-primary)]/10 ring-1 ring-[var(--tk-primary)]/20">
                <Zap className="h-5 w-5 text-[var(--tk-primary)]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fd-foreground">In production</h3>
                <p className="text-[13px] text-fd-muted-foreground">Three one-time tiers</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">from</span>
              <span className="ml-1.5 text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                {formatPrice(STARTER_PRICE)}
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">one-time</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PROD_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tk-primary)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <TrackedBuyButton
              href={checkoutUrl('starter')}
              placement={placement}
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Get a licence
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedBuyButton>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/pricing"
            className="font-mono text-[13px] font-semibold text-[var(--tk-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See full pricing &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
