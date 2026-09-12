import { Footer } from '@/components/landing/footer'
import { PageHero } from '@/components/landing/page-hero'
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
        <PageHero eyebrow="Pricing" heading="Simple, one-time pricing">
          Tour Kit ships three MIT-licensed core packages — tours, React bindings, and hints — that
          are free forever for any project, commercial or otherwise. The Pro suite adds eight
          extended packages (analytics, checklists, adoption tracking, announcements, media embeds,
          business-hours scheduling, surveys, and AI chat) for a single $99 purchase. No
          subscriptions, no per-seat fees, no upgrade fees. Activation covers up to five production
          domains; localhost and preview environments are unrestricted.
        </PageHero>

        {/* Gap/hero-body 3880:1536 — a flat 32px between the band and the chips. */}
        <div className="h-8" />

        <Pricing />
      </main>
      <Footer />
    </HomeLayout>
  )
}
