import { CapabilityFaq } from '@/components/capability/capability-faq'
import { CapabilityFeatures } from '@/components/capability/capability-features'
import { CapabilityHero } from '@/components/capability/capability-hero'
import { ComparisonTeaser } from '@/components/capability/comparison-teaser'
import { FinalCta } from '@/components/capability/final-cta'
import { HowItWorks } from '@/components/capability/how-it-works'
import { PainOutcomeStrip } from '@/components/capability/pain-outcome'
import type { CapabilityFaqItem } from '@/components/capability/types'
import { CapabilityWebPageJsonLd } from '@/components/capability/web-page-json-ld'
import { CtaBand } from '@/components/landing/cta-band'
import { Footer } from '@/components/landing/footer'
import { SocialProof } from '@/components/landing/social-proof'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, FAQJsonLd, ProductJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const PAGE_PATH = '/product-tours'
const PAGE_TITLE = 'Product Tours for React — Headless & Accessible | userTourKit'
const PAGE_DESC =
  'React product tour library with headless hooks, pre-styled components, router adapters, and WCAG 2.1 AA accessibility. Free and MIT licensed.'
const OG_IMAGE = `/api/og?title=${encodeURIComponent('Product Tours for React')}&category=TOURS`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  keywords: [
    'react product tour library',
    'react product tour component',
    'product tour npm',
    'guided tour react',
    'react walkthrough component',
    'spotlight tour react',
  ],
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    type: 'website',
    url: PAGE_PATH,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [OG_IMAGE],
  },
}

/**
 * The interactive tour demo is the same component the home page ships —
 * it IS the product, so /product-tours reuses it rather than a lookalike.
 */
const DemoTour = dynamic(
  () => import('@/components/landing/demo-tour').then((m) => ({ default: m.DemoTour })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto my-12 h-[640px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
      />
    ),
  }
)

const FAQ_ITEMS: CapabilityFaqItem[] = [
  {
    question: 'Is the product tour library really free for commercial use?',
    answer:
      '@tour-kit/core and @tour-kit/react are MIT licensed — free forever, commercial use included, no watermark, no MAU caps. Pro packages (checklists, announcements, surveys, analytics) are a separate $99 one-time license when you need them.',
  },
  {
    question: 'Does it survive route changes and async-mounted targets?',
    answer:
      'Yes. Router adapters ship for the Next.js App Router, Pages Router, React Router, and TanStack Router, and the positioner re-queries targets on route changes and DOM mutations. If a target disappears mid-tour you choose: skip the step, wait for it, or fall back to a centered dialog.',
  },
  {
    question: 'How accessible are the tours, actually?',
    answer:
      'WCAG 2.1 AA: focus is trapped in the active step, Tab order is managed, Esc ends the tour, steps are announced to screen readers, and animations honor prefers-reduced-motion. Lighthouse accessibility scores 100 — it is a release gate, not an aspiration.',
  },
  {
    question: 'Headless hooks or styled components — which do I get?',
    answer:
      'Both. @tour-kit/react ships pre-styled, shadcn-native Tour/TourStep components for the fast path, and every behavior is available through headless hooks from @tour-kit/core when you want to render entirely your own UI.',
  },
  {
    question: 'How big is it, and what does that cost my users?',
    answer:
      'The core engine is under 8KB gzipped and the React components under 12KB — roughly a sixth of react-joyride. Tours code-split cleanly because everything is tree-shakeable ESM.',
  },
]

