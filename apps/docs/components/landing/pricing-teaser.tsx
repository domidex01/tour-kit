import { ArrowRight, Check, GitFork, Package, Rocket } from 'lucide-react'
import Link from 'next/link'

import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { SectionHead } from '@/components/landing/section-head'

/**
 * Figma 3945:2175 (dark) / 3792:2175 (light) — three 352x400 cards on a 32px
 * gutter, which is exactly the 1120 container. The cards used to be the three
 * price tiers; since the MIT relicense they state what "free" covers, because
 * there is no tier to sell.
 */
const CARDS = [
  {
    icon: Package,
    title: 'Every package',
    body: 'Tours, hints, checklists, announcements, surveys, analytics, scheduling, media and the AI assistant.',
    points: ['React, Vue and Svelte', 'No feature gates', 'shadcn/ui compatible'],
  },
  {
    icon: Rocket,
    title: 'Production included',
    body: 'MIT covers commercial use in production, on as many projects as you ship.',
    points: ['No licence key', 'No badge', 'Nothing calls home'],
  },
  {
    icon: GitFork,
    title: 'Yours to fork',
    body: 'Read it, change it, ship your fork. The licence travels with the code.',
    points: ['Public monorepo', 'Typed end to end', 'Headless by default'],
  },
] as const

interface PricingTeaserProps {
  /** CTA analytics dimension; capability pages pass `<slug>_teaser`. */
  placement?: CtaPlacement
}

export function PricingTeaser({ placement = 'home_teaser' }: PricingTeaserProps) {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead
          title={
            <>
              Free. MIT.
              <br />
              All of it.
            </>
          }
        >
          Every package is MIT-licensed: use it in development and in production, commercially, with
          no licence key, no badge and no per-seat invoice.
        </SectionHead>

        {/* Three across only from `lg`: at `md` each column is ~230px and the
            point rows wrap mid-phrase. */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="relative flex flex-col rounded-3xl border border-[var(--tk-card-edge)] bg-fd-muted p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fd-secondary">
                    <Icon className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
                  </span>
                  <span className="block text-[18px] font-bold leading-7 text-fd-foreground">
                    {card.title}
                  </span>
                </div>
                <p className="mt-6 text-[15px] leading-6 text-fd-muted-foreground">{card.body}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {card.points.map((item) => (
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
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <TrackedCtaLink
            href="/docs/getting-started"
            placement={placement}
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-cta)] px-6 text-[15px] font-semibold leading-6 text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedCtaLink>
          <Link
            href="/pricing#cloud"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-[var(--tk-hairline)] px-6 text-[15px] font-semibold leading-6 text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
          >
            Tour Kit Cloud waitlist
          </Link>
        </div>
      </div>
    </section>
  )
}
