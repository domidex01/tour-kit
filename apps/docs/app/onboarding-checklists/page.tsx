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

const PAGE_PATH = '/onboarding-checklists'
const PAGE_TITLE = 'Onboarding Checklists for React | userTourKit'
const PAGE_DESC =
  'React onboarding checklist component with task dependencies, progress persistence, and your design system. Runs free in dev — $99 once when you ship.'
// File-based metadata route (opengraph-image.tsx) — /api/og is robots-disallowed,
// which blocks Twitter/Facebook crawlers from fetching share images.
const OG_IMAGE = `${PAGE_PATH}/opengraph-image`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  keywords: [
    'react onboarding checklist',
    'user onboarding checklist component',
    'setup checklist widget',
    'onboarding checklist react component',
    'checklist component react',
    'user activation checklist',
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

const ChecklistDemo = dynamic(
  () =>
    import('@/components/capability/demos/checklist-demo').then((m) => ({
      default: m.ChecklistDemo,
    })),
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
    question: 'Can checklist tasks depend on each other?',
    answer:
      'Yes. Pass dependsOn: ["task-id"] and the task stays locked until its prerequisites complete. The dependency resolver detects circular dependencies up front, and locked tasks still count toward the progress total so users see the full path to done.',
  },
  {
    question: 'Does progress persist across sessions?',
    answer:
      'Yes. Enable persistence and state is serialized through a storage adapter — localStorage by default, or swap in cookies or your own API in one line for cross-device, authenticated persistence. A returning user lands exactly where they left off.',
  },
  {
    question: 'Can a task launch a product tour or navigate somewhere?',
    answer:
      'Each task takes an action — navigate to a URL, start a @tour-kit/react tour, or run a custom callback. Tasks can also auto-complete from events or custom checks (completedWhen), so "Take the tour" ticks itself when the tour finishes.',
  },
  {
    question: 'Does it match my design system, or do I get an iframe widget?',
    answer:
      'No iframe, no injected CSS. The styled component follows shadcn/ui conventions and inherits your tokens; the headless ChecklistHeadless render-prop variant hands you raw state (tasks, progress, completeTask) to render any UI you want.',
  },
  {
    question: 'What happens before I buy a license?',
    answer:
      'Everything works. @tour-kit/checklists runs unlicensed in development and on localhost with full functionality; production shows a small watermark until you activate a $99 lifetime license. Activation precedes purchase by design — ship the checklist first, pay when it earns its keep.',
  },
]

