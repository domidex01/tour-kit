import { Footer } from '@/components/landing/footer'
import { Pricing } from '@/components/landing/pricing'
import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

const PRICING_TITLE = 'Pricing — userTourKit'
const PRICING_DESCRIPTION =
  'Simple one-time pricing for userTourKit Pro. Free core packages, $99 for all extended packages.'
const PRICING_OG_IMAGE = `/api/og?title=${encodeURIComponent('Pricing')}&category=PRICING`

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

export default function PricingPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main id="main-content" className="flex flex-1 flex-col">
        <header className="mb-8 px-6 pt-20 text-center sm:px-8 md:pt-28 lg:px-12">
          <div className="mx-auto max-w-[1120px]">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Pricing
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
              Simple, one-time pricing
            </h1>
            <p className="mx-auto max-w-xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              Tour Kit uses a simple one-time pricing model: three MIT-licensed core packages are
              free forever, and the full Pro suite is a single $99 purchase with no subscriptions
              and no per-seat fees.
            </p>
          </div>
        </header>
        <Pricing />
      </main>
      <Footer />
    </HomeLayout>
  )
}
