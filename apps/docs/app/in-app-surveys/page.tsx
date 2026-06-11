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

const PAGE_PATH = '/in-app-surveys'
const PAGE_TITLE = 'In-App Surveys & NPS for React | userTourKit'
const PAGE_DESC =
  'In-app survey component for React — NPS, CSAT, CES with skip logic and fatigue prevention. Your design system. Runs free in dev, $99 once to ship.'
// File-based metadata route (opengraph-image.tsx) — /api/og is robots-disallowed,
// which blocks Twitter/Facebook crawlers from fetching share images.
const OG_IMAGE = `${PAGE_PATH}/opengraph-image`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  keywords: [
    'in-app survey react',
    'NPS survey component react',
    'microsurveys',
    'react survey component',
    'CSAT survey react',
    'in-product survey library',
  ],
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    type: 'website',
    url: PAGE_PATH,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [{ url: OG_IMAGE, alt: PAGE_TITLE }],
  },
}

const SurveyDemo = dynamic(
  () =>
    import('@/components/capability/demos/survey-demo').then((m) => ({ default: m.SurveyDemo })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto h-[480px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
      />
    ),
  }
)

const PricingTeaser = dynamic(
  () => import('@/components/landing/pricing-teaser').then((m) => ({ default: m.PricingTeaser })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto my-12 h-[560px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
      />
    ),
  }
)

const FAQ_ITEMS: CapabilityFaqItem[] = [
  {
    question: 'Does skip logic work, or is every survey linear?',
    answer:
      'Skip logic is built in — route to different questions based on previous answers, including arbitrary function predicates. The flow engine tracks visited steps so conditional chains can never loop forever.',
  },
  {
    question: 'How do you stop surveys from annoying users?',
    answer:
      'Fatigue prevention is layered: a global cooldown between any two surveys, per-survey frequency rules (once / session / every N days), sampling rates, user-initiated snooze, and a hard cap per session. Survey fatigue is the product killer, so it is handled in the engine, not left to you.',
  },
  {
    question: 'Which survey types and display modes ship in the box?',
    answer:
      'NPS (0–10 with promoter/passive/detractor scoring), CSAT, CES, and fully custom flows — rating, text, single/multi-select, and boolean questions. Render any of them as a modal, slideout, banner, popover anchored to an element, or inline in the page.',
  },
  {
    question: 'Where do responses go? Do you store my user data?',
    answer:
      'Responses stay in your app. Completion handlers hand you the response map; scoring helpers (calculateNPS, calculateCSAT, calculateCES) run locally; @tour-kit/analytics streams events to your own PostHog, Mixpanel, Amplitude, or GA4. Nothing touches userTourKit servers.',
  },
  {
    question: 'What happens before I buy a license?',
    answer:
      'Everything works. @tour-kit/surveys runs unlicensed in development and on localhost with full functionality; production shows a small watermark until you activate a $99 lifetime license that covers every Pro package.',
  },
]

