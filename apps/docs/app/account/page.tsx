import { EmailPortalForm } from '@/components/account/email-portal-form'
import { Footer } from '@/components/landing/footer'
import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

// Polar-hosted customer portal. Kept after the MIT relicense so past buyers can
// still reach receipts and invoices; set NEXT_PUBLIC_POLAR_PORTAL_URL to the
// org's portal, e.g. https://polar.sh/<org-slug>/portal.
const POLAR_PORTAL_URL = process.env.NEXT_PUBLIC_POLAR_PORTAL_URL ?? 'https://polar.sh/login'

const ACCOUNT_TITLE = 'Past purchases, userTourKit'
const ACCOUNT_DESCRIPTION =
  'Bought a userTourKit licence key? Tour Kit is MIT now and you no longer need it. Get your receipts and invoices here.'

export const metadata: Metadata = {
  title: ACCOUNT_TITLE,
  description: ACCOUNT_DESCRIPTION,
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
  openGraph: {
    title: ACCOUNT_TITLE,
    description: ACCOUNT_DESCRIPTION,
    type: 'website',
    url: '/account',
  },
}

export default function AccountPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main id="main-content" className="flex flex-1 flex-col">
        <section className="px-6 pb-24 pt-20 sm:px-8 md:pt-28 lg:px-12">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Account
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
              Past purchases
            </h1>
            <p className="mx-auto max-w-xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              Tour Kit is MIT now, so you no longer need a licence key. If you bought one, enter the
              email you used and we&apos;ll send you a secure link to your receipts and invoices.
            </p>

            <EmailPortalForm />

            <div className="mt-10 flex flex-col items-center gap-2">
              <p className="text-[13px] text-fd-muted-foreground">Or sign in directly at Polar,</p>
              <Link
                href={POLAR_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-transparent px-6 py-3 text-[14px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2"
              >
                Open Polar Portal
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-[720px] gap-6 sm:grid-cols-2">
            <Feature
              title="Your existing key"
              body="It keeps working on the versions it was bought for, and nothing is revoked. Update to the latest versions and no key is checked at all."
            />
            <Feature
              title="Receipts and invoices"
              body="Download them from the portal, or from the Polar order email you received at purchase."
            />
          </div>

          <div className="mx-auto mt-16 max-w-[720px] rounded-lg border border-fd-border bg-fd-card px-6 py-5 text-[14px] leading-[1.6] text-fd-muted-foreground">
            <p className="mb-2 font-semibold text-fd-foreground">Questions about a purchase?</p>
            <p>
              Your Polar order confirmation has a direct link to the portal. For anything else,
              email{' '}
              <a
                href="mailto:support@usertourkit.com"
                className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                support@usertourkit.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </HomeLayout>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-card px-5 py-5 text-left">
      <h2 className="mb-1.5 text-[15px] font-semibold text-fd-foreground">{title}</h2>
      <p className="text-[13.5px] leading-[1.6] text-fd-muted-foreground">{body}</p>
    </div>
  )
}
