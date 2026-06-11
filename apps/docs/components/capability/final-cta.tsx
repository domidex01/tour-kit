import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import type { CapabilitySlug, SiblingCapability } from '@/components/capability/types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FinalCtaProps {
  slug: CapabilitySlug
  heading: string
  headingAccent: string
  subtext: string
  /** Free pages show the install command in the closing card. */
  installCmd?: string
  primaryLabel: string
  primaryHref: string
  /** "Pairs well with…" — 2 sibling capability pages, keeps visitors in the
      hub-and-spoke cluster when they don't convert. */
  siblings: SiblingCapability[]
}

/**
 * Closing CTA card over the lighthouse backdrop (home CTA-footer pattern)
 * followed by the sibling cross-link band.
 */
export function FinalCta({
  slug,
  heading,
  headingAccent,
  subtext,
  installCmd,
  primaryLabel,
  primaryHref,
  siblings,
}: FinalCtaProps) {
  const placement: CtaPlacement = `${slug}_footer`

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-8 md:py-32 lg:px-12">
      {/* Background images — same as hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/tourkit-lighthouse.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover dark:hidden"
        />
        <img
          src="/hero-dark.avif"
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
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-xl rounded-2xl border border-fd-border/50 bg-fd-background/40 p-10 text-center shadow-2xl backdrop-blur-xl sm:p-12 dark:bg-fd-background/40">
          <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#02182b] sm:text-4xl dark:text-white">
            {heading} <span className="text-[#0197f6]">{headingAccent}</span>
          </h2>

          <p className="mb-10 text-[16px] text-fd-muted-foreground">{subtext}</p>

          {installCmd ? (
            <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border/50 bg-fd-muted/30 px-6 py-3 font-mono text-[14px] backdrop-blur-sm">
              <span className="select-none text-fd-muted-foreground/50">$</span>
              <span className="text-fd-foreground/70">{installCmd}</span>
            </div>
          ) : null}

          <div className="flex justify-center">
            <TrackedCtaLink
              href={primaryHref}
              placement={placement}
              className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
            >
              {primaryLabel}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </TrackedCtaLink>
          </div>
        </div>

        {/* Sibling cross-link band */}
        <div className="mx-auto mt-12 max-w-xl">
          <p className="mb-4 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
            Pairs well with
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.href}
                href={sibling.href}
                className="group rounded-lg border border-fd-border/60 bg-fd-background/50 px-5 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex items-center justify-between text-[14px] font-semibold text-fd-foreground">
                  {sibling.label}
                  <ArrowRight
                    className="h-3.5 w-3.5 text-[#0197f6] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-0.5 block text-[12.5px] text-fd-muted-foreground">
                  {sibling.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
