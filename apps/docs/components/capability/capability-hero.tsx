import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import type { CapabilitySlug } from '@/components/capability/types'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Terminal } from 'lucide-react'
import Link from 'next/link'

interface CapabilityHeroProps {
  slug: CapabilitySlug
  /** Uppercase pill above the H1, names the capability. */
  eyebrow: string
  /** Outcome-flavored H1 — first line plain, second line brand-blue. */
  heading: string
  headingAccent: string
  /** One sentence naming the package and the outcome. */
  subhead: string
  /** Primary CTA — install/Studio for free pages, try-in-dev for Pro. */
  primaryLabel: string
  primaryHref: string
  /** Secondary CTA — "Read the docs →" (free) or "See pricing" (Pro). */
  secondaryLabel: string
  secondaryHref: string
  /**
   * Free pages: the `pnpm add @tour-kit/<pkg>` mono block (home pattern).
   * Pro pages omit it and show the reassurance line instead.
   */
  installCmd?: string
  /**
   * Pro pages: "Runs free in dev — pay once ($99) when you ship." under the
   * buttons. The licensing model means activation precedes purchase.
   */
  reassurance?: string
  /** Facts line under the CTAs ("< 10KB gzipped · TypeScript strict…"). */
  factsLine: string
}

/**
 * The capability pages' hero (ToursHero 3880:2674, and the four siblings that
 * repeat it). Single-column and server-rendered so LCP stays on the headline,
 * not on a hydrated demo — the live demo is the next section.
 *
 * ## Where the numbers come from
 *
 * The two `tourkit-lighthouse.avif` / `hero-dark.avif` requests this used to
 * make are gone, the same way the home hero shed them: the frame draws the
 * hero on the flat page ground under three layers, and only the dot grid
 * survives from the old treatment.
 *
 *   wash   a 545x589 ellipse under a ~400px blur, centred at (1327.5, 332.5)
 *          — well right of the home hero's, because there is no preview panel
 *          here for it to wash out. Median-sampled off the dark frame (a
 *          median rejects the line art and the dot grid crossing the sample)
 *          it peaks at a≈0.644 of indigo-600 and reaches the ground at about
 *          600px across and 630px down, on this normalised profile:
 *
 *              r/R    0     .25    .50    .75   1.0
 *              a/a₀   1.00  .83    .44    .13   0
 *
 *          which is the four-stop ramp below. A single linear stop undershoots
 *          the flat core by ~0.09 — a blurred ellipse is Gaussian, not linear.
 *   art    the hero's own 1067x1046 `/hero-pattern.svg`, turned 121.54deg and
 *          centred just past the right edge — the SAME leaf the home hero
 *          draws, so no second export and no extra request.
 *   grid   24px dots at 0.35, the one layer carried over unchanged.
 *
 * Content is a 680px column on the 1120px container's left edge, 112px down.
 */
export function CapabilityHero({
  slug,
  eyebrow,
  heading,
  headingAccent,
  subhead,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  installCmd,
  reassurance,
  factsLine,
}: CapabilityHeroProps) {
  const placement: CtaPlacement = `${slug}_hero`

  return (
    // `overflow-x-clip`, never `overflow-hidden`: the wash is still at a≈0.09
    // 460px below the band in the frame, and bleeding down into the demo
    // section is what the design draws. `hidden` would cut it off at the seam.
    <section className="relative overflow-x-clip px-6 pt-[112px] pb-[98px] sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-x-clip"
      >
        <div
          className="absolute inset-0"
          style={{
            background: [
              // 41.67% is the measured 600px as a share of the 1440 frame, so
              // this is exact at the design width and SHRINKS with the
              // viewport — as a fixed 600px it flooded a 400px screen edge to
              // edge instead of hugging one corner. The vertical radius stays
              // px: this band's height is content-driven, and a percentage
              // would stretch the bloom on the pages whose subhead runs long.
              'radial-gradient(ellipse 41.67% 630px at 92.19% 332px',
              'var(--tk-hero-glow) 0%',
              'color-mix(in srgb, var(--tk-hero-glow) 83%, transparent) 25%',
              'color-mix(in srgb, var(--tk-hero-glow) 44%, transparent) 50%',
              'color-mix(in srgb, var(--tk-hero-glow) 13%, transparent) 75%',
              'transparent 100%)',
            ].join(','),
          }}
        />

        <div
          className="absolute h-[1046px] w-[1067px] -translate-x-1/2 -translate-y-1/2 rotate-[121.54deg] opacity-40"
          style={{
            left: '100.87%',
            top: 376,
            background: 'var(--tk-primary-container)',
            maskImage: 'url(/hero-pattern.svg)',
            maskSize: '100% 100%',
            maskRepeat: 'no-repeat',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1120px]">
        <div className="max-w-[680px]">
          <p className="text-[11px] font-semibold uppercase leading-[16.5px] tracking-[0.08em] text-[var(--color-fd-primary)]">
            {eyebrow}
          </p>

          <h1 className="mt-[20px] text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-fd-foreground">
            {heading}
            <br />
            <span className="text-[var(--color-fd-primary)]">{headingAccent}</span>
          </h1>

          <p className="mt-[23px] max-w-[560px] text-[17px] leading-[1.7] text-fd-foreground/80">
            {subhead}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <TrackedCtaLink
              href={primaryHref}
              placement={placement}
              className="group inline-flex h-[45px] items-center gap-2 rounded-lg bg-[var(--tk-cta)] px-6 text-[14px] font-semibold text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              {primaryLabel}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </TrackedCtaLink>
            <Link
              href={secondaryHref}
              className="inline-flex h-[45px] items-center rounded-lg border border-[var(--tk-hairline)] bg-fd-background/70 px-5 text-[14px] font-semibold text-fd-foreground backdrop-blur-sm transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              {secondaryLabel}
            </Link>
          </div>

          {reassurance ? (
            <p className="mt-4 text-[13px] text-fd-muted-foreground">{reassurance}</p>
          ) : null}

          {installCmd ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--tk-hairline)] bg-fd-muted px-4 py-2.5">
              <Terminal className="h-3.5 w-3.5 text-fd-muted-foreground" aria-hidden="true" />
              {/* Full strength, not the frame's 0.8: faded slate-500 on the
                  light `fd-muted` chip measures 3.3:1. Mono, also not the
                  frame — the design system has no mono face mapped, and every
                  other install pill on the site sets commands in Geist Mono. */}
              <code className="font-mono text-[13px] leading-[19.5px] text-fd-muted-foreground">
                <span className="select-none text-fd-muted-foreground/40">$ </span>
                {installCmd}
              </code>
              <CopyButton
                text={installCmd}
                className="text-fd-muted-foreground hover:text-fd-foreground"
              />
            </div>
          ) : null}

          <p className="mt-6 text-[13px] font-bold leading-[19.5px] text-fd-foreground/60">
            {factsLine}
          </p>
        </div>
      </div>
    </section>
  )
}
