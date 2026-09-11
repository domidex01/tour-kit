import { ArrowRight, Check, Code2, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

import {
  type BuyButtonPlacement,
  TrackedBuyButton,
} from '@/components/analytics/tracked-buy-button'
import { SectionHead } from '@/components/landing/section-head'
import { POLAR_CHECKOUT_URL } from '@/lib/polar-config'

const FREE_HIGHLIGHTS = [
  'Product tours & spotlight overlays',
  'Persistent hints & beacons',
  'Full TypeScript, WCAG 2.1 AA',
  'Unlimited sites — MIT licensed',
]

const PRO_HIGHLIGHTS = [
  'Everything in Free',
  'Analytics, checklists, announcements',
  'Feature adoption & scheduling',
  'All future updates — no subscription',
]

interface PricingTeaserProps {
  /** Buy-click analytics dimension; capability pages pass `<slug>_teaser`. */
  placement?: BuyButtonPlacement
}

/**
 * Figma 3792:2175 (light) / 3945:2175 (dark).
 *
 * The mockup draws THREE plan cards — Core $39, Pro $99, Team $299. Only the
 * $99 exists: `POLAR_CHECKOUT_URL` is a single SKU and /pricing sells exactly
 * two tiers, Free and Pro. So this takes the design's card recipe (24px
 * radius, 32px padding, the 40px icon tile, the 36px extrabold price, the
 * ribbon on the featured card) and fills it with the two tiers a visitor can
 * actually reach. Adding the other two would put a Buy button on the homepage
 * with nothing behind it.
 */
export function PricingTeaser({ placement = 'home_teaser' }: PricingTeaserProps) {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead
          title={
            <>
              Own your code.
              <br />
              Pay once, not forever.
            </>
          }
        >
          Three MIT packages cover most tours, hints, and onboarding. Need analytics, checklists, or
          announcements? The full suite is a{' '}
          <strong className="font-semibold text-fd-foreground">$99 one-time</strong> license — not a
          monthly invoice.
        </SectionHead>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-3xl border border-[var(--tk-card-edge)] bg-fd-muted p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fd-secondary">
                <Code2 className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[18px] font-bold leading-7 text-fd-foreground">
                  Free forever
                </span>
                <span className="block text-[13px] leading-5 text-fd-muted-foreground">
                  3 MIT packages
                </span>
              </span>
            </div>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-[36px] font-extrabold leading-10 tracking-[-0.02em] text-fd-foreground">
                $0
              </span>
              <span className="text-[15px] leading-6 text-fd-muted-foreground">
                unlimited sites
              </span>
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {FREE_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] leading-[21px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-[2px] h-4 w-4 shrink-0 text-[var(--tk-success)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/builder"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-[var(--tk-hairline)] px-6 text-[15px] font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-secondary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Pro — the featured card: a 2px brand edge and the ribbon. */}
          <div className="relative flex flex-col rounded-3xl border-2 border-[var(--color-fd-primary)] bg-fd-muted p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <span className="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-cta)] px-3 py-1 text-[11px] font-semibold leading-[17px] text-[var(--tk-cta-ink)]">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Most popular
            </span>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--tk-cta)]">
                <Zap className="h-5 w-5 text-[var(--tk-cta-ink)]" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[18px] font-bold leading-7 text-fd-foreground">
                  Pro
                </span>
                <span className="block text-[13px] leading-5 text-fd-muted-foreground">
                  8 extended packages
                </span>
              </span>
            </div>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-[36px] font-extrabold leading-10 tracking-[-0.02em] text-fd-foreground">
                $99
              </span>
              <span className="text-[15px] leading-6 text-fd-muted-foreground">
                lifetime license
              </span>
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {PRO_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] leading-[21px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-[2px] h-4 w-4 shrink-0 text-[var(--color-fd-primary)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <TrackedBuyButton
              href={POLAR_CHECKOUT_URL}
              placement={placement}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-cta)] px-6 text-[15px] font-semibold text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              Buy Pro license
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedBuyButton>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/pricing"
            className="text-[13px] font-semibold text-[var(--color-fd-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See full pricing &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
