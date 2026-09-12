import { SectionBackdrop } from '@/components/landing/section-backdrop'
import type { ReactNode } from 'react'

interface PageHeroProps {
  /** Mono uppercase label above the H1. Omitted on /blog, present on /pricing. */
  eyebrow?: string
  heading: string
  /** The long summary under the H1 — this band carries the page's whole pitch. */
  children: ReactNode
  /**
   * Rendered under the summary, inside the same band. /blog puts its RSS link
   * here (BlogHero 3880:2116).
   */
  footer?: ReactNode
}

/**
 * The centred hero band that opens /pricing and /blog (PricingHero 3880:1529,
 * BlogHero 3880:2109). It replaced a masked photograph on both — the frames
 * draw this band on the flat page ground with the `SectionBackdrop` line art
 * over it, so the two `blog-hero-{light,dark}.avif` requests are gone and the
 * LCP element is the heading.
 *
 * ## Where the numbers come from
 *
 * The two frames carry BYTE-IDENTICAL backdrop nodes — same ellipses at
 * x=1715.14/95.14 y=69.5, same 945.8x997.3 pattern boxes at y=329.62 — in a
 * 385px band on /pricing and a 439px one on /blog. The art does not scale or
 * re-centre with the band, which is why `SectionBackdrop`'s `hero` row is px
 * from the top and not a share of the height.
 *
 * Everything that DOES differ between them is spacing, and both states are
 * measured rather than interpolated:
 *
 *              /pricing (has eyebrow)   /blog (no eyebrow)
 *   pad top    112                      128
 *   h1 gap     16 under the eyebrow     —
 *   sub gap    16                       8
 *   sub width  768                      672
 *   pad bottom 56                       84
 *
 * The hairline closing the band is slate-500 at 40%, not `--color-fd-border`:
 * sampled off both rendered frames it measures rgb(39 49 70) on the slate-950
 * ground, which is the `--tk-hairline` token at a=0.39/0.40 in all three
 * channels. `--color-fd-border` would paint it a visible step brighter.
 */
export function PageHero({ eyebrow, heading, children, footer }: PageHeroProps) {
  return (
    <section
      className={`relative border-b border-[var(--tk-hairline)]/40 px-6 text-center sm:px-8 lg:px-12 ${
        eyebrow ? 'pt-[112px] pb-[56px]' : 'pt-[128px] pb-[84px]'
      }`}
    >
      <SectionBackdrop placement="hero" />

      <div className="relative mx-auto max-w-[1184px]">
        {/* Sans, not mono: the frames set every eyebrow in Host Grotesk
            SemiBold at 11/16.5 with 0.88px tracking (= 0.08em). */}
        {eyebrow ? (
          <p className="mb-4 text-[11px] font-semibold uppercase leading-[16.5px] tracking-[0.08em] text-[var(--color-fd-primary)]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-[clamp(1.75rem,3.4vw,2.25rem)] font-bold leading-[1.111] tracking-[-0.02em] text-balance text-fd-foreground">
          {heading}
        </h1>

        {/* The frame's summary is rgba(179 179 179 / 0.8) — that 0.8 is a DARK
            value and does not survive the trip to light. On white the same
            fade composites slate-500 to rgb(129 144 165), which measures
            3.3:1 and fails AA for body copy. The token deviates the way the
            CTA fill does: full strength in light (4.8:1), the frame's fade in
            dark (≈7:1). */}
        <p
          className={`mx-auto text-[16px] leading-[1.6] text-fd-muted-foreground dark:text-fd-muted-foreground/80 ${
            eyebrow ? 'mt-4 max-w-[768px]' : 'mt-2 max-w-[672px]'
          }`}
        >
          {children}
        </p>

        {footer ? <div className="mt-3 flex justify-center">{footer}</div> : null}
      </div>
    </section>
  )
}
