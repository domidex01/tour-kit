import { Footer } from '@/components/landing/footer'
import { Pricing } from '@/components/landing/pricing'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, ProductJsonLd } from '@/lib/structured-data'
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
      <main id="main-content" className="flex flex-1 flex-col">
        <header className="mb-8 px-6 pt-20 text-center sm:px-8 md:pt-28 lg:px-12">
          <div className="mx-auto max-w-[1120px]">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Pricing
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
              Simple, one-time pricing
            </h1>
            <p className="mx-auto max-w-2xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              Tour Kit ships three MIT-licensed core packages — tours, React bindings, and hints —
              that are free forever for any project, commercial or otherwise. The Pro suite adds
              eight extended packages (analytics, checklists, adoption tracking, announcements,
              media embeds, scheduling, surveys, and AI chat) for a single $99 purchase. No
              subscriptions, no per-seat fees, no upgrade fees. Activation covers up to five
              production domains; localhost and preview environments are unrestricted.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-[1.6] text-fd-muted-foreground">
              Checkout is handled by{' '}
              <a
                href="https://polar.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                Polar.sh
              </a>{' '}
              — open-source merchant-of-record. Pay with card, Apple Pay, Google Pay, or Link.
              VAT/sales tax is calculated and remitted automatically based on your billing country.
              Receipts and license keys arrive by email within minutes.
            </p>
          </div>
        </header>
        <Pricing />
      </main>
      <Footer />
    </HomeLayout>
  )
}
