import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { ArrowRight } from 'lucide-react'

/**
 * End-of-page CTA band rendered after the body of every docs page. Docs is the
 * largest engaged surface on the site (~71% of sessions reach it, with more
 * pageviews than the landing page) yet had no path to pricing — this is the
 * bridge.
 *
 * Copy follows CXL's CTA guidance (cxl.com/blog/call-to-action-examples):
 * - First-person, action-verb primary button ("Build my first tour") — first
 *   person is the single highest-leverage CTA-copy tweak (CXL / Unbounce), the
 *   verb adds momentum, and the label answers "what do I get?". Mirrors the
 *   homepage CtaBand label verbatim for a consistent close across the site.
 * - Friction-reducers sit *directly under* the CTA, not buried in body copy:
 *   for a dev tool the objection is commitment, not price, so we lead with the
 *   absences ("no signup, no credit card").
 * - Honest trust signal only (MIT / open source) — no fabricated "10k+ users"
 *   social proof; the library is pre-1.0 and we don't invent numbers.
 *
 * Same free-first voice as the blog/home CTAs: lead with `npm install` and
 * reframe the one-time $99 as "pay when you ship" — the Pro suite runs
 * unlicensed, and the production watermark is what converts later, inside the
 * reader's own codebase. Unlike `BlogCta`'s full-bleed (`min-h-screen`) band,
 * this is sized for the narrow docs content column: a compact bordered card
 * with the brand gradient, no lighthouse backdrop.
 */
export function DocsCta() {
  return (
    <section
      aria-labelledby="docs-cta-heading"
      className="relative mt-12 overflow-hidden rounded-2xl border border-[#0197f6]/30 bg-gradient-to-br from-[#0197f6]/5 to-transparent p-6 dark:from-[#0197f6]/10 sm:p-8"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0197f6]">
        Free &amp; open source
      </span>
      <h2
        id="docs-cta-heading"
        className="mt-2 text-xl font-extrabold leading-tight tracking-[-0.02em] text-[#02182b] dark:text-white sm:text-2xl"
      >
        Ship onboarding, not config.
      </h2>
      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-fd-muted-foreground">
        <code className="rounded bg-fd-muted px-1 py-0.5 text-[13px]">npm i @tour-kit/core</code> is
        MIT and free. The Pro packages work unlicensed too — a one-time $99 license removes the
        production watermark when you ship.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TrackedCtaLink
          href="/builder"
          placement="docs_footer"
          className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
        >
          Build my first tour
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </TrackedCtaLink>
        <TrackedCtaLink
          href="/pricing"
          placement="docs_footer"
          className="inline-flex items-center rounded-lg border border-fd-border bg-fd-background/50 px-6 py-3 text-[14px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
        >
          See pricing
        </TrackedCtaLink>
      </div>
      {/* Risk-reduction microcopy directly under the CTA (CXL) — mirrors the
          homepage band's reassurance line, with the docs-specific "pay when you
          ship" reframe of the one-time license. */}
      <p className="mt-4 text-[13px] text-fd-muted-foreground">
        MIT-licensed — no signup, no credit card. Pay once, only when you ship.
      </p>
    </section>
  )
}
