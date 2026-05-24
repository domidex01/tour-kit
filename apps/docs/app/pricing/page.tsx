import { Footer } from '@/components/landing/footer'
import { Pricing } from '@/components/landing/pricing'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, FAQJsonLd, ProductJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

const PRICING_TITLE = 'Pricing — userTourKit'
const PRICING_DESCRIPTION =
  'Simple one-time pricing for userTourKit Pro. Free MIT core packages, $99 for the full extended suite. No subscriptions, lifetime updates, 5-site activation.'
const PRICING_OG_IMAGE = `/api/og?title=${encodeURIComponent('Pricing')}&category=PRICING`
const SITE_URL = 'https://usertourkit.com'

const PRICING_FAQS = [
  {
    question: 'How much does the userTourKit React product tour library cost?',
    answer:
      'The free tier — @tour-kit/core, @tour-kit/react, and @tour-kit/hints — is MIT-licensed and costs nothing for any project, commercial or otherwise. The Pro tier is a single one-time payment of $99 for the eight extended packages (analytics, checklists, adoption, announcements, media, scheduling, surveys, AI chat). No subscription, no per-seat fee, no upgrade fee.',
  },
  {
    question: 'Is the userTourKit Pro license a subscription?',
    answer:
      'No. Pro is a one-time purchase. You pay $99 once and the license activates the version you bought, forever. The MIT core packages will keep working even if you never renew anything.',
  },
  {
    question: 'How many sites can I activate with one Pro license?',
    answer:
      'Up to five production domains per Pro license. Localhost, preview environments, and staging URLs are unrestricted. Each production activation is permanent — there is no monthly check-in or auto-deactivation.',
  },
  {
    question: 'Who handles checkout and tax for Pro purchases?',
    answer:
      'Checkout runs through Polar.sh as the merchant of record. They accept card, Apple Pay, Google Pay, and Link, and they calculate and remit VAT/sales tax automatically based on your billing country. Receipts and license keys arrive by email within minutes.',
  },
  {
    question: 'What happens to my React onboarding flows if userTourKit is discontinued?',
    answer:
      'The MIT core (core, react, hints) is forkable forever — any team can fork and ship indefinitely. The Pro license is perpetual, so the version you bought keeps working with no kill switch or phone-home. All source lives in a public monorepo at github.com/domidex01/tour-kit.',
  },
  {
    question: 'Do you offer refunds on the Pro license?',
    answer:
      "Yes. Polar.sh handles a 14-day no-questions-asked refund window from the purchase date. Refunds revoke the license key. After 14 days, refunds are case-by-case for genuine defects we can't fix in a reasonable window.",
  },
]

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

        <section
          aria-labelledby="pricing-faq-heading"
          className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
        >
          <h2
            id="pricing-faq-heading"
            className="mb-2 text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl"
          >
            Frequently asked questions
          </h2>
          <p className="mb-8 text-[14px] text-fd-muted-foreground">
            Pricing, licensing, refunds, and what happens to your React onboarding flows if the
            project ever stops.
          </p>
          <dl className="space-y-6">
            {PRICING_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold text-fd-foreground">{faq.question}</dt>
                <dd className="mt-2 text-fd-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </HomeLayout>
  )
}
