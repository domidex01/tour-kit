'use client'

import {
  ArrowRight,
  Check,
  Code2,
  Download,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { TrackedBuyButton } from '@/components/analytics/tracked-buy-button'
import { POLAR_CHECKOUT_URL } from '@/lib/polar-config'
import { PRICING_FAQS } from '@/lib/pricing-faqs'

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

// Verifiable social proof only. Source: npmjs.org last-month downloads for
// @tour-kit/core = 4,144/mo on 2026-05-27 (~8,600/mo across core+react+hints).
// Refresh quarterly. Deliberately no GitHub star count (4 — would hurt) and no
// testimonials (none yet). See marketing-strategy/funnel-strategy-20260527.md (A1).
const MONTHLY_INSTALLS = '4,000+'

export function Pricing() {
  return (
    <section className="px-6 pb-20 sm:px-8 md:pb-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {/* Social proof strip — A1: verifiable trust signals as pills (matches homepage SocialProof) */}
        <ul className="mx-auto mb-12 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
          <li className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 text-[13px] text-fd-muted-foreground">
            <Download
              className="h-3.5 w-3.5 shrink-0 text-[var(--tk-primary)]"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold text-fd-foreground">{MONTHLY_INSTALLS}</strong>{' '}
              monthly npm installs
            </span>
          </li>
          <li className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 text-[13px] text-fd-muted-foreground">
            <Scale className="h-3.5 w-3.5 shrink-0 text-[var(--tk-primary)]" aria-hidden="true" />
            <span>MIT-licensed core — no lock-in</span>
          </li>
          <li className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 text-[13px] text-fd-muted-foreground">
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-[var(--tk-primary)]"
              aria-hidden="true"
            />
            <span>Secure checkout via Polar</span>
          </li>
        </ul>
        {/* Pricing cards */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
          {/* Free tier */}
          <div className="group order-2 flex flex-col rounded-xl border border-fd-border bg-fd-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:order-1">
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
          <div className="group relative order-1 flex flex-col rounded-xl border-2 border-[var(--tk-primary)] bg-fd-card p-8 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:order-2">
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

            <div className="mb-2">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                $99
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">
                one-time / 5 sites
              </span>
            </div>

            {/* Honest price anchor — most onboarding SaaS bills monthly; we charge once */}
            <p className="mb-8 text-[13px] leading-snug text-fd-muted-foreground">
              Less than one month of most onboarding SaaS — paid once, not monthly.
            </p>

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

            <TrackedBuyButton
              href={POLAR_CHECKOUT_URL}
              placement="pricing_page"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
            >
              Buy Pro License
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedBuyButton>

            {/* Risk reversal — A2: surface the 14-day guarantee at the decision point */}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px] text-fd-muted-foreground">
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              14-day money-back guarantee · No subscription, ever
            </p>
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
          <div className="overflow-hidden rounded-xl border border-fd-border">
            {/* The global `table{display:block}` rule (globals.css) is unlayered and beats
                Tailwind utilities in the cascade, so force real table layout inline to fill
                the card width. Fixed 50/25/25 columns via colgroup. */}
            <table
              className="text-sm"
              style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}
            >
              <caption className="sr-only">Feature comparison between Free and Pro tiers.</caption>
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
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

        {/* License & fulfillment — H5 expansion (license terms, refund, Polar fulfillment) */}
        <LicenseTerms />

        <p className="mt-12 text-center text-[13px] text-fd-muted-foreground">
          Already a customer?{' '}
          <Link
            href="/account"
            className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            Manage your license →
          </Link>
        </p>
      </div>
    </section>
  )
}

function LicenseTerms() {
  return (
    <div className="mx-auto mt-20 max-w-3xl">
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
          License &amp; fulfillment
        </p>
        <h3 className="text-2xl font-bold tracking-[-0.01em] text-fd-foreground">
          What you&apos;re actually buying
        </h3>
      </div>
      <dl className="space-y-6 text-[14px] leading-relaxed text-fd-muted-foreground">
        <div>
          <dt className="mb-1 font-semibold text-fd-foreground">License grant</dt>
          <dd>
            A non-exclusive, non-transferable commercial license to use the eight Pro packages in up
            to five production domains. Includes all future updates to those packages. The MIT-core
            packages remain MIT-licensed and unrestricted regardless of Pro purchase.
          </dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold text-fd-foreground">14-day refund</dt>
          <dd>
            If Tour Kit doesn&apos;t fit your stack within 14 days of purchase, email{' '}
            <a
              href="mailto:hello@usertourkit.com"
              className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              hello@usertourkit.com
            </a>{' '}
            from your purchase address with your order ID. Refunds are processed by Polar in 5–10
            business days.
          </dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold text-fd-foreground">Fulfillment</dt>
          <dd>
            Checkout runs on{' '}
            <a
              href="https://polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              Polar.sh
            </a>
            , which acts as merchant of record. Card, Apple Pay, Google Pay, and Link are accepted.
            VAT and sales tax are calculated and remitted to your tax authority automatically. Your
            license key is delivered to your billing email within a few minutes of payment.
          </dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold text-fd-foreground">Activation &amp; reassignment</dt>
          <dd>
            Add the license key as an environment variable. The first production page load on each
            domain consumes one of five activation slots automatically — no manual claim step.
            Domains can be deactivated and reassigned at any time from your{' '}
            <Link
              href="/account"
              className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              account portal
            </Link>
            .
          </dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold text-fd-foreground">No subscription, no auto-charge</dt>
          <dd>
            Pro is a one-time purchase. There is no recurring billing, no per-seat charge, and no
            future upgrade fee for the eight packages covered by the license.
          </dd>
        </div>
      </dl>
    </div>
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
        {PRICING_FAQS.map((item, i) => {
          const isOpen = openIndex === i
          const panelId = `faq-panel-${i}`
          const triggerId = `faq-trigger-${i}`
          return (
            <div key={item.question}>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
              >
                {item.question}
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
              <div
                id={panelId}
                // biome-ignore lint/a11y/useSemanticElements: accordion panel needs role=region per ARIA authoring practices
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-[14px] leading-relaxed text-fd-muted-foreground">
                    {item.answer}
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
