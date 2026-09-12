import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { SectionBackdrop } from '@/components/landing/section-backdrop'
import { cn } from '@/lib/cn'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface ClosingCtaProps {
  heading: string
  /** Trailing clause of the heading, rendered in brand purple. */
  headingAccent: string
  subtext: string
  /** Install command for the pill left of the button. Omit to drop the pill. */
  installCmd?: string
  ctaLabel: string
  ctaHref: string
  /** Outline button after the primary — the blog band adds "See pricing". */
  secondaryLabel?: string
  secondaryHref?: string
  /**
   * When set, both buttons fire `cta_clicked` with this placement. The home
   * page's own closing CTA is deliberately untracked (it is the last thing
   * before the footer, and `home_after_features` already measures the page's
   * conversion pull), so it omits this and gets plain links.
   */
  placement?: CtaPlacement
  /** Rendered below the CTA row, inside the same backdrop. */
  children?: ReactNode
  /**
   * Merged onto the `<section>`. The blog band is the one caller that is not
   * full-bleed — it sits inside a reading column, so it overrides the frame's
   * 194px of vertical air and adds its own rounded edge.
   */
  className?: string
}

/**
 * The page-closing CTA (Figma 3945:2747, and its light twin). Section 578
 * tall with the content block (190) centred, so 194px of air each side. The
 * heading is 48px ExtraBold on a 45px leading — tighter than its own font
 * size — and the three blocks sit 24px apart. The install pill (235×47) and
 * the button (153×49) sit 32px apart in one centred row.
 *
 * Shared by the home page, the five capability pages and the blog band so
 * every page in the site closes on the same note. Before the redesign these
 * three each drew their own glass card over a lighthouse photograph with a
 * dot-grid overlay; the frames close on the `SectionBackdrop` line art with
 * no card and no photograph, which also takes two image requests off each of
 * those pages.
 */
export function ClosingCta({
  heading,
  headingAccent,
  subtext,
  installCmd,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  placement,
  children,
  className,
}: ClosingCtaProps) {
  return (
    <section className={cn('relative px-6 py-24 sm:px-8 lg:px-12 lg:py-[194px]', className)}>
      <SectionBackdrop placement="closing" />

      <div className="relative mx-auto flex max-w-[1120px] flex-col items-center gap-6 text-center">
        <h2 className="text-[clamp(2rem,3.9vw,3rem)] font-extrabold leading-[0.94] tracking-[-0.015em] text-balance text-fd-foreground">
          {heading} <span className="text-[var(--color-fd-primary)]">{headingAccent}</span>
        </h2>

        <p className="max-w-[478px] text-[16px] leading-6 text-fd-muted-foreground">{subtext}</p>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {installCmd ? (
            <code className="inline-flex h-[47px] items-center gap-3 rounded-lg border border-[var(--tk-hairline)] bg-fd-secondary px-6 font-mono text-[14px] leading-[21px] text-fd-foreground/65">
              <span className="select-none text-fd-muted-foreground/40">$</span>
              {installCmd}
            </code>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <CtaLink
              href={ctaHref}
              placement={placement}
              className="group inline-flex h-[49px] items-center gap-2 rounded-lg bg-[var(--tk-cta)] px-7 text-[14px] font-semibold leading-5 text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              {ctaLabel}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </CtaLink>

            {secondaryLabel && secondaryHref ? (
              <CtaLink
                href={secondaryHref}
                placement={placement}
                className="inline-flex h-[49px] items-center rounded-lg border border-[var(--tk-hairline)] bg-fd-background/70 px-7 text-[14px] font-semibold leading-5 text-fd-foreground backdrop-blur-sm transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
              >
                {secondaryLabel}
              </CtaLink>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </section>
  )
}

/**
 * `TrackedCtaLink` is a client component and requires a placement, which is
 * the right shape for every CTA that reports into the funnel. The home page's
 * closing CTA reports into nothing, so it degrades to a plain server-rendered
 * link rather than weakening `placement` to optional site-wide.
 */
function CtaLink({
  href,
  placement,
  className,
  children,
}: {
  href: string
  placement?: CtaPlacement
  className: string
  children: ReactNode
}) {
  if (placement) {
    return (
      <TrackedCtaLink href={href} placement={placement} className={className}>
        {children}
      </TrackedCtaLink>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
