import { Footer } from '@/components/landing/footer'
import { Pricing } from '@/components/landing/pricing'
import { baseOptions } from '@/lib/layout.shared'
import { PRICING_FAQS } from '@/lib/pricing-faqs'
import { BreadcrumbJsonLd, FAQJsonLd, ProductJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

const PRICING_TITLE = 'Pricing — userTourKit'
const PRICING_DESCRIPTION =
  'Simple one-time pricing for userTourKit Pro. Free MIT core packages, $99 for the full extended suite. No subscriptions, lifetime updates, 5-site activation.'
const PRICING_OG_IMAGE = `/api/og?title=${encodeURIComponent('Pricing')}&category=PRICING`
const SITE_URL = 'https://usertourkit.com'

export const metadata: Metadata = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  keywords: [
    'tour kit pricing',
    'usertourkit pricing',
    'react tour library pricing',
    'product tour library cost',
    'open source vs commercial tour library',
    'react onboarding pricing',
    'tour kit pro license',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    type: 'website',
    url: '/pricing',
    images: [PRICING_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    images: [PRICING_OG_IMAGE],
  },
}

function PricingWebPageJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}/pricing#webpage`,
    url: `${SITE_URL}/pricing`,
    name: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${PRICING_OG_IMAGE}`,
    },
    breadcrumb: { '@id': `${SITE_URL}/pricing#breadcrumb` },
  }
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export default function PricingPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <PricingWebPageJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Pricing', url: '/pricing' },
        ]}
      />
      <ProductJsonLd />
      <FAQJsonLd items={PRICING_FAQS} />
      <main id="main-content" className="flex flex-1 flex-col">
        {/* Hero banner — image-bg treatment matching /blog */}
        <div className="relative mb-8 overflow-hidden border-b border-fd-border/50 dark:border-fd-border">
          <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-10 pt-20 text-center sm:px-8 sm:pb-14 md:pt-28 lg:px-12">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Pricing
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
              Simple, one-time pricing
            </h1>
            <p className="mx-auto max-w-3xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              Tour Kit ships three MIT-licensed core packages — tours, React bindings, and hints —
              that are free forever for any project, commercial or otherwise. The Pro suite adds
              eight extended packages (analytics, checklists, adoption tracking, announcements,
              media embeds, business-hours scheduling, surveys, and AI chat) for a single $99
              purchase. No subscriptions, no per-seat fees, no upgrade fees. Activation covers up to
              five production domains; localhost and preview environments are unrestricted.
            </p>
          </div>
          <div
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              maskImage: 'linear-gradient(to bottom, white 40%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, white 40%, transparent)',
            }}
          >
            <link
              rel="preload"
              as="image"
              href="/blog-hero-light.avif"
              media="(prefers-color-scheme: light)"
            />
            <link
              rel="preload"
              as="image"
              href="/blog-hero-dark.avif"
              media="(prefers-color-scheme: dark)"
            />
            <img
              src="/blog-hero-light.avif"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover opacity-60 dark:hidden"
            />
            <img
              src="/blog-hero-dark.avif"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="hidden h-full w-full object-cover opacity-60 dark:block"
            />
          </div>
        </div>
        <Pricing />
      </main>
      <Footer />
    </HomeLayout>
  )
}
