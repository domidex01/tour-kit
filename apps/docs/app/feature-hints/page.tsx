import { CapabilityFaq } from '@/components/capability/capability-faq'
import { CapabilityFeatures } from '@/components/capability/capability-features'
import { CapabilityHero } from '@/components/capability/capability-hero'
import { ComparisonTeaser } from '@/components/capability/comparison-teaser'
import { DemoSection } from '@/components/capability/demo-section'
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
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const PAGE_PATH = '/feature-hints'
const PAGE_TITLE = 'Feature Hints & Beacons for React | userTourKit'
const PAGE_DESC =
  'React feature hints, tooltips, and pulsing beacons for feature discovery — free and MIT licensed, under 5KB, headless or pre-styled, WCAG 2.1 AA.'
const OG_IMAGE = `/api/og?title=${encodeURIComponent('Feature Hints & Beacons')}&category=HINTS`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  keywords: [
    'react feature hints',
    'react tooltips onboarding',
    'hotspots react',
    'beacons react',
    'feature discovery react',
    'react hint component',
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

const HintDemo = dynamic(
  () => import('@/components/capability/demos/hint-demo').then((m) => ({ default: m.HintDemo })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto h-[360px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
      />
    ),
  }
)

const FAQ_ITEMS: CapabilityFaqItem[] = [
  {
    question: 'How are hints different from a product tour?',
    answer:
      'Tours are sequential — step 1, step 2, done. Hints are independent: each beacon has its own open/dismissed state and lives until the user dismisses it. Use a hint to point at one new feature; use a tour to walk through a flow. The packages compose if you need both.',
  },
  {
    question: 'Is @tour-kit/hints really free?',
    answer:
      'Yes — MIT licensed, free forever, commercial use included, no watermark, no feature gates. It is one of the three free core packages alongside @tour-kit/core and @tour-kit/react.',
  },
  {
    question: 'Do dismissed hints stay dismissed?',
    answer:
      'Yes. dismiss() persists through a storage adapter (localStorage by default, your API in one line), so a hint never re-haunts a user. hide() closes it for the session only — it returns next visit.',
  },
  {
    question: 'Does the pulsing animation respect prefers-reduced-motion?',
    answer:
      'Yes, twice over: the pulse keyframes are wrapped in a reduced-motion media query, and a useReducedMotion hook gates the render-time animation classes. Users who opt out of motion get a static, fully functional hotspot.',
  },
  {
    question: 'What variants ship besides the pulsing dot?',
    answer:
      'Pulsing beacon, notification-count badge, beacon-with-label, and a "What\'s new" pill — all positionable on any element, all under 5KB gzipped total, all stylable via variants or fully headless composition.',
  },
]

export default function FeatureHintsPage() {
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
          { name: 'Feature Hints', url: PAGE_PATH },
        ]}
        pageUrl={PAGE_PATH}
      />
      <ProductJsonLd />
      <FAQJsonLd items={FAQ_ITEMS} />

      <main id="main-content" className="flex flex-1 flex-col">
        <CapabilityHero
          slug="hints"
          eyebrow="@tour-kit/hints · Free & MIT"
          heading="Point users to what's new —"
          headingAccent="without a tour."
          subhead="Persistent hints, tooltips, and pulsing beacons for React feature discovery. Each hint lives independently until dismissed — no sequence, no modal takeover."
          primaryLabel="Build my first hint"
          primaryHref="/docs/hints"
          secondaryLabel="View on GitHub"
          secondaryHref="https://github.com/domidex01/tour-kit"
          installCmd="pnpm add @tour-kit/hints"
          factsLine="< 5KB gzipped · MIT licensed · TypeScript strict · WCAG 2.1 AA"
        />

        <DemoSection
          heading="Click a beacon. It's live."
          subtext="The pulsing hotspots below are the real @tour-kit/hints components — open a tooltip, dismiss it, and it stays dismissed. No video, no signup wall."
        >
          <HintDemo />
        </DemoSection>

        <PainOutcomeStrip
          heading="New features shouldn't need a memo"
          subtext="Users don't read release emails and skip full tours. A well-placed pulse is often all the feature discovery you need."
          items={[
            {
              pain: 'Forcing a tour for one feature',
              painDetail:
                'A 6-step walkthrough to highlight one new button trains users to skip every tour you ever ship.',
              outcome: 'One beacon, zero interruption',
              outcomeDetail:
                'A pulsing dot on the feature itself — curious users click, busy users keep working.',
            },
            {
              pain: 'Hand-rolled tooltips drift',
              painDetail:
                'DIY hint state scatters across components: who was dismissed, where, did it survive the redesign?',
              outcome: 'Independent, persistent state',
              outcomeDetail:
                'Every hint tracks open/dismissed through a storage adapter — dismissed means dismissed, across sessions.',
            },
            {
              pain: 'Tooltip libraries fight your stack',
              painDetail:
                'Generic tooltip packages bring their own positioning quirks, z-index wars, and CSS resets.',
              outcome: 'Floating-UI positioning, your styles',
              outcomeDetail:
                'Anchored by the same battle-tested positioning engine as the tours — styled with your tokens, shadcn-native.',
            },
          ]}
        />

        <HowItWorks
          thing="hint"
          packageName="@tour-kit/hints"
          studioTemplate="feature-hint"
          composeFilename="new-feature-hint.tsx"
          composeCode={`import { HintsProvider, Hint } from '@tour-kit/hints'

<HintsProvider>
  <Hint
    id="reports-launch"
    target="#reports-nav"
    title="Reports just shipped"
    content="Track usage over time."
  />
</HintsProvider>`}
          docsHref="/docs/hints"
        />

        <CapabilityFeatures
          heading="Small package, complete feature discovery"
          subtext="Three pillars every userTourKit package shares, plus what makes hints the lightest way to ship discovery."
          items={[
            {
              title: 'Headless or pre-styled',
              description:
                'Drop-in beacon and tooltip components, or compose HintHotspot and HintTooltip yourself.',
            },
            {
              title: 'WCAG 2.1 AA accessible',
              description:
                'Hotspots are real buttons — keyboard focusable, screen-reader labeled, Esc dismisses the tooltip.',
            },
            {
              title: 'The code lands in your repo',
              description:
                'MIT licensed, free forever. No embed script, no usage caps, no watermark — fork it if you ever want to.',
            },
            {
              title: 'Four hint variants',
              description:
                'Pulsing beacon, count badge, beacon-with-label, and "What\'s new" pill — pick per feature.',
            },
            {
              title: 'Dismissal that sticks',
              description:
                'dismiss() persists per user via storage adapters; hide() pauses for the session. Never re-haunt a user.',
            },
            {
              title: 'Reduced-motion safe pulse',
              description:
                'The pulse honors prefers-reduced-motion at both the CSS and render level — static hotspot, same function.',
            },
          ]}
        />

        <CtaBand
          placement="hints_after_features"
          eyebrow="Free & open source"
          heading="Build your first hint — free & MIT, no signup."
          subtext="Install the package and ship a beacon today. Pro packages add checklists, announcements, and surveys when you need them."
          ctaLabel="Build my first hint"
          reassurance="Free & MIT-licensed — no signup, no credit card."
          primaryHref="/docs/hints"
        />

        <ComparisonTeaser
          heading="Feature discovery without the baggage"
          rows={[
            { label: 'Cost', tourKit: 'Free (MIT)', saas: '$200–900/mo', oss: 'Free' },
            { label: 'Bundle impact', tourKit: '< 5KB', saas: 'External script', oss: '30–50KB' },
            { label: 'Accessibility', tourKit: 'WCAG 2.1 AA', saas: 'partial', oss: 'no' },
          ]}
        />

        <SocialProof />

        <CapabilityFaq
          idPrefix="hints"
          heading="Hint questions, answered straight"
          subtext="What developers ask before adding beacons to their app."
          items={FAQ_ITEMS}
        />

        <FinalCta
          slug="hints"
          heading="Ship a beacon"
          headingAccent="before lunch."
          subtext="Free, MIT, under 5KB. The fastest feature-discovery win in your backlog."
          installCmd="pnpm add @tour-kit/hints"
          primaryLabel="Get started"
          primaryHref="/docs/hints"
          siblings={[
            {
              label: 'Product tours',
              href: '/product-tours',
              description: 'When one beacon isn’t enough — walk users through the flow.',
            },
            {
              label: 'Product announcements',
              href: '/product-announcements',
              description: 'Announce the release, then leave a hint behind.',
            },
          ]}
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
