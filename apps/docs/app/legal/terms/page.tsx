import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Terms of Service'
const DESCRIPTION =
  'Terms governing use of usertourkit.com and how the MIT-licensed userTourKit packages are licensed.'

export const metadata: Metadata = {
  title: `${TITLE}, userTourKit`,
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
            These terms cover how you may use this website (usertourkit.com) and how the open-source
            userTourKit packages are licensed. By using the site or installing the packages, you
            agree to these terms.
          </p>

          <h2>The open-source packages</h2>
          <p>
            Every <code>@tour-kit/*</code> package is released under the{' '}
            <a
              href="https://github.com/domidex01/tour-kit/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT licence
            </a>
            . You may use, copy, modify, merge, publish, distribute, sublicense and sell copies of
            them, including in production, without a licence key and without charge. Versions
            published before October 2026 keep the licence they were released under. Nothing on this
            page narrows the rights granted by the MIT licence.
          </p>

          <h2>Licence keys purchased before October 2026</h2>
          <p>
            We no longer sell licence keys. A key bought earlier keeps working on the versions it
            was bought for and is not revoked. Purchases made before that date remain governed by
            the terms in effect when you bought. Those purchases were processed by{' '}
            <a href="https://polar.sh/" target="_blank" rel="noopener noreferrer">
              Polar.sh
            </a>{' '}
            as merchant of record, and your receipts and invoices are available from the{' '}
            <Link href="/account">past purchases</Link> page.
          </p>

          <h2>Acceptable use of the website</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape the site at a rate that meaningfully impacts availability for others.</li>
            <li>Attempt to bypass authentication or rate-limiting mechanisms.</li>
            <li>Republish documentation as your own work without attribution.</li>
            <li>
              Train an AI model on the content of this site without honoring the rules in{' '}
              <a href="/robots.txt">robots.txt</a> and <a href="/llms.txt">llms.txt</a>.
            </li>
          </ul>

          <h2>No warranty</h2>
          <p>
            The site and the open-source packages are provided <strong>&ldquo;as is&rdquo;</strong>{' '}
            without warranty of any kind, express or implied. We do not warrant uninterrupted
            availability, fitness for a particular purpose, or absence of bugs.
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
            Disputes regarding a purchase made before October 2026 are governed by the terms in
            effect when you bought. Disputes regarding these terms are governed by the law of the
            jurisdiction where the maintainer resides, except where local consumer protection law of
            your residence applies and is more favorable to you.
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
