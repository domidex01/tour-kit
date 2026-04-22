import { BlogPreview } from '@/components/landing/blog-preview'
import { Features } from '@/components/landing/features'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Packages } from '@/components/landing/packages'
import { QuickStart } from '@/components/landing/quick-start'
import { baseOptions } from '@/lib/layout.shared'
import {
  OrganizationJsonLd,
  ProductJsonLd,
  SpeakableJsonLd,
  WebSiteJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const HOME_TITLE = 'userTourKit - Product Tours for React'
const HOME_DESC =
  'The most developer-friendly, accessible product tour library for React. Headless hooks and pre-styled components.'

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESC,
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

const SocialProof = dynamic(
  () => import('@/components/landing/social-proof').then((m) => ({ default: m.SocialProof })),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto my-12 h-[360px] w-full max-w-[1120px] animate-pulse rounded-2xl bg-fd-muted/30"
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
  'Headless, accessible product tours, onboarding flows, and in-app messaging for React. Open-source core with optional Pro packages.'

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
        <Packages />
        <ComparisonTable />
        <PricingTeaser />
        <SocialProof />
        <BlogPreview />
        <FAQ />

        {/* CTA Footer */}
        <section className="relative overflow-hidden px-6 py-24 sm:px-8 md:py-32 lg:px-12">
          {/* Background images - same as hero */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <img
              src="/tourkit-lighthouse.png"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover dark:hidden"
            />
            <img
              src="/hero-dark.avif"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-50 dark:block"
            />
          </div>

          {/* Dot grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
            style={{
              backgroundImage:
                'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative mx-auto max-w-[1120px]">
            <div className="mx-auto max-w-xl rounded-2xl border border-fd-border/50 bg-fd-background/40 p-10 text-center shadow-2xl backdrop-blur-xl dark:bg-fd-background/40 sm:p-12">
              <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#02182b] dark:text-white sm:text-4xl">
                Own your onboarding. <span className="text-[#0197f6]">Ship it today.</span>
              </h2>

              <p className="mb-10 text-[16px] text-fd-muted-foreground">
                No vendor lock-in. No monthly invoice. Just code you control and users who convert.
              </p>

              {/* Install command */}
              <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border/50 bg-fd-muted/30 px-6 py-3 font-mono text-[14px] backdrop-blur-sm">
                <span className="select-none text-fd-muted-foreground/50">$</span>
                <span className="text-fd-foreground/70">pnpm add @tour-kit/react</span>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/docs/getting-started"
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </HomeLayout>
  )
}
