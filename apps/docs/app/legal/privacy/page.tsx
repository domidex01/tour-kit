import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Privacy Policy'
const DESCRIPTION =
  'How usertourkit.com handles visitor data — analytics, cookies, and third-party services.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/legal/privacy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/legal/privacy',
    images: [`/api/og?title=${encodeURIComponent('Privacy')}&category=LEGAL`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Privacy')}&category=LEGAL`],
  },
}

export default function PrivacyPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main
        id="main-content"
        className="mx-auto w-full max-w-[820px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {TITLE}
          </h1>
          <p className="text-[15px] text-fd-muted-foreground">
            Last updated: {new Date().toISOString().split('T')[0]}
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Summary</h2>
          <p>
            This site is the documentation and marketing homepage for the userTourKit open-source
            library. We collect the minimum data needed to operate the site, bill Pro licenses, and
            understand which pages are useful.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Aggregate analytics</strong> (Vercel Analytics): page views, referrers,
              country-level geography, device type. No cross-site tracking, no personal identifiers,
              no advertising cookies.
            </li>
            <li>
              <strong>Error telemetry</strong> (server logs): request paths, response codes, and
              error stack traces. Retained for 30 days.
            </li>
            <li>
              <strong>Purchase records</strong> (via{' '}
              <a href="https://polar.sh/" target="_blank" rel="noopener noreferrer">
                Polar.sh
              </a>
              ): for Pro license buyers, we receive your email and order ID to issue license keys.
              Payment card data is handled entirely by Polar and Stripe — we never see it.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We do not set tracking cookies. Vercel may set a functional cookie to preserve your
            theme preference and a first-party analytics identifier that resets every 24 hours.
          </p>

          <h2>Third parties</h2>
          <ul>
            <li>
              <strong>Vercel</strong> — hosting and analytics.{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel's privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Polar.sh</strong> — payments and license management for Pro purchases.{' '}
              <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer">
                Polar's privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Cloudflare</strong> — CDN and bot-management in front of the site.{' '}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare's privacy policy
              </a>
              .
            </li>
          </ul>

          <h2>Your rights</h2>
          <p>
            If you bought a Pro license and want your record deleted, email support via{' '}
            <a
              href="https://github.com/domidex01/tour-kit/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issues
            </a>{' '}
            (or in private if you prefer — include your order ID). We will delete personal data
            within 30 days, except where we are required by Polar/Stripe to retain it for tax
            records.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? Open an issue at{' '}
            <a
              href="https://github.com/domidex01/tour-kit/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/domidex01/tour-kit/issues
            </a>{' '}
            or see our <Link href="/about">about page</Link>.
          </p>
        </article>
      </main>
    </HomeLayout>
  )
}