export default function ProductToursPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <CapabilityWebPageJsonLd
        path={PAGE_PATH}
        title={PAGE_TITLE}
        description={PAGE_DESC}
        ogImage={OG_IMAGE}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Product Tours', url: PAGE_PATH },
        ]}
        pageUrl={PAGE_PATH}
      />
      <ProductJsonLd />
      <FAQJsonLd items={FAQ_ITEMS} />

      <main id="main-content" className="flex flex-1 flex-col">
        <CapabilityHero
          slug="tours"
          eyebrow="@tour-kit/core + @tour-kit/react · Free & MIT"
          heading="Product tours your users"
          headingAccent="actually finish."
          subhead="A React product tour library built headless-first — spotlight overlays, router-aware steps, and WCAG 2.1 AA accessibility, styled by your design system."
          primaryLabel="Build my first tour"
          primaryHref="/docs/getting-started"
          secondaryLabel="View on GitHub"
          secondaryHref="https://github.com/domidex01/tour-kit"
          installCmd="pnpm add @tour-kit/react"
          factsLine="< 8KB core gzipped · TypeScript strict · WCAG 2.1 AA · own your code"
        />

        {/* Live demo — the real Tour running on this page */}
        <DemoTour />

        <PainOutcomeStrip
          heading="Why tours get skipped"
          subtext="Most product tours die one of three deaths: they break, they bloat, or they look like a foreign object. None of those are user problems — they're library problems."
          items={[
            {
              pain: 'Tours break on route changes',
              painDetail:
                'window.location-based libraries shatter the moment you migrate routers or lazy-mount a target.',
              outcome: 'Router-aware by design',
              outcomeDetail:
                'First-class adapters for Next.js (App + Pages), React Router, and TanStack Router; targets re-resolve on navigation.',
            },
            {
              pain: '47KB to show three tooltips',
              painDetail:
                'Legacy tour libraries ship more JavaScript than React itself — and your users pay the download.',
              outcome: 'Under 8KB, tree-shakeable',
              outcomeDetail:
                'The headless core is < 8KB gzipped; styled components add < 12KB. Code-splits cleanly behind a dynamic import.',
            },
            {
              pain: 'Looks like a browser extension',
              painDetail:
                'Injected CSS and fixed themes make every tour look bolted on — brand teams notice.',
              outcome: 'Your components, your tokens',
              outcomeDetail:
                'Headless hooks plus shadcn-native styled components — the tour is indistinguishable from your product.',
            },
          ]}
        />

        <HowItWorks
          thing="tour"
          packageName="@tour-kit/react"
          studioTemplate="welcome-tour"
          composeFilename="onboarding.tsx"
          composeCode={`import { Tour, TourStep } from '@tour-kit/react'

<Tour id="welcome">
  <TourStep
    target="#sidebar"
    title="Navigation"
    content="Browse your projects here."
  />
</Tour>`}
          docsHref="/docs/react"
        />

        {/* core vs react — one buyer intent, two install styles (plan §2) */}
        <section className="bg-[#EDF6FB] px-6 py-20 sm:px-8 md:py-28 lg:px-12 dark:bg-fd-muted/30">
          <div className="mx-auto max-w-[1120px]">
            <div className="mb-14 max-w-lg">
              <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
                Two ways in. Same engine.
              </h2>
              <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
                Start with the styled components and eject to headless when the design team comes
                knocking — both packages share the same core and the same MIT license.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-fd-border bg-fd-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-1 font-mono text-[14px] font-bold text-fd-foreground">
                  @tour-kit/react
                </h3>
                <p className="mb-4 text-[13px] text-fd-muted-foreground">
                  Pre-styled components — the fast path
                </p>
                <p className="mb-5 text-[14px] leading-[1.6] text-fd-muted-foreground">
                  Drop-in Tour, TourStep, spotlight overlay, and card — shadcn-native styling,
                  router adapters, and sensible defaults. Most teams ship with this.
                </p>
                <Link
                  href="/docs/react"
                  className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[#0197f6] transition-colors hover:opacity-80"
                >
                  React docs
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="rounded-xl border border-fd-border bg-fd-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-1 font-mono text-[14px] font-bold text-fd-foreground">
                  @tour-kit/core
                </h3>
                <p className="mb-4 text-[13px] text-fd-muted-foreground">
                  Headless engine — total control
                </p>
                <p className="mb-5 text-[14px] leading-[1.6] text-fd-muted-foreground">
                  Hooks, positioning, focus management, and state with zero UI opinions — render
                  every pixel yourself, in any framework wrapper.
                </p>
                <Link
                  href="/docs/core"
                  className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[#0197f6] transition-colors hover:opacity-80"
                >
                  Core docs
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <CapabilityFeatures
          heading="Everything a tour needs to survive production"
          subtext="Three pillars every userTourKit package shares, plus the tour-specific engineering that DIY attempts discover the hard way."
          items={[
            {
              title: 'Headless or pre-styled',
              description:
                'Styled Tour/TourStep components for speed, headless hooks for control — same engine underneath.',
            },
            {
              title: 'WCAG 2.1 AA accessible',
              description:
                'Focus trap, keyboard navigation, screen-reader announcements, reduced-motion — Lighthouse a11y 100.',
            },
            {
              title: 'The code lands in your repo',
              description:
                'MIT licensed, free forever. Tours are TypeScript in your bundle, not a script tag from a vendor.',
            },
            {
              title: 'Router adapters',
              description:
                'Next.js App & Pages Router, React Router, TanStack Router — multi-page tours that survive navigation.',
            },
            {
              title: 'Progress persistence',
              description:
                'localStorage by default, or your API via a one-line storage adapter — returning users resume, not restart.',
            },
            {
              title: 'Tour analytics',
              description:
                'Step views, completions, and drop-offs streamed to PostHog, Mixpanel, Amplitude, or GA4.',
              packageBadge: '@tour-kit/analytics',
            },
          ]}
        />

        <CtaBand
          placement="tours_after_features"
          eyebrow="Free & open source"
          heading="Build your first tour — free & MIT, no signup."
          subtext="Install the package and ship a tour today. Pro packages add checklists, announcements, and surveys when you need them."
          ctaLabel="Build my first tour"
          reassurance="Free & MIT-licensed — no signup, no credit card."
        />

        <ComparisonTeaser
          heading="The third option between SaaS and DIY"
          rows={[
            { label: 'Cost', tourKit: 'Free (MIT)', saas: '$200–900/mo', oss: 'Free' },
            { label: 'Bundle impact', tourKit: '< 8KB', saas: 'External script', oss: '30–50KB' },
            { label: 'Headless mode', tourKit: 'yes', saas: 'no', oss: 'no' },
          ]}
        />

        <SocialProof />

        <CapabilityFaq
          idPrefix="tours"
          heading="Tour questions, answered straight"
          subtext="What developers ask before adding a product tour dependency."
          items={FAQ_ITEMS}
        />

        <FinalCta
          slug="tours"
          heading="Own your onboarding."
          headingAccent="Ship it today."
          subtext="Free, MIT, under 8KB. The tour library you'd have built with three spare weeks."
          installCmd="pnpm add @tour-kit/react"
          primaryLabel="Get started"
          primaryHref="/docs/getting-started"
          siblings={[
            {
              label: 'Feature hints',
              href: '/feature-hints',
              description: 'For single features that don’t need a full walkthrough.',
            },
            {
              label: 'Onboarding checklists',
              href: '/onboarding-checklists',
              description: 'Give users a persistent path after the tour ends.',
            },
          ]}
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
