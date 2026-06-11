import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
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
  primaryHref = '/docs/getting-started',
  secondaryHref = '/pricing',
  secondaryLabel = 'See pricing',
}: CtaBandProps) {
  return (
    <section className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-3xl border border-fd-border/50 shadow-2xl">
        {/* Background images — cute 3D lighthouse diorama, day for light mode
            and twilight for dark mode */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/cta-island-day.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-50 dark:hidden"
          />
          <img
            src="/cta-island-twilight.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 hidden h-full w-full object-cover opacity-50 dark:block"
          />
        </div>

        {/* Dot grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Soft brand glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#0197f6]/20 blur-3xl"
        />

        {/* Frosted-glass content card, floating over the backdrop */}
        <div className="relative px-5 py-20 sm:px-10 sm:py-28 lg:py-36">
          <div className="mx-auto flex max-w-[960px] flex-col items-start gap-7 rounded-2xl border border-fd-border/50 bg-fd-background/55 p-8 shadow-xl backdrop-blur-xl sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 dark:bg-fd-background/50">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0197f6]/30 bg-[#0197f6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0197f6]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {eyebrow}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-fd-foreground sm:text-3xl">
                {heading}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-fd-muted-foreground">{subtext}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2.5 sm:items-end">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <TrackedCtaLink
                  href={primaryHref}
                  placement={placement}
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/25 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
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
                  className="inline-flex items-center rounded-lg border border-fd-border bg-fd-background/70 px-6 py-3 text-[14px] font-semibold text-fd-foreground backdrop-blur-sm transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
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
