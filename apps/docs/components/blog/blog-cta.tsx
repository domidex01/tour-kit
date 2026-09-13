import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { ClosingCta } from '@/components/landing/closing-cta'
import { ArrowRight } from 'lucide-react'

interface BlogCtaProps {
  /**
   * `band` — full-width conversion band for the end of the list (after
   * pagination, before the footer): highest-intent slot.
   * `card` — native-looking card spliced into the post grid to catch
   * scanners mid-scroll without an interstitial.
   */
  variant: 'band' | 'card'
  /**
   * The index draws this band full-bleed (BlogHero's frame, 3880:2040, runs
   * the backdrop art out to both edges below the pagination); a post keeps it
   * inside its reading column.
   */
  fullBleed?: boolean
  placement: 'blog_index_footer' | 'blog_index_grid' | 'blog_post_footer'
}

/**
 * Free-first blog CTA. The job here is install intent, not revenue: the Pro
 * suite runs free in local development (dev bypass) and the production
 * badge — removed by the one-time licence — is what actually converts
 * later, inside the reader's own codebase. So we lead with `npm install` and
 * reframe the price as "pay when you ship", not "pay to start".
 */
export function BlogCta({ variant, placement, fullBleed = false }: BlogCtaProps) {
  if (variant === 'card') {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-fd-primary)]/30 bg-gradient-to-b from-[var(--color-fd-primary)]/5 to-transparent p-4 dark:from-[var(--color-fd-primary)]/10">
        <div>
          <span className="text-[11px] font-semibold text-[var(--color-fd-primary)]">
            Get started
          </span>
          <p className="mt-2 font-medium leading-snug text-fd-foreground">
            Ship onboarding, not config.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
            <code className="rounded bg-fd-muted px-1 py-0.5 text-[12px]">
              npm i @tour-kit/core
            </code>{' '}
            , free while you build. Every package works unlicensed in development; a one-time
            licence from $9.99 removes the badge.
          </p>
        </div>
        <TrackedCtaLink
          href="/builder"
          placement={placement}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-fd-primary)] transition-opacity hover:opacity-80"
        >
          Start free
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </TrackedCtaLink>
      </div>
    )
  }

  // Conversion band closing the list and each post. Same anatomy as the home
  // page's closing CTA (Figma 3945:2747) so the blog and the landing page
  // close on one note, with an added pricing button the homepage omits.
  //
  // Boxed by default: on a post it sits inside a reading column, so it keeps a
  // rounded edge and trades the frame's 194px of vertical air for something a
  // column can carry. `fullBleed` drops both and lets it close the page the
  // way every other ClosingCta does.
  return (
    <ClosingCta
      heading="Own your onboarding."
      headingAccent="Ship it today."
      subtext="No vendor lock-in. No monthly invoice. Just code you control and users who convert."
      installCmd="pnpm add @tour-kit/core"
      ctaLabel="Get started"
      ctaHref="/builder"
      secondaryLabel="See pricing"
      secondaryHref="/pricing"
      placement={placement}
      className={
        fullBleed
          ? undefined
          : 'mt-12 overflow-hidden rounded-2xl border border-[var(--tk-card-edge)] py-16 sm:py-20 lg:px-8 lg:py-20'
      }
    />
  )
}
