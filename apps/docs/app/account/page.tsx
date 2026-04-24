import { Footer } from '@/components/landing/footer'
import { baseOptions } from '@/lib/layout.shared'
import { POLAR_PORTAL_URL } from '@/lib/polar-config'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

const ACCOUNT_TITLE = 'Manage your license — userTourKit'
const ACCOUNT_DESCRIPTION =
  'Manage your userTourKit Pro license, view activated domains, download invoices, and update your subscription.'

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
              Manage your license
            </h1>
            <p className="mx-auto max-w-xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              Your userTourKit Pro license is managed through Polar, our billing partner. Sign in
              with the email you used to purchase to view your license keys, manage activated
              domains, download invoices, and update your subscription.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <Link
                href={POLAR_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-6 py-3 text-[15px] font-semibold text-fd-primary-foreground transition-colors hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2"
              >
                Open Polar Portal
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <p className="text-[13px] text-fd-muted-foreground">
                Polar will email you a one-time code to sign in.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-[960px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="License keys"
              body="View the keys tied to your account and see which domains each key has activated."
            />
            <Feature
              title="Activation slots"
              body="Free up slots by deactivating domains you no longer use. Each license allows up to 5 activations."
            />
            <Feature
              title="Invoices & billing"
              body="Download receipts, update your payment method, or manage your subscription directly in the portal."
            />
          </div>

          <div className="mx-auto mt-16 max-w-[720px] rounded-lg border border-fd-border bg-fd-card px-6 py-5 text-[14px] leading-[1.6] text-fd-muted-foreground">
            <p className="mb-2 font-semibold text-fd-foreground">Can&apos;t find your license?</p>
            <p>
              Check your inbox for your Polar order confirmation — it contains your license key and
              a direct link to the portal. If you still need help, email{' '}
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
