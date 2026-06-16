import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { ArrowRight } from 'lucide-react'

interface BlogCtaProps {
  /**
   * `band` — full-width conversion band for the end of the list (after
   * pagination, before the footer): highest-intent slot.
   * `card` — native-looking card spliced into the post grid to catch
   * scanners mid-scroll without an interstitial.
   */
  variant: 'band' | 'card'
  placement: 'blog_index_footer' | 'blog_index_grid' | 'blog_post_footer'
}

/**
 * Free-first blog CTA. The job here is install intent, not revenue: the Pro
 * suite runs free in local development (dev bypass) and the production
 * watermark — removed by the one-time $99 license — is what actually converts
 * later, inside the reader's own codebase. So we lead with `npm install` and
 * reframe $99 as "pay when you ship", not "pay to start".
 */
export function BlogCta({ variant, placement }: BlogCtaProps) {
  if (variant === 'card') {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-[#0197f6]/30 bg-gradient-to-b from-[#0197f6]/5 to-transparent p-4 dark:from-[#0197f6]/10">
        <div>
          <span className="text-[11px] font-semibold text-[#0197f6]">Get started</span>
          <p className="mt-2 font-medium leading-snug text-fd-foreground">
            Ship onboarding, not config.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
            <code className="rounded bg-fd-muted px-1 py-0.5 text-[12px]">
              npm i @tour-kit/core
            </code>{' '}
            — MIT and free. Pro packages work unlicensed too; one-time $99 removes the watermark.
          </p>
        </div>
        <TrackedCtaLink
          href="/builder"
          placement={placement}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0197f6] transition-opacity hover:opacity-80"
        >
          Start free
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </TrackedCtaLink>
      </div>
    )
  }

  // Full-width conversion band — mirrors the homepage CTA footer (glass card
  // over the lighthouse/hero backdrop) so the blog and landing page close on
  // the same note, with an added pricing button the homepage omits.
  return (
    <section className="relative mt-12 flex min-h-screen items-center justify-center overflow-hidden rounded-2xl border border-fd-border/50 px-6 py-16 sm:px-8 sm:py-20">
      {/* Background images — cute 3D lighthouse diorama, matching the homepage
          CTA band: day for light mode, twilight for dark mode */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/cta-island-day.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full! w-full object-cover opacity-50 dark:hidden"
        />
        <img
          src="/cta-island-twilight.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 hidden h-full! w-full object-cover opacity-50 dark:block"
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-xl rounded-2xl border border-fd-border/50 bg-fd-background/40 p-8 text-center shadow-2xl backdrop-blur-xl dark:bg-fd-background/40 sm:p-12">
        <h2 className="mb-4 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[#02182b] dark:text-white sm:text-3xl">
          Own your onboarding. <span className="text-[#0197f6]">Ship it today.</span>
        </h2>

        <p className="mb-8 text-[15px] text-fd-muted-foreground">
          No vendor lock-in. No monthly invoice. Just code you control and users who convert.
        </p>

        {/* Install command */}
        <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border/50 bg-fd-muted/30 px-6 py-3 font-mono text-[14px] backdrop-blur-sm">
          <span className="select-none text-fd-muted-foreground/50">$</span>
          <span className="text-fd-foreground/70">pnpm add @tour-kit/core</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <TrackedCtaLink
            href="/builder"
            placement={placement}
            className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
          >
            Get started
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/pricing"
            placement={placement}
            className="inline-flex items-center rounded-lg border border-fd-border bg-fd-background/50 px-7 py-3.5 text-[14px] font-semibold text-fd-foreground backdrop-blur-sm transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
          >
            See pricing
          </TrackedCtaLink>
        </div>
      </div>
    </section>
  )
}
