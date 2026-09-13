import { BlogPreview } from '@/components/landing/blog-preview'
import { ClosingCta } from '@/components/landing/closing-cta'
import { CtaBand } from '@/components/landing/cta-band'
import { Features } from '@/components/landing/features'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Packages } from '@/components/landing/packages'
import { QuickStart } from '@/components/landing/quick-start'
import { SectionBackdrop } from '@/components/landing/section-backdrop'
import { baseOptions } from '@/lib/layout.shared'
import {
  OrganizationJsonLd,
  ProductJsonLd,
  SpeakableJsonLd,
  WebSiteJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

/**
 * Home owns the brand + umbrella cluster ("react onboarding toolkit");
 * the specific commercial clusters live on the capability pages
 * (/product-tours owns "react product tour library", etc). Re-anchored
 * 2026-06-11 when /product-tours shipped — see
 * utk-studio/plan/marketing-package-pages.md §3.1.
 */
const HOME_TITLE = 'userTourKit, Product Tours, Checklists & In-App Messaging for React'
const HOME_DESC =
  'The onboarding toolkit for React: product tours, feature hints, checklists, announcements, and surveys. Headless, accessible, yours.'

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESC,
  keywords: [
    'usertourkit',
    'react onboarding toolkit',
    'react onboarding library',
    'headless react onboarding',
    'in-app messaging react',
    'shadcn ui tour',
    'source available onboarding library',
    'user onboarding react',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESC,
    type: 'website',
    url: '/',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESC,
    images: ['/og-default.png'],
  },
}

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

const ComparisonTable = dynamic(
  () =>
    import('@/components/landing/comparison-table').then((m) => ({ default: m.ComparisonTable })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto my-12 h-[560px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
      />
    ),
  }
)

const CompareGrid = dynamic(
  () => import('@/components/landing/compare-grid').then((m) => ({ default: m.CompareGrid })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto my-12 h-[640px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
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

const FAQ = dynamic(() => import('@/components/landing/faq').then((m) => ({ default: m.FAQ })), {
  loading: () => (
    <div
      aria-hidden="true"
      className="mx-auto my-12 h-[480px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
    />
  ),
})

const HOMEPAGE_NAME = 'userTourKit'
const HOMEPAGE_DESCRIPTION =
  'Headless, accessible product tours, onboarding flows, and in-app messaging for React. Free in development, a one-time licence to ship.'

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <WebSiteJsonLd
        name={HOMEPAGE_NAME}
        description={HOMEPAGE_DESCRIPTION}
        searchUrl="https://usertourkit.com/search"
      />
      <OrganizationJsonLd />
      <ProductJsonLd />
      <SpeakableJsonLd
        url="/"
        cssSelectors={['[data-speakable="headline"]', '[data-speakable="summary"]']}
      />
      <main id="main-content" className="flex flex-1 flex-col">
        <Hero />
        <DemoTour />
        <QuickStart />
        <Features />
        <CtaBand
          placement="home_after_features"
          eyebrow="Free in development"
          heading="Ready to build your first tour?"
          subtext="Source-available under BSL 1.1, free for development, evaluation and CI. One-time from $9.99 when you ship to production."
          ctaLabel="Build my first tour"
          reassurance="Free in development, no signup, no credit card."
        />
        <Packages />

        {/* Pricing and the ownership table share ONE backdrop. In the frames
            the pricing section's line art and edge glows are 1237px tall and
            overflow into the table below it, so drawing a backdrop per section
            would put a seam where the design has none (Figma 3792:2177).

            `placement` matters here: the pricing frame rides its art 852px
            below the section's top, against 232 for a CTA band, so the default
            put it far too high. The offset is measured from this wrapper's top,
            which is the pricing section's top — the table's extra height below
            is just more room for the art to bleed into. */}
        <div className="relative">
          <SectionBackdrop placement="pricing" />
          <PricingTeaser />
          <ComparisonTable />
        </div>

        <CompareGrid />
        <BlogPreview />
        <FAQ />

        <ClosingCta
          heading="Own your onboarding."
          headingAccent="Ship it today."
          subtext="No vendor lock-in. No monthly invoice. Just code you control and users who convert."
          installCmd="pnpm add @tour-kit/core"
          ctaLabel="Get started"
          ctaHref="/builder"
        />
      </main>
      <Footer />
    </HomeLayout>
  )
}
