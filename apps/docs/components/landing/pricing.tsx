'use client'

import { ArrowRight, Check, Code2, Sparkles, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { POLAR_CHECKOUT_URL } from '@/lib/polar-config'

const FREE_FEATURES = [
  'Product tours & steps',
  'Spotlight overlays',
  'Keyboard navigation',
  'Persistent hints & beacons',
  'Full TypeScript support',
  'shadcn/ui compatible',
  'MIT licensed — unlimited sites',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Analytics integration',
  'Product announcements',
  'Onboarding checklists',
  'Feature adoption tracking',
  'Media embedding (YouTube, Loom, Lottie)',
  'Time-based scheduling',
  'AI chat assistant',
  'Priority GitHub issues',
]

const COMPARISON_ROWS = [
  { feature: 'Product tours', free: true, pro: true },
  { feature: 'Hints & beacons', free: true, pro: true },
  { feature: 'Spotlight overlays', free: true, pro: true },
  { feature: 'Keyboard navigation', free: true, pro: true },
  { feature: 'TypeScript', free: true, pro: true },
  { feature: 'Analytics', free: false, pro: true },
  { feature: 'Announcements', free: false, pro: true },
  { feature: 'Checklists', free: false, pro: true },
  { feature: 'Adoption tracking', free: false, pro: true },
  { feature: 'Media embedding', free: false, pro: true },
  { feature: 'Scheduling', free: false, pro: true },
  { feature: 'AI assistant', free: false, pro: true },
  { feature: 'Sites', free: 'Unlimited', pro: '5 included' },
  { feature: 'License', free: 'MIT', pro: 'Commercial' },
]

export function Pricing() {
  return (
    <section className="px-6 pb-20 sm:px-8 md:pb-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {/* Pricing cards */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
          {/* Free tier */}
          <div className="group flex flex-col rounded-xl border border-fd-border bg-fd-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fd-border bg-fd-muted">
                <Code2 className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fd-foreground">Free</h3>
                <p className="text-[13px] text-fd-muted-foreground">Open source core</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $0
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">forever</span>
            </div>

            <div className="mb-6 rounded-lg border border-dashed border-fd-border bg-fd-muted/30 px-4 py-2.5">
              <p className="text-[13px] font-medium text-fd-muted-foreground">
                3 MIT packages — unlimited sites, no restrictions
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-6 py-3 text-[15px] font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Get started
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
                <p className="text-[13px] text-fd-muted-foreground">Full onboarding suite</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $99
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">
                one-time / 5 sites
              </span>
            </div>

            <div className="mb-6 rounded-lg border border-[var(--tk-primary)]/20 bg-[var(--tk-primary)]/5 px-4 py-2.5">
              <p className="text-[13px] font-medium text-fd-foreground">
                8 extended packages — analytics, checklists, AI & more
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tk-primary)]"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={POLAR_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Buy Pro License
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Compare
            </p>
            <h3 className="text-2xl font-bold tracking-[-0.01em] text-fd-foreground">
              Feature comparison
            </h3>
          </div>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-fd-border">
            <table className="w-full text-sm">
              <caption className="sr-only">Feature comparison between Free and Pro tiers.</caption>
              <thead>
                <tr className="border-b border-fd-border bg-fd-muted/50">
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-[13px] font-semibold text-fd-foreground"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-center text-[13px] font-semibold text-fd-foreground"
                  >
                    Free
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-center text-[13px] font-semibold text-[var(--tk-primary)]"
                  >
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-fd-border transition-colors last:border-b-0 hover:bg-fd-muted/30"
                  >
                    <th
                      scope="row"
                      className="px-6 py-3 text-left text-[14px] font-normal text-fd-foreground"
                    >
                      {row.feature}
                    </th>
                    <td className="px-6 py-3 text-center">
                      <ComparisonCell value={row.free} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <ComparisonCell value={row.pro} isPro />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />
      </div>
    </section>
  )
}

function ComparisonCell({
  value,
  isPro,
}: {
  value: boolean | string
  isPro?: boolean
}) {
  if (typeof value === 'string') {
    return <span className="text-[13px] font-medium text-fd-muted-foreground">{value}</span>
  }
  if (value) {
    return (
      <>
        <Check
          aria-hidden="true"
          className={`mx-auto h-4 w-4 ${
            isPro ? 'text-[var(--tk-primary)]' : 'text-emerald-600 dark:text-emerald-400'
          }`}
        />
        <span className="sr-only">Included</span>
      </>
    )
  }
  return (
    <>
      <X aria-hidden="true" className="mx-auto h-4 w-4 text-fd-muted-foreground/30" />
      <span className="sr-only">Not included</span>
    </>
  )
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mt-20">
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
          FAQ
        </p>
        <h3 className="text-2xl font-bold tracking-[-0.01em] text-fd-foreground">
          Frequently asked questions
        </h3>
      </div>
      <div className="mx-auto max-w-3xl divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i
          const panelId = `faq-panel-${i}`
          const triggerId = `faq-trigger-${i}`
          return (
            <div key={item.q}>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
              >
                {item.q}
                <svg
                  className={`h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {/* biome-ignore lint/a11y/useSemanticElements: accordion panel needs role=region per ARIA authoring practices */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-[14px] leading-relaxed text-fd-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    q: 'Is the free tier really free forever?',
    a: 'Yes. The core, react, and hints packages are MIT licensed with no usage limits, no time limits, and no feature gates. Use them in as many projects as you want.',
  },
  {
    q: 'What does "5 sites" mean?',
    a: "Your Pro license key can be activated on up to 5 production domains. localhost and development environments don't count. You can deactivate and reassign domains anytime from your Polar dashboard.",
  },
  {
    q: 'Do I need to pay again for updates?',
    a: 'No. The Pro license is a one-time purchase that includes all future updates to the extended packages. No subscriptions, no renewal fees.',
  },
  {
    q: "What happens if I don't have a license?",
    a: 'Extended packages degrade gracefully — they render their children without the enhanced features and log a developer warning in the console. Nothing crashes or shows a blank screen.',
  },
  {
    q: 'Can I try Pro features before buying?',
    a: 'Pro features work without a license key in development (localhost). You can build and test your full onboarding flow locally before purchasing.',
  },
  {
    q: 'How does activation work?',
    a: 'Add your license key as an environment variable. On the first production page load, your domain is automatically activated (using 1 of 5 slots). No manual activation steps required.',
  },
]