export default function OnboardingChecklistsPage() {
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
          { name: 'Onboarding Checklists', url: PAGE_PATH },
        ]}
        pageUrl={PAGE_PATH}
      />
      <ProductJsonLd />
      <FAQJsonLd items={FAQ_ITEMS} />

      <main id="main-content" className="flex flex-1 flex-col">
        <CapabilityHero
          slug="checklists"
          eyebrow="@tour-kit/checklists · Pro"
          heading="Checklists that walk users"
          headingAccent="to activation."
          subhead="An embeddable onboarding checklist for React — task dependencies, progress persistence, and adoption nudges, rendered with your own design system."
          primaryLabel="Try it free in dev"
          primaryHref="/docs/checklists"
          secondaryLabel="See pricing"
          secondaryHref="/pricing"
          reassurance="Runs free in dev — pay once ($99) when you ship."
          factsLine="< 10KB gzipped · TypeScript strict · WCAG 2.1 AA · your repo, your code"
        />

        <DemoSection
          heading="Tick the boxes. This one's real."
          subtext="The checklist below is the live @tour-kit/checklists component — complete a task, watch the dependency unlock, and see progress recalculate. No video, no signup wall."
        >
          <ChecklistDemo />
        </DemoSection>

        <PainOutcomeStrip
          heading="Activation shouldn't be a maze"
          subtext="Most onboarding stalls between signup and the aha moment. A checklist gives users a visible path — if it doesn't fight your stack."
          items={[
            {
              pain: 'DIY checklist sprawl',
              painDetail:
                'A "quick" useState checklist grows persistence, dependencies, and edge cases until it is a side project nobody owns.',
              outcome: 'A checklist engine, not a TODO hack',
              outcomeDetail:
                'Dependencies, persistence, visibility rules, and progress math are the package. You write the task list.',
            },
            {
              pain: 'Heavyweight suite, iframe UI',
              painDetail:
                'Pendo-style platforms render their checklist in their styles, behind their script tag, for $300+ a month.',
              outcome: 'Your components, your tokens',
              outcomeDetail:
                'Styled (shadcn-native) or fully headless — the checklist looks like your product because it is your product.',
            },
            {
              pain: 'No idea where users stall',
              painDetail:
                'Without per-task signals you learn about drop-off from churn, weeks too late.',
              outcome: 'Per-task events, your analytics',
              outcomeDetail:
                'Task completions stream into PostHog, Mixpanel, Amplitude, or GA4 via @tour-kit/analytics — you see the exact task where users stop.',
            },
          ]}
        />

        <HowItWorks
          thing="checklist"
          packageName="@tour-kit/checklists"
          studioTemplate="feature-checklist"
          composeFilename="onboarding.tsx"
          composeCode={`import {
  ChecklistProvider,
  Checklist,
} from '@tour-kit/checklists'

<ChecklistProvider checklists={[onboarding]}>
  <Checklist checklistId="onboarding" showProgress />
</ChecklistProvider>`}
          docsHref="/docs/checklists"
        />

        <CapabilityFeatures
          heading="Built for activation, not just ticking boxes"
          subtext="Three pillars every userTourKit package shares, plus the checklist-specific machinery that usually eats a sprint."
          items={[
            {
              title: 'Headless or pre-styled',
              description:
                'Drop in the shadcn-style component or use the render-prop ChecklistHeadless and own every pixel.',
            },
            {
              title: 'WCAG 2.1 AA accessible',
              description:
                'Keyboard operable, screen-reader announced, focus-managed. Lighthouse a11y 100 out of the box.',
            },
            {
              title: 'The code lands in your repo',
              description:
                'No embed script, no vendor dashboard, no monthly invoice. Checklists are TypeScript in your bundle.',
            },
            {
              title: 'Task dependencies',
              description:
                'dependsOn locks tasks until prerequisites complete, with circular-dependency detection built in.',
            },
            {
              title: 'Progress persistence',
              description:
                'localStorage by default; swap in cookies or your API with a one-line storage adapter for cross-device state.',
            },
            {
              title: 'Adoption nudges',
              description:
                'Pair with the adoption tracker to nudge users back to unfinished tasks at the right moment.',
              packageBadge: '@tour-kit/adoption',
            },
          ]}
        />

        <CtaBand
          placement="checklists_after_features"
          eyebrow="Pro package"
          heading="Try it free in dev — watermark until you license."
          subtext="Full functionality in development and on localhost, no key required. One $99 license unlocks production for all Pro packages."
          ctaLabel="Build my checklist"
          reassurance="No signup, no credit card — install and go."
          primaryHref="/docs/checklists"
        />

        <PricingTeaser placement="checklists_teaser" />

        <ComparisonTeaser
          heading="Checklists without the platform tax"
          rows={[
            { label: 'Cost', tourKit: '$99 once', saas: '$200–900/mo', oss: 'DIY time' },
            { label: 'Task dependencies', tourKit: 'yes', saas: 'partial', oss: 'no' },
            {
              label: 'Design system fit',
              tourKit: 'Your components',
              saas: 'Their iframe',
              oss: 'CSS overrides',
            },
          ]}
        />

        <SocialProof />

        <CapabilityFaq
          idPrefix="checklists"
          heading="Checklist questions, answered straight"
          subtext="The things developers ask before swapping out a hand-rolled checklist."
          items={FAQ_ITEMS}
        />

        <FinalCta
          slug="checklists"
          heading="Ship the checklist."
          headingAccent="Skip the side project."
          subtext="Install now, watch it run free in dev, license it when it ships."
          installCmd="pnpm add @tour-kit/checklists"
          primaryLabel="Get started"
          primaryHref="/docs/checklists"
          siblings={[
            {
              label: 'Product tours',
              href: '/product-tours',
              description: 'Walk users through the tasks your checklist unlocks.',
            },
            {
              label: 'In-app surveys',
              href: '/in-app-surveys',
              description: 'Ask users how onboarding felt — right when they finish.',
            },
          ]}
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
