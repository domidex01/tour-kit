import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { SectionBackdrop } from '@/components/landing/section-backdrop'
import { ArrowRight, Sparkles } from 'lucide-react'

interface CtaBandProps {
  /**
   * Mid-page placement, used as the `cta_clicked` analytics dimension so each
   * band's pull can be measured separately. Distinct from the blog placements
   * in `CtaPlacement`.
   */
  placement: Extract<
    CtaPlacement,
    'home_after_features' | 'home_after_compare' | `${string}_after_features`
  >
  /** Short uppercase pill label above the heading. */
  eyebrow: string
  heading: string
  subtext: string
  /**
   * First-person primary button label ("Build my first tour"). First-person
   * phrasing — "my" not "your" — is the single highest-leverage CTA-copy
   * tweak (CXL / Unbounce).
   */
  ctaLabel: string
  /**
   * Risk-reducing microcopy under the buttons. tour-kit has no trial/signup,
   * so the objection we remove is cost/commitment ("no signup, no credit
   * card, no subscription").
   */
  reassurance: string
  /** Primary button destination. Defaults to the getting-started docs. */
  primaryHref?: string
  /** Secondary button destination. Defaults to /pricing. */
  secondaryHref?: string
  /** Secondary button label. Defaults to "See pricing". */
  secondaryLabel?: string
}

/**
 * Mid-page conversion band for the long homepage stretch (Features → Packages
 * → comparisons). Shares the site's hero/footer language — the lighthouse
 * backdrop with a frosted-glass card floating over it — so the homepage closes
 * on a consistent note at every CTA. Taller than a plain band to carry the
 * background image with presence.
 */
export function CtaBand({
  placement,
  eyebrow,
  heading,
  subtext,
  ctaLabel,
  reassurance,
  primaryHref = '/builder',
  secondaryHref = '/pricing',
  secondaryLabel = 'See pricing',
}: CtaBandProps) {
  return (
    <section className="relative px-6 py-8 sm:px-8 lg:px-12">
      <SectionBackdrop />
      <div className="relative mx-auto h-[571px] max-w-[1120px] max-lg:h-auto">
        {/* CtaCard (3945:2051) is a POSITIONING BOX, never a visible card.
            In the frame it carries a rounded corner and a drop-shadow, but its
            only child is `ImageSlot/cta-island-twilight` (3945:2052 dark,
            3792:2052 light) — an EMPTY rectangle, a slot named after a file in
            public/ that was never filled. A drop-shadow over nothing paints
            nothing, so the frame shows one card here, not two. Giving this box
            a `box-shadow` instead does paint, which is what put a second card
            on the page; and its `overflow-hidden` clipped the backdrop's line
            art. Both are gone — it now only holds the 571px height and the
            panel's inset.

            Nothing references public/cta-island-{day,twilight}.avif any more
            since the blog band moved onto <ClosingCta>; they are kept only so
            the slot can be filled later without a re-export. */}

        {/* Frosted-glass content card, floating over the backdrop */}
        <div className="relative px-5 py-16 sm:px-10 lg:pt-[110px] lg:pr-[45px] lg:pb-[109px] lg:pl-[73px]">
          <div className="mx-auto flex max-w-[1002px] flex-col items-start gap-8 rounded-2xl border border-[var(--tk-card-edge)] bg-fd-background/55 p-8 shadow-xl backdrop-blur-xl sm:p-10 lg:h-[352px] lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:py-0 lg:px-[87px] dark:bg-fd-background/50">
            <div className="lg:w-[509px] lg:shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-fd-primary)]/30 bg-[var(--color-fd-primary)]/10 px-3 py-[3px] text-[11px] font-semibold uppercase leading-4 tracking-wide text-[var(--color-fd-primary)]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {eyebrow}
              </span>
              <h2 className="mt-3 text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.042] tracking-[-0.015em] text-fd-foreground lg:max-w-[440px]">
                {heading}
              </h2>
              <p className="mt-2 text-[16px] leading-[1.53] text-fd-muted-foreground">{subtext}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2.5 sm:items-end lg:w-[319px]">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:flex-nowrap lg:justify-end">
                <TrackedCtaLink
                  href={primaryHref}
                  placement={placement}
                  className="group inline-flex h-[45px] items-center justify-center gap-2 rounded-lg bg-[var(--tk-cta)] px-6 text-[14px] font-semibold lg:min-w-[186px] whitespace-nowrap text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/25 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
                >
                  {ctaLabel}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </TrackedCtaLink>
                <TrackedCtaLink
                  href={secondaryHref}
                  placement={placement}
                  className="inline-flex h-[45px] items-center justify-center rounded-lg border border-[var(--tk-hairline)] bg-fd-background/70 px-6 text-[14px] font-semibold lg:min-w-[121px] whitespace-nowrap text-fd-foreground backdrop-blur-sm transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
                >
                  {secondaryLabel}
                </TrackedCtaLink>
              </div>
              <p className="text-[12px] text-fd-muted-foreground">{reassurance}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
