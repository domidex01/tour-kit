'use client'

import { ArrowRight, Check, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
            Simple, one-time pricing
          </h2>
          <p className="mx-auto max-w-xl text-lg text-fd-muted-foreground">
            Core packages are free forever. Pay once for extended packages — no subscriptions, no
            per-seat fees.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free tier */}
          <div className="flex flex-col rounded-xl border border-fd-border bg-fd-card p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-1 text-lg font-bold text-fd-foreground">Free</h3>
              <p className="text-sm text-fd-muted-foreground">
                Everything you need for product tours
              </p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold text-fd-foreground">$0</span>
              <span className="ml-1 text-fd-muted-foreground">forever</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-fd-muted-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border px-6 py-3 text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pro tier */}
          <div className="relative flex flex-col rounded-xl border-2 border-[var(--tk-primary)] bg-fd-card p-8 shadow-md">
            <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-primary)] px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3 w-3" />
              One-time purchase
            </div>

            <div className="mb-6">
              <h3 className="mb-1 text-lg font-bold text-fd-foreground">Pro</h3>
              <p className="text-sm text-fd-muted-foreground">
                Extended packages for full onboarding flows
              </p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold text-fd-foreground">$99</span>
              <span className="ml-1 text-fd-muted-foreground">one-time / 5 sites</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-fd-muted-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tk-primary)]" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="https://polar.sh/tour-kit/products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 hover:brightness-110"
            >
              Buy Pro License
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-16">
          <h3 className="mb-6 text-center text-xl font-bold text-fd-foreground">
            Feature comparison
          </h3>
          <div className="overflow-hidden rounded-xl border border-fd-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-fd-border bg-fd-muted/50">
                  <th className="px-6 py-3 text-left font-semibold text-fd-foreground">Feature</th>
                  <th className="px-6 py-3 text-center font-semibold text-fd-foreground">Free</th>
                  <th className="px-6 py-3 text-center font-semibold text-[var(--tk-primary)]">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-fd-border last:border-b-0">
                    <td className="px-6 py-3 text-fd-foreground">{row.feature}</td>
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
    return <span className="text-fd-muted-foreground">{value}</span>
  }
  if (value) {
    return (
      <Check
        className={`mx-auto h-4 w-4 ${
          isPro ? 'text-[var(--tk-primary)]' : 'text-emerald-600 dark:text-emerald-400'
        }`}
      />
    )
  }
  return <X className="mx-auto h-4 w-4 text-fd-muted-foreground/40" />
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mt-16">
      <h3 className="mb-8 text-center text-xl font-bold text-fd-foreground">
        Frequently asked questions
      </h3>
      <div className="mx-auto max-w-3xl divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border">
        {FAQ_ITEMS.map((item, i) => (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50"
            >
              {item.q}
              <svg
                className={`h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
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
            <div
              className={`grid transition-all duration-200 ${openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-fd-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        ))}
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
