'use client'

import { ArrowRight, Check, Cloud, Download, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PRICING_FAQS } from '@/lib/pricing-faqs'

const EVERY_PACKAGE = [
  'Product tours, steps & spotlight overlays',
  'Persistent hints & beacons',
  'Analytics integration',
  'Product announcements',
  'Onboarding checklists',
  'Feature adoption tracking',
  'Media embedding (YouTube, Loom, Lottie)',
  'Business-hours scheduling (timezone-aware)',
  'In-app surveys (NPS, CSAT, CES)',
  'AI chat assistant (RAG + tour context)',
  'Vue and Svelte bindings, and a CDN build',
  'Full TypeScript support, shadcn/ui compatible',
]

// Verifiable social proof only. Source: npmjs.org last-month downloads for
// @tour-kit/core = 4,144/mo on 2026-05-27 (~8,600/mo across core+react+hints).
// Refresh quarterly. Deliberately no GitHub star count and no testimonials.
const MONTHLY_INSTALLS = '4,000+'

// External URLs live in env (CLAUDE.md). Until the waitlist form exists, the
// card falls back to email so the CTA never points at nothing.
const CLOUD_WAITLIST_URL =
  process.env.NEXT_PUBLIC_CLOUD_WAITLIST_URL ||
  'mailto:hello@usertourkit.com?subject=Tour%20Kit%20Cloud%20waitlist'

/** Every old badge links here with this UTM (plan D5). */
const BADGE_UTM_SOURCE = 'unlicensed_badge'

export function Pricing() {
  // Static for everyone else; a visitor who clicked an old badge gets the
  // explanation first. Read after mount so the page stays statically rendered.
  const [fromBadge, setFromBadge] = useState(false)
  useEffect(() => {
    setFromBadge(new URLSearchParams(window.location.search).get('utm_source') === BADGE_UTM_SOURCE)
  }, [])

  return (
    <section className="px-6 pb-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {fromBadge ? <BadgeNotice /> : null}

        {/* Social proof strip — verifiable signals only */}
        <ul className="mx-auto mb-12 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
          <Chip icon={Download}>
            <strong className="font-semibold text-fd-foreground">{MONTHLY_INSTALLS}</strong> monthly
            npm installs
          </Chip>
          <Chip icon={Scale}>MIT licensed, every package</Chip>
          <Chip icon={ShieldCheck}>No key, no badge, no licence server</Chip>
        </ul>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="relative flex flex-col rounded-xl border-2 border-[var(--color-fd-primary)] bg-fd-card p-7 shadow-md">
            <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fd-primary)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[var(--color-fd-primary)]/20">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Available now
            </div>
            <h3 className="text-lg font-bold text-fd-foreground">The library</h3>
            <p className="mb-2 mt-4">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                Free
              </span>
              <span className="ml-1.5 text-[15px] text-fd-muted-foreground">MIT licence</span>
            </p>
            <p className="mb-6 text-[13px] leading-snug text-fd-muted-foreground">
              Every package, in development and in production, on as many projects as you like.
            </p>
            <ul className="mb-8 flex-1 space-y-2.5">
              {EVERY_PACKAGE.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[13px] text-fd-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[var(--color-fd-primary)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[var(--color-fd-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div
            id="cloud"
            className="flex scroll-mt-24 flex-col rounded-xl border border-[var(--tk-card-edge)] bg-fd-card p-7 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-fd-muted-foreground" aria-hidden="true" />
              <h3 className="text-lg font-bold text-fd-foreground">Tour Kit Cloud</h3>
            </div>
            <p className="mb-2 mt-4">
              <span className="text-4xl font-extrabold tracking-[-0.02em] text-fd-foreground">
                Soon
              </span>
            </p>
            <p className="mb-8 flex-1 text-[14px] leading-relaxed text-fd-muted-foreground">
              A hosted dashboard for Tour Kit is in development. The library stays MIT and complete
              without it. Join the waitlist to hear when it opens.
            </p>
            <a
              href={CLOUD_WAITLIST_URL}
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-[var(--tk-card-edge)] bg-fd-background/60 px-6 py-3 text-[15px] font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
            >
              Join the waitlist
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {fromBadge ? null : <BadgeNotice />}

        <FAQ />

        <p className="mt-12 text-center text-[13px] text-fd-muted-foreground">
          Bought a licence key before the MIT release?{' '}
          <Link
            href="/account"
            className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            Receipts and invoices →
          </Link>
        </p>
      </div>
    </section>
  )
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: typeof Download
  children: React.ReactNode
}) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-[var(--tk-card-edge)] bg-fd-card px-3.5 py-1.5 text-[13px] text-fd-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--color-fd-primary)]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

/**
 * Every badge older versions render links to /pricing. Those visitors need
 * "update to remove it", not a sales page (plan D5).
 */
function BadgeNotice() {
  return (
    <div
      id="unlicensed-badge"
      className="mx-auto my-16 max-w-3xl scroll-mt-24 rounded-xl border border-[var(--tk-card-edge)] bg-fd-card px-6 py-6"
    >
      <h3 className="text-xl font-bold tracking-[-0.01em] text-fd-foreground">
        Seeing an &ldquo;Unlicensed&rdquo; badge on your site?
      </h3>
      <p className="mt-3 text-[14px] leading-relaxed text-fd-muted-foreground">
        Your app runs an older Tour Kit version. Core, react and hints 3.0.x, and the extended
        packages released before October 2026, were published under commercial terms and showed that
        badge in production without a key. Tour Kit is MIT now: update your packages and the badge
        is gone. No key, and no code change.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-fd-muted px-4 py-3 text-[13px]">
        <code>npm update</code>
      </pre>
      <p className="mt-3 text-[13px] text-fd-muted-foreground">
        The MIT versions are inside your existing version range, so <code>npm update</code> (or{' '}
        <code>pnpm update</code>) picks them up without editing <code>package.json</code>.
      </p>
    </div>
  )
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mt-20">
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-fd-primary)]">
          FAQ
        </p>
        <h3 className="text-2xl font-bold tracking-[-0.01em] text-fd-foreground">
          Frequently asked questions
        </h3>
      </div>
      <div className="mx-auto max-w-3xl divide-y divide-fd-border overflow-hidden rounded-xl border border-[var(--tk-card-edge)]">
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
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-fd-primary)]"
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
