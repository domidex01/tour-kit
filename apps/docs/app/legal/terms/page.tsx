import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Terms of Service'
const DESCRIPTION =
  "Terms governing use of usertourkit.com, the userTourKit Pro license, and the project's open-source components."

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/legal/terms' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/legal/terms',
    images: [`/api/og?title=${encodeURIComponent('Terms')}&category=LEGAL`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Terms')}&category=LEGAL`],
  },
}

export default function TermsPage() {
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
            These terms cover three things: how you may use this website
            (usertourkit.com), how the open-source userTourKit packages are licensed, and how the
            optional Pro license works. By using the site or installing the packages, you agree to
            these terms.
          </p>

          <h2>The open-source packages</h2>
          <p>
            <code>@tour-kit/core</code>, <code>@tour-kit/react</code>, and{' '}
            <code>@tour-kit/hints</code> are released under the{' '}
            <a
              href="https://github.com/domidex01/tour-kit/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT license
            </a>
            . You may use, copy, modify, and distribute them subject to that license. Nothing on
            this page narrows the rights granted by MIT.
          </p>

          <h2>The Pro license</h2>
          <ul>
            <li>
              <strong>What you get</strong>: a one-time, non-recurring license to use the
              userTourKit Pro packages (adoption tracking, analytics, announcements, checklists,
              media, scheduling, AI chat) on the number of production sites stated on the{' '}
              <Link href="/pricing">pricing page</Link>.
            </li>
            <li>
              <strong>What activation does</strong>: license keys validate against our license
              server when the package initializes. Source code is visible to your build; the key
              gates runtime use.
            </li>
            <li>
              <strong>Scope</strong>: a license is for one purchaser (you, or the legal entity that
              purchased it). You may not resell, sublicense, or repackage Pro modules into a
              competing onboarding product.
            </li>
            <li>
              <strong>Refunds</strong>: 14-day refund window from purchase, no questions asked.
              Email a refund request with your order ID via{' '}
              <a
                href="https://github.com/domidex01/tour-kit/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>{' '}
              (private email also fine — see the{' '}
              <Link href="/about">about page</Link> for contact). Refunds process through Polar.
            </li>
            <li>
              <strong>Termination</strong>: we may revoke a license for material breach (resale,
              license-key sharing at scale, charge-backs after delivery). MIT-licensed Free packages
              remain unaffected by Pro termination.
            </li>
          </ul>

          <h2>Payments and merchant of record</h2>
          <p>
            Pro purchases are processed by{' '}
            <a href="https://polar.sh/" target="_blank" rel="noopener noreferrer">
              Polar.sh
            </a>
            , who acts as merchant of record. Polar handles tax, invoicing, and refund execution.
            Payment card data is collected and stored by Polar and{' '}
            <a href="https://stripe.com/" target="_blank" rel="noopener noreferrer">
              Stripe
            </a>
            ; we never see it.
          </p>

          <h2>Acceptable use of the website</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape the site at a rate that meaningfully impacts availability for others.</li>
            <li>
              Attempt to bypass authentication, license validation, or rate-limiting mechanisms.
            </li>
            <li>Republish documentation as your own work without attribution.</li>
            <li>
              Train an AI model on the content of this site without honoring the rules in{' '}
              <a href="/robots.txt">robots.txt</a> and{' '}
              <a href="/llms.txt">llms.txt</a>.
            </li>
          </ul>

          <h2>No warranty</h2>
          <p>
            The site, the open-source packages, and the Pro license are provided{' '}
            <strong>&ldquo;as is&rdquo;</strong> without warranty of any kind, express or implied.
            We do not warrant uninterrupted availability, fitness for a particular purpose, or
            absence of bugs. To the maximum extent permitted by law, our aggregate liability for any
            claim related to the Pro license is limited to the amount you paid in the 12 months
            preceding the claim.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may update these terms — material changes will be reflected in the{' '}
            <em>Last updated</em> date at the top of this page and noted in the{' '}
            <a
              href="https://github.com/domidex01/tour-kit/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              changelog
            </a>
            . Continued use after a change constitutes acceptance.
          </p>

          <h2>Governing law</h2>
          <p>
            Disputes regarding these terms or a Pro purchase are governed by the law of the
            jurisdiction where Polar.sh, as merchant of record, is incorporated, except where local
            consumer protection law of your residence applies and is more favorable to you.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or disputes? Open an issue at{' '}
            <a
              href="https://github.com/domidex01/tour-kit/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/domidex01/tour-kit/issues
            </a>{' '}
            or see the <Link href="/about">about page</Link>.
          </p>
        </article>
      </main>
    </HomeLayout>
  )
}
