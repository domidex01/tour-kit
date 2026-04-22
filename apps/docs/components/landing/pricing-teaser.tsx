import { ArrowRight, Check, Code2, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

import { POLAR_CHECKOUT_URL } from '@/lib/polar-config'

const FREE_HIGHLIGHTS = [
  'Product tours & spotlight overlays',
  'Persistent hints & beacons',
  'Full TypeScript, WCAG 2.1 AA',
  'Unlimited sites — MIT licensed',
]

const PRO_HIGHLIGHTS = [
  'Everything in Free',
  'Analytics, checklists, announcements',
  'Feature adoption & scheduling',
  'All future updates — no subscription',
]

export function PricingTeaser() {
  return (
    <section className="px-6 py-28 sm:px-8 md:py-36 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {/* Header — left-aligned to alternate with Packages (right) */}
        <div className="mb-16 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Own your code.
            <br />
            Pay once, not forever.
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Three MIT packages cover most tours, hints, and onboarding. Need analytics, checklists,
            or announcements? The full suite is a{' '}
            <strong className="text-fd-foreground">$99 one-time</strong> license — not a monthly
            invoice.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Free tier */}
          <div className="group flex flex-col rounded-xl border border-fd-border bg-fd-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fd-border bg-fd-muted">
                <Code2 className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fd-foreground">Free forever</h3>
                <p className="text-[13px] text-fd-muted-foreground">3 MIT packages</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $0
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">unlimited sites</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {FREE_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-6 py-3 text-[15px] font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Pro tier */}
          <div className="group relative flex flex-col rounded-xl border-2 border-[var(--tk-primary)] bg-fd-card p-8 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-primary)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[var(--tk-primary)]/20">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              One-time purchase
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tk-primary)]/10 ring-1 ring-[var(--tk-primary)]/20">
                <Zap className="h-5 w-5 text-[var(--tk-primary)]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fd-foreground">Pro</h3>
                <p className="text-[13px] text-fd-muted-foreground">8 extended packages</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $99
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">5 sites included</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PRO_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tk-primary)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={POLAR_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Buy Pro license
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/pricing"
            className="font-mono text-[13px] font-semibold text-[var(--tk-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See full pricing &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
