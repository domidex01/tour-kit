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

const PAGE_PATH = '/product-announcements'
const PAGE_TITLE = 'In-App Announcements for React | userTourKit'
const PAGE_DESC =
  'In-app announcements for React — modal, banner, toast, slideout, spotlight — with scheduling, audience rules, and a priority queue. $99 once to ship.'
// File-based metadata route (opengraph-image.tsx) — /api/og is robots-disallowed,
// which blocks Twitter/Facebook crawlers from fetching share images.
const OG_IMAGE = `${PAGE_PATH}/opengraph-image`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  keywords: [
    'in-app announcements react',
    'product announcement modal',
    'product announcement banner',
    'changelog widget react',
    'react announcement component',
    'in-product messaging library',
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

const AnnouncementDemo = dynamic(
  () =>
    import('@/components/capability/demos/announcement-demo').then((m) => ({
      default: m.AnnouncementDemo,
    })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto h-[360px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
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
    question: 'What announcement formats are included?',
    answer:
      'Five variants from one config shape: centered modal for releases that matter, top/bottom banner for persistent notices, corner toast with auto-dismiss, slideout panel for longer changelogs, and spotlight that anchors to a specific element. Each has a headless render-prop twin.',
  },
  {
    question: 'Can I schedule an announcement ahead of time?',
    answer:
      'Yes — pair with @tour-kit/scheduling to gate announcements by date windows, business hours, recurring patterns, and timezones. Ship the config on Friday; the banner appears Monday 9am in each user’s local time.',
  },
  {
    question: 'How do you avoid stacking three announcements on one screen?',
    answer:
      'A priority queue (critical > high > normal > low) shows one at a time by default — the next dequeues when the current dismisses. Frequency rules (once / per session / every N days) and audience targeting decide who sees what, how often.',
  },
  {
    question: 'Can announcements include video or images?',
    answer:
      'Yes. Announcement configs take a media slot — YouTube, Vimeo, Loom, Wistia, GIF, Lottie, or plain images via @tour-kit/media, with lazy loading and reduced-motion handling built in.',
  },
  {
    question: 'What happens before I buy a license?',
    answer:
      'Everything works. @tour-kit/announcements runs unlicensed in development and on localhost with full functionality; production shows a small watermark until you activate a $99 lifetime license that covers every Pro package.',
  },
]

export default function ProductAnnouncementsPage() {
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
          { name: 'Product Announcements', url: PAGE_PATH },
        ]}
        pageUrl={PAGE_PATH}
      />
      <ProductJsonLd />
      <FAQJsonLd items={FAQ_ITEMS} />

      <main id="main-content" className="flex flex-1 flex-col">
        <CapabilityHero
          slug="announcements"
          eyebrow="@tour-kit/announcements · Pro"
          heading="Ship the news"
          headingAccent="inside your product."
          subhead="In-app announcements for React — modal, banner, toast, slideout, and spotlight variants with scheduling, audience rules, and a priority queue."
          primaryLabel="Try it free in dev"
          primaryHref="/docs/announcements"
          secondaryLabel="See pricing"
          secondaryHref="/pricing"
          reassurance="Runs free in dev — pay once ($99) when you ship."
          factsLine="5 variants · priority queue · frequency rules · your repo, your code"
        />

        <DemoSection
          heading="Press the button. That's the component."
          subtext="The modal and toast below are the live @tour-kit/announcements components — focus-trapped, Esc to close, styled with this site's tokens. This very site's sale banner runs on the same package."
        >
          <AnnouncementDemo />
        </DemoSection>

        <PainOutcomeStrip
          heading="Release notes nobody reads"
          subtext="Features users never discover may as well not exist. The fix is announcing in-product — without turning your app into a popup festival."
          items={[
            {
              pain: 'Changelogs live in a graveyard',
              painDetail:
                'The /changelog page gets traffic from you and your cofounder. Users learn about features by accident.',
              outcome: 'News lands inside the product',
              outcomeDetail:
                'Announce where users already are — modal for the big stuff, toast for the small, spotlight to point at the new button.',
            },
            {
              pain: 'Popup chaos, zero coordination',
              painDetail:
                'Three teams ship three banners and the user gets all of them at once, on their first session back.',
              outcome: 'One queue, clear priorities',
              outcomeDetail:
                'The priority queue shows one announcement at a time; frequency rules and audience targeting keep each one relevant.',
            },
            {
              pain: '$300/mo for a banner',
              painDetail:
                'Messaging suites price in-app announcements like enterprise software and render them in their styles, not yours.',
              outcome: 'Your design system, $99 once',
              outcomeDetail:
                'shadcn-native components or fully headless render props — the announcement looks like your product.',
            },
          ]}
        />

        <HowItWorks
          thing="announcement"
          packageName="@tour-kit/announcements"
          studioTemplate="changelog-announcement"
          composeFilename="release-modal.tsx"
          composeCode={`import {
  AnnouncementsProvider,
  AnnouncementModal,
} from '@tour-kit/announcements'

<AnnouncementsProvider announcements={[release]}>
  <AnnouncementModal id="v2-launch" useConfig />
</AnnouncementsProvider>`}
          docsHref="/docs/announcements"
        />

        <CapabilityFeatures
          heading="A messaging system, not a popup"
          subtext="Three pillars every userTourKit package shares, plus the coordination machinery that keeps announcements welcome."
          items={[
            {
              title: 'Headless or pre-styled',
              description:
                'Five shadcn-style variants, each with a headless render-prop twin for fully custom UI.',
            },
            {
              title: 'WCAG 2.1 AA accessible',
              description:
                'Focus-trapped modals, Esc to dismiss, screen-reader announcements, reduced-motion safe animations.',
            },
            {
              title: 'The code lands in your repo',
              description:
                'No embed script, no vendor dashboard. Announcements are config in your codebase, reviewed in your PRs.',
            },
            {
              title: 'Priority queue & frequency rules',
              description:
                'critical > high > normal > low, one at a time; show once, per session, or every N days — per announcement.',
            },
            {
              title: 'Scheduling & timezones',
              description:
                'Date windows, business hours, and recurring patterns evaluated in each user’s local timezone.',
              packageBadge: '@tour-kit/scheduling',
            },
            {
              title: 'Rich media embeds',
              description:
                'YouTube, Vimeo, Loom, Wistia, GIF, and Lottie inside any announcement, lazy-loaded.',
              packageBadge: '@tour-kit/media',
            },
          ]}
        />

        <CtaBand
          placement="announcements_after_features"
          eyebrow="Pro package"
          heading="Try it free in dev — watermark until you license."
          subtext="Full functionality in development and on localhost, no key required. One $99 license unlocks production for all Pro packages."
          ctaLabel="Build my announcement"
          reassurance="No signup, no credit card — install and go."
          primaryHref="/builder"
        />

        <PricingTeaser placement="announcements_teaser" />

        <ComparisonTeaser
          heading="In-app messaging without the platform tax"
          rows={[
            { label: 'Cost', tourKit: '$99 once', saas: '$200–900/mo', oss: 'DIY time' },
            { label: 'Priority queue', tourKit: 'yes', saas: 'partial', oss: 'no' },
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
          idPrefix="announcements"
          heading="Announcement questions, answered straight"
          subtext="What developers ask before replacing the changelog page nobody visits."
          items={FAQ_ITEMS}
        />

        <FinalCta
          slug="announcements"
          heading="Announce it"
          headingAccent="where they'll see it."
          subtext="Install now, run it free in dev, license it when it ships."
          installCmd="pnpm add @tour-kit/announcements"
          primaryLabel="Get started"
          primaryHref="/builder"
          siblings={[
            {
              label: 'Feature hints',
              href: '/feature-hints',
              description: 'Keep pointing at the new feature after the announcement closes.',
            },
            {
              label: 'In-app surveys',
              href: '/in-app-surveys',
              description: 'Ask what users think of the feature you just announced.',
            },
          ]}
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
