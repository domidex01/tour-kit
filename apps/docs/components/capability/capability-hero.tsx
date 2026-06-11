import { type CtaPlacement, TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import type { CapabilitySlug } from '@/components/capability/types'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Terminal } from 'lucide-react'
import Link from 'next/link'

interface CapabilityHeroProps {
  slug: CapabilitySlug
  /** Mono uppercase pill above the H1, names the capability. */
  eyebrow: string
  /** Outcome-flavored H1 — first line plain, second line brand-blue. */
  heading: string
  headingAccent: string
  /** One sentence naming the package and the outcome. */
  subhead: string
  /** Primary CTA — install/Studio for free pages, try-in-dev for Pro. */
  primaryLabel: string
  primaryHref: string
  /** Secondary always reads the docs ("Read the docs →"). */
  docsHref: string
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
  /** Mono facts line under the CTAs ("< 10KB gzipped · TypeScript strict…"). */
  factsLine: string
}

/**
 * Static hero for capability pages — same lighthouse backdrop + dot grid as
 * the home hero, but single-column and server-rendered so LCP stays on the
 * headline, not on a hydrated demo. The live demo is the next section.
 */
export function CapabilityHero({
  slug,
  eyebrow,
  heading,
  headingAccent,
  subhead,
  primaryLabel,
  primaryHref,
  docsHref,
  installCmd,
  reassurance,
  factsLine,
}: CapabilityHeroProps) {
  const placement: CtaPlacement = `${slug}_hero`

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:px-8 md:pt-28 md:pb-24 lg:px-12">
      {/* Background images — same treatment as the home hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/tourkit-lighthouse.avif"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-90 dark:hidden"
        />
        <img
          src="/hero-dark.avif"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-50 dark:block"
        />
      </div>

      {/* Subtle dot grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-[680px]">
          <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0197f6]">
            {eyebrow}
          </p>

          <h1 className="mb-6 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#02182b] dark:text-white">
            {heading}
            <br />
            <span className="text-[#0197f6]">{headingAccent}</span>
          </h1>

          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.7] text-[#02182b]/80 dark:text-white/80">
            {subhead}
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <TrackedCtaLink
              href={primaryHref}
              placement={placement}
              className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
            >
              {primaryLabel}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </TrackedCtaLink>
            <Link
              href={docsHref}
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-5 py-3 text-[14px] font-semibold text-[#02182b] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md dark:text-white"
            >
              Read the docs &rarr;
            </Link>
          </div>

          {reassurance ? (
            <p className="mb-6 text-[13px] text-[#02182b]/70 dark:text-white/70">{reassurance}</p>
          ) : null}

          {installCmd ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-fd-border/50 bg-fd-card/60 px-4 py-2.5 backdrop-blur-sm">
              <Terminal className="h-3.5 w-3.5 text-fd-muted-foreground" aria-hidden="true" />
              <code className="font-mono text-[13px] text-fd-muted-foreground">
                <span className="select-none opacity-40">$ </span>
                {installCmd}
              </code>
              <CopyButton
                text={installCmd}
                className="text-fd-muted-foreground hover:text-fd-foreground"
              />
            </div>
          ) : null}

          <p className="font-mono text-[13px] font-bold text-[#02182b]/60 dark:text-white/60">
            {factsLine}
          </p>
        </div>
      </div>
    </section>
  )
}