export default function InAppSurveysPage() {
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
          { name: 'In-App Surveys', url: PAGE_PATH },
        ]}
        pageUrl={PAGE_PATH}
      />
      <ProductJsonLd />
      <FAQJsonLd items={FAQ_ITEMS} />

      <main id="main-content" className="flex flex-1 flex-col">
        <CapabilityHero
          slug="surveys"
          eyebrow="@tour-kit/surveys · Pro"
          heading="Ask in context."
          headingAccent="Hear the truth."
          subhead="In-app microsurveys for React — NPS, CSAT, CES, and custom flows with skip logic and fatigue prevention, rendered in your own design system."
          primaryLabel="Try it free in dev"
          primaryHref="/docs/surveys"
          secondaryLabel="See pricing"
          secondaryHref="/pricing"
          reassurance="Runs free in dev — pay once ($99) when you ship."
          factsLine="5 display modes · skip logic · NPS/CSAT/CES scoring · your repo, your code"
        />

        <DemoSection
          heading="Two questions. Real component."
          subtext="Answer the NPS survey below — it is the live @tour-kit/surveys component, scored on the spot by calculateNPS(). No video, no signup wall."
        >
          <SurveyDemo />
        </DemoSection>

        <PainOutcomeStrip
          heading="Email surveys arrive too late"
          subtext="Feedback is most honest seconds after the experience. Catch it in the product — without burning user goodwill."
          items={[
            {
              pain: 'Surveys land in inboxes, not moments',
              painDetail:
                'Email NPS three weeks after onboarding measures memory, not experience. Response rates show it.',
              outcome: 'Ask at the moment of truth',
              outcomeDetail:
                'Trigger in-product, right after the action — completion of onboarding, first export, a support interaction.',
            },
            {
              pain: 'Survey fatigue burns trust',
              painDetail:
                'Hand-rolled triggers fire on every visit until users learn to dismiss everything you show them.',
              outcome: 'Fatigue prevention in the engine',
              outcomeDetail:
                'Global cooldowns, frequency rules, sampling, snooze, and session caps — enforced by the package, not a TODO.',
            },
            {
              pain: 'Another tool, another data silo',
              painDetail:
                'Survey SaaS keeps your responses on their servers, behind their export limits and their invoice.',
              outcome: 'Responses stay in your stack',
              outcomeDetail:
                'Scoring runs locally; events stream into your PostHog, Mixpanel, Amplitude, or GA4 via @tour-kit/analytics.',
            },
          ]}
        />

        <HowItWorks
          thing="survey"
          packageName="@tour-kit/surveys"
          composeFilename="nps-survey.tsx"
          composeCode={`import {
  SurveysProvider,
  SurveyPopover,
} from '@tour-kit/surveys'

<SurveysProvider surveys={[npsSurvey]}>
  <SurveyPopover id="nps-q2" />
</SurveysProvider>`}
          docsHref="/docs/surveys"
        />

        <CapabilityFeatures
          heading="A research tool, not a popup generator"
          subtext="Three pillars every userTourKit package shares, plus the survey machinery that separates signal from annoyance."
          items={[
            {
              title: 'Headless or pre-styled',
              description:
                'shadcn-style question components out of the box, or raw state via hooks to render any UI you want.',
            },
            {
              title: 'WCAG 2.1 AA accessible',
              description:
                'Keyboard operable rating scales, focus management, screen-reader announcements — surveys everyone can answer.',
            },
            {
              title: 'The code lands in your repo',
              description:
                'No embed script, no vendor dashboard. Surveys are TypeScript in your bundle, versioned with your app.',
            },
            {
              title: 'Skip logic',
              description:
                'Branch on previous answers with declarative rules or function predicates — cycle detection included.',
            },
            {
              title: 'NPS, CSAT & CES scoring',
              description:
                'Built-in scoring with promoter/passive/detractor classification — calculated locally, reported to your analytics.',
            },
            {
              title: 'In-context targeting & media',
              description:
                'Anchor popover surveys to elements, gate by audience, and embed video or images in questions.',
              packageBadge: '@tour-kit/media',
            },
          ]}
        />

        <CtaBand
          placement="surveys_after_features"
          eyebrow="Pro package"
          heading="Try it free in dev — watermark until you license."
          subtext="Full functionality in development and on localhost, no key required. One $99 license unlocks production for all Pro packages."
          ctaLabel="Build my first survey"
          reassurance="No signup, no credit card — install and go."
          primaryHref="/docs/surveys"
        />

        <PricingTeaser placement="surveys_teaser" />

        <ComparisonTeaser
          heading="Microsurveys without the platform tax"
          rows={[
            { label: 'Cost', tourKit: '$99 once', saas: '$200–900/mo', oss: 'DIY time' },
            { label: 'Fatigue prevention', tourKit: 'yes', saas: 'partial', oss: 'no' },
            {
              label: 'Response data ownership',
              tourKit: 'Your stack',
              saas: 'Their servers',
              oss: 'yes',
            },
          ]}
        />

        <SocialProof />

        <CapabilityFaq
          idPrefix="surveys"
          heading="Survey questions, answered straight"
          subtext="What developers ask before replacing email blasts with in-product research."
          items={FAQ_ITEMS}
        />

        <FinalCta
          slug="surveys"
          heading="Ask better questions."
          headingAccent="Own the answers."
          subtext="Install now, run it free in dev, license it when it ships."
          installCmd="pnpm add @tour-kit/surveys"
          primaryLabel="Get started"
          primaryHref="/docs/surveys"
          siblings={[
            {
              label: 'Onboarding checklists',
              href: '/onboarding-checklists',
              description: 'Survey users the moment they finish activation.',
            },
            {
              label: 'Product announcements',
              href: '/product-announcements',
              description: 'Close the loop — announce what their feedback shipped.',
            },
          ]}
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
