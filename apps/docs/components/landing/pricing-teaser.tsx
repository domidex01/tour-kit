import { ArrowRight, Check, Code2, Sparkles, Users, Zap } from 'lucide-react'

import {
  type BuyButtonPlacement,
  TrackedBuyButton,
} from '@/components/analytics/tracked-buy-button'
import { SectionHead } from '@/components/landing/section-head'
import { checkoutUrl } from '@/lib/polar-config'
import { TIERS, formatPrice, formatProjects } from '@/lib/pricing'

/**
 * Figma 3945:2175 (dark) / 3792:2175 (light) — three 352x400 plan cards on a
 * 32px gutter, which is exactly the 1120 container.
 *
 * The cards are DERIVED from `TIERS` rather than written out here. The Figma
 * frames carried placeholder names and prices ("Core $39 / Pro $99 / Team
 * $299") that never matched any pricing the product has had, and a hardcoded
 * copy is how the site came to advertise a price checkout does not charge.
 * `TIERS` is the single source `structured-data.tsx` also reads, so the markup
 * Google sees cannot drift from the rendered card.
 *
 * Every tier now has its own Polar SKU (`POLAR_CHECKOUT_URLS` is typed
 * `Record<TierId, string>`), so all three cards are `TrackedBuyButton`s — the
 * design's "only Pro checks out, the rest route to /pricing" no longer holds.
 */
const ICONS = [Code2, Zap, Users] as const

/** True of every tier: the tiers differ only in how many projects a key covers. */
const SHARED_FEATURES = [
  'Serve it to end users — no badge',
  'Every package, no feature gates',
  'All future updates — no subscription',
  'Converts to MIT on its Change Date',
] as const

const PLANS = TIERS.map((tier, i) => ({
  id: tier.id,
  name: tier.name,
  scope: formatProjects(tier.projects),
  price: formatPrice(tier.price),
  icon: ICONS[i % ICONS.length],
  features: SHARED_FEATURES,
  cta: `Get ${tier.name}`,
  href: checkoutUrl(tier.id),
  featured: tier.highlight,
  /** Per-tier GA conversion value; without it every card reports Starter's. */
  value: tier.price,
}))

interface PricingTeaserProps {
  /** Buy-click analytics dimension; capability pages pass `<slug>_teaser`. */
  placement?: BuyButtonPlacement
}

export function PricingTeaser({ placement = 'home_teaser' }: PricingTeaserProps) {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead
          title={
            <>
              Own your code.
              <br />
              Pay once, when you ship.
            </>
          }
        >
          Every package is free while you build — development, evaluation, CI, the lot. A licence is
          for serving it to end users, and it is a one-time purchase, never a subscription: no
          renewals, no seats, no per-MAU invoice.
        </SectionHead>

        {/* 352 / 352 / 352 on a 32px gutter. Three across only from `lg`: at
            `md` each column is ~230px and the feature rows wrap mid-phrase. */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const label = (
              <>
                {plan.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )
            const buttonBase =
              'mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-lg px-6 text-[15px] font-semibold leading-6 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]'

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl bg-fd-muted p-8 transition-all duration-300 hover:-translate-y-0.5 ${
                  plan.featured
                    ? 'border-2 border-[var(--color-fd-primary)] hover:shadow-lg'
                    : 'border border-[var(--tk-card-edge)] hover:shadow-md'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-cta)] px-3 py-1 text-[11px] font-semibold leading-[17px] text-[var(--tk-cta-ink)]">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Most popular
                  </span>
                ) : null}

                <div className="flex h-12 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      plan.featured ? 'bg-[var(--tk-cta)]' : 'bg-fd-secondary'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        plan.featured ? 'text-[var(--tk-cta-ink)]' : 'text-fd-muted-foreground'
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                  <span>
                    <span className="block text-[18px] font-bold leading-7 text-fd-foreground">
                      {plan.name}
                    </span>
                    <span className="block text-[13px] leading-5 text-fd-muted-foreground">
                      {plan.scope}
                    </span>
                  </span>
                </div>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[36px] font-extrabold leading-10 tracking-[-0.02em] text-fd-foreground">
                    {plan.price}
                  </span>
                  <span className="text-[15px] leading-6 text-fd-muted-foreground">one-time</span>
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[14px] leading-[21px] text-fd-muted-foreground"
                    >
                      <Check
                        className={`mt-[2px] h-4 w-4 shrink-0 ${
                          plan.featured
                            ? 'text-[var(--color-fd-primary)]'
                            : 'text-[var(--tk-success)]'
                        }`}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                {plan.featured ? (
                  <TrackedBuyButton
                    href={plan.href}
                    placement={placement}
                    value={plan.value}
                    className={`${buttonBase} bg-[var(--tk-cta)] text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30`}
                  >
                    {label}
                  </TrackedBuyButton>
                ) : (
                  <TrackedBuyButton
                    href={plan.href}
                    placement={placement}
                    value={plan.value}
                    className={`${buttonBase} border border-[var(--tk-hairline)] text-fd-foreground hover:bg-fd-secondary hover:shadow-md`}
                  >
                    {label}
                  </TrackedBuyButton>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
