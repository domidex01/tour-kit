import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Privacy Policy'

// Bumped by hand when the policy actually changes. Deriving this from
// `new Date()` made every build claim the policy had just been reviewed.
const LAST_UPDATED = '2026-09-13'
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
          <p className="text-[15px] text-fd-muted-foreground">Last updated: {LAST_UPDATED}</p>
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
              <strong>Aggregate analytics</strong> (Google Analytics 4): page views, referrers,
              country-level geography, device type, and which pricing and call-to-action links get
              clicked. No advertising or remarketing features are enabled, and we do not upload
              customer data to Google.
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
            Google Analytics sets first-party <code>_ga</code> cookies so a returning visitor is not
            counted twice. They are analytics cookies, not advertising cookies, and they are not
            shared with ad networks. Your light or dark theme preference is stored in your browser
            and never leaves your device.
          </p>
          <p>We do not run session recording, heatmaps, or any cross-site tracking.</p>

          <h2>Third parties</h2>
          <ul>
            <li>
              <strong>Google</strong>, analytics only (Google Analytics 4).{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google's privacy policy
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
