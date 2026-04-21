import path from 'node:path'
import { AUTHORS } from '@/lib/authors'
import { SITE_LAUNCH_FALLBACK, getGitLastModified } from '@/lib/git-dates'
import { baseOptions } from '@/lib/layout.shared'
import {
  BreadcrumbJsonLd,
  DEFAULT_SPEAKABLE_SELECTORS,
  SpeakableJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Editorial Policy'
const DESCRIPTION =
  'How userTourKit produces, reviews, and updates documentation and editorial content — sources, corrections, ethics, and AI-assistance disclosure.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/editorial-policy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: '/editorial-policy',
    images: [`/api/og?title=${encodeURIComponent('Editorial Policy')}&category=POLICY`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Editorial Policy')}&category=POLICY`],
  },
}

export default function EditorialPolicyPage() {
  const author = AUTHORS.domidex
  const pageFile = path.join(process.cwd(), 'app/editorial-policy/page.tsx')
  const lastUpdated = getGitLastModified(pageFile)
  const lastUpdatedIso = Number.isNaN(lastUpdated.getTime())
    ? SITE_LAUNCH_FALLBACK
    : lastUpdated.toISOString()
  const lastUpdatedDisplay = new Date(lastUpdatedIso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Editorial Policy', url: '/editorial-policy' },
        ]}
      />
      <SpeakableJsonLd url="/editorial-policy" cssSelectors={[...DEFAULT_SPEAKABLE_SELECTORS]} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[820px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1
            data-speakable="headline"
            className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl"
          >
            {TITLE}
          </h1>
          <p
            data-speakable="summary"
            className="text-[16px] leading-relaxed text-fd-muted-foreground"
          >
            {DESCRIPTION}
          </p>
          <p className="mt-3 text-[13px] text-fd-muted-foreground">
            Last updated <time dateTime={lastUpdatedIso}>{lastUpdatedDisplay}</time>
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Who produces this content</h2>
          <p>
            userTourKit is a solo-maintained project. All documentation, guides, comparisons, and
            blog posts are written and reviewed by{' '}
            <Link href="/about">
              {author.legalName} ({author.name})
            </Link>
            , a software engineer with working experience in React, TypeScript, and developer
            tooling. The <Link href="/about">about page</Link> lists verifiable external profiles
            (GitHub, LinkedIn, X) so readers can assess expertise independently.
          </p>

          <h2>How content is reviewed</h2>
          <p>
            Every content change — docs, comparisons, blog posts, landing copy — is submitted as a
            pull request to the public repository at{' '}
            <a
              href="https://github.com/domidex01/tour-kit"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/domidex01/tour-kit
            </a>
            . The full edit history is public and auditable. Each PR is type-checked, tested, and
            built before merge; technical claims that depend on code behavior are verified against
            the referenced code paths.
          </p>
          <p>
            Because the project is solo-maintained, there is no separate editorial board. Readers
            and contributors are encouraged to open an issue when a page is factually wrong, out of
            date, or unclear. See <a href="#corrections">Corrections</a> below.
          </p>

          <h2>Sources and citations</h2>
          <ul>
            <li>
              <strong>Primary sources first.</strong> When discussing a library, framework, or
              browser API, we link to its official documentation or specification — not second-hand
              summaries.
            </li>
            <li>
              <strong>Code claims are linked to code.</strong> Statements like "Tour Kit ships a X
              KB bundle" or "API Y returns Z" must link to the commit, npm package page, or source
              file that proves them.
            </li>
            <li>
              <strong>Competitor claims require their docs or repo as the citation.</strong>{' '}
              Comparisons against Joyride, Shepherd, Driver, Intro, Appcues, Pendo, WalkMe, or
              Userpilot cite the competitor's own documentation or pricing page.
            </li>
            <li>
              <strong>No fabricated benchmarks.</strong> Performance and bundle-size figures are
              either measured from the current release or omitted. When a number is known to be
              stale, we label it as such.
            </li>
          </ul>

          <h2 id="corrections">Corrections policy</h2>
          <p>
            If you find an error — a broken API signature, an outdated comparison claim, a
            miscredited source — please open an issue at{' '}
            <a
              href="https://github.com/domidex01/tour-kit/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/domidex01/tour-kit/issues
            </a>{' '}
            with the page URL and the specific claim. We aim to acknowledge corrections within 7
            days and fix or retract substantive errors within 30 days. Significant corrections are
            logged in the commit history on the affected file, which also drives the visible "last
            updated" date on every docs page.
          </p>

          <h2 id="ethics">Ethics and disclosures</h2>
          <ul>
            <li>
              <strong>No paid placement.</strong> We do not accept money, gifts, or sponsorships in
              exchange for coverage in comparisons, tutorials, or blog posts. Tools are recommended
              on technical merit only.
            </li>
            <li>
              <strong>No affiliate links.</strong> We do not use affiliate tracking on outbound
              links to third-party tools or stores.
            </li>
            <li>
              <strong>Commercial relationship: ourselves.</strong> userTourKit sells a commercial
              Pro license. When a comparison mentions our own Pro packages (adoption, analytics,
              checklists, etc.), we label them as such so readers can weigh the bias.
            </li>
            <li>
              <strong>No anonymous sources.</strong> Every claim is attributed to a public artifact
              — docs, repo, npm, issue thread — that readers can verify themselves.
            </li>
          </ul>

          <h2>AI-assistance disclosure</h2>
          <p>
            Some editorial content (primarily long-form tutorials, comparison articles, and glossary
            entries) is drafted with the help of large language models — currently Anthropic's
            Claude family — and then reviewed, edited, fact-checked, and code-tested by a human
            before publication. No AI-generated content ships unreviewed. Technical claims generated
            by AI are verified against primary sources (official docs, source code, npm) before
            merge.
          </p>

          <h2>Update cadence</h2>
          <ul>
            <li>
              <strong>API reference</strong> is regenerated on every release so it cannot drift from
              shipped code.
            </li>
            <li>
              <strong>Comparison articles</strong> are reviewed each time a competitor ships a major
              version, and at least every 6 months.
            </li>
            <li>
              <strong>Tutorials and guides</strong> are reviewed when a referenced dependency
              (React, Next.js, Fumadocs, etc.) ships a breaking version, or every 12 months.
            </li>
            <li>
              The "Last updated" stamp on each docs page is derived from git history and updates
              automatically when the file changes.
            </li>
          </ul>

          <h2>How we test</h2>
          <p>
            For the methodology behind benchmarks, bundle-size claims, accessibility scores, and
            performance measurements, see <Link href="/how-we-test">How We Test</Link>.
          </p>
        </article>
      </main>
    </HomeLayout>
  )
}
