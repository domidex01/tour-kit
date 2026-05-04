import { AlternativeArticleCrossLinks } from '@/components/article/article-cross-links'
import { ArticleLayout } from '@/components/article/article-layout'
import {
  getAlternative,
  getPublishedAlternatives,
  getPublishedComparisons,
} from '@/lib/comparisons'
import { articleMdxComponents } from '@/lib/mdx-overrides'
import { getAlternativeArticle } from '@/lib/source'
import {
  ArticleJsonLd,
  DEFAULT_SPEAKABLE_SELECTORS,
  FAQJsonLd,
  SpeakableJsonLd,
} from '@/lib/structured-data'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getPublishedAlternatives().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const alt = getAlternative(slug)
  if (!alt) return {}

  const ogImage = `/api/og?title=${encodeURIComponent(alt.metaTitle)}&category=ALTERNATIVES`

  return {
    title: alt.metaTitle,
    description: alt.description,
    keywords: alt.keywords,
    alternates: { canonical: `/alternatives/${alt.slug}` },
    openGraph: {
      title: alt.metaTitle,
      description: alt.description,
      type: 'article',
      url: `/alternatives/${alt.slug}`,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: alt.metaTitle,
      description: alt.description,
      images: [ogImage],
    },
  }
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params
  const alt = getAlternative(slug)
  if (!alt) notFound()

  const today = new Date().toISOString().split('T')[0]
  const vsPage = getPublishedComparisons().find((c) => c.competitorSlug === alt.competitorSlug)

  const article = await getAlternativeArticle(slug)
  const hasMdxContent = !!article
  const adjacentAlternatives = getPublishedAlternatives()
    .filter((a) => a.slug !== slug)
    .slice(0, 2)

  return (
    <ArticleLayout
      title={alt.title}
      description={alt.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Alternatives', href: '/alternatives' },
        { label: `${alt.competitor} Alternatives`, href: `/alternatives/${alt.slug}` },
      ]}
      lastUpdated={alt.lastUpdated ?? today}
      relatedLinks={[
        ...(vsPage
          ? [
              {
                label: `userTourKit vs ${alt.competitor}`,
                href: `/compare/${vsPage.slug}`,
              },
            ]
          : []),
        { label: 'View all comparisons', href: '/compare' },
        { label: 'Pricing', href: '/pricing' },
      ]}
    >
      <ArticleJsonLd
        headline={alt.title}
        description={alt.description}
        url={`/alternatives/${alt.slug}`}
        datePublished={alt.publishedAt ?? today}
        dateModified={alt.lastUpdated ?? today}
        articleSection="Alternatives"
        keywords={alt.keywords}
      />
      <SpeakableJsonLd
        url={`/alternatives/${alt.slug}`}
        cssSelectors={[...DEFAULT_SPEAKABLE_SELECTORS]}
      />

      {hasMdxContent ? (
        <>
          <article.body components={articleMdxComponents} />

          <AlternativeArticleCrossLinks
            current={alt}
            vsComparison={vsPage}
            adjacentAlternatives={adjacentAlternatives}
          />

          <FAQJsonLd
            items={[
              {
                question: `What is the best ${alt.competitor} alternative?`,
                answer: `userTourKit is the best ${alt.competitor} alternative for React developers who want code ownership, tiny bundle sizes (<8KB gzipped), and a $99 one-time price instead of recurring SaaS fees.`,
              },
              {
                question: 'Is userTourKit free to use?',
                answer:
                  "userTourKit's core library, React bindings, and hints package are free under the MIT license. The Pro tier costs $99 one-time (not recurring) and adds adoption tracking, analytics, announcements, checklists, media, scheduling, and AI chat capabilities.",
              },
              {
                question: `Can I migrate from ${alt.competitor} to userTourKit?`,
                answer: `Yes. userTourKit's headless API is designed for incremental adoption. You can run userTourKit alongside ${alt.competitor} during migration without conflicts.`,
              },
            ]}
          />
        </>
      ) : (
        <>
          {/* ── Fallback template for entries without MDX content ── */}

          <h2>Why developers switch from {alt.competitor}</h2>
          <p>
            [Write 100-150 words about the common pain points that drive developers away from{' '}
            {alt.competitor}. Be specific and factual.]
          </p>

          <h2>How we evaluated these alternatives</h2>
          <p>We scored each alternative across five criteria on a 1-10 scale:</p>
          <ol>
            <li>
              <strong>Developer experience</strong> — API design, TypeScript support, React
              integration, documentation quality
            </li>
            <li>
              <strong>Feature completeness</strong> — Tours, hints, checklists, announcements,
              analytics, scheduling
            </li>
            <li>
              <strong>Performance</strong> — Bundle size (gzipped), Lighthouse impact, tree-shaking
            </li>
            <li>
              <strong>Licensing and pricing</strong> — True cost over 3 years, license restrictions,
              MAU limits
            </li>
            <li>
              <strong>Maintenance health</strong> — Release frequency, GitHub activity, issue
              response time
            </li>
          </ol>
          <p className="text-[13px] text-fd-muted-foreground">
            Scores use verifiable data: npm download counts (npmjs.com), GitHub statistics, bundle
            sizes (bundlephobia.com), and official pricing pages. We are the team behind
            userTourKit, so we&apos;ve noted our bias and scored ourselves using the same criteria.
          </p>

          <h2>The best {alt.competitor} alternatives</h2>

          <h3>1. userTourKit — Best for headless React onboarding (recommended)</h3>
          <p>
            <strong>Pricing:</strong> Free + $99 one-time Pro | <strong>License:</strong> MIT
          </p>
          <p>
            We built userTourKit, so take this recommendation with appropriate skepticism.
            userTourKit is an open-source headless React library for product tours, onboarding
            checklists, hints, announcements, and in-app messaging with a &lt;8KB gzipped core.
          </p>

          <h3>2. [Alternative 2] — Best for [use case]</h3>
          <p>[150-200 words per alternative entry]</p>

          <h3>3. [Alternative 3] — Best for [use case]</h3>
          <p>[150-200 words per alternative entry]</p>

          <h2>How to choose the right {alt.competitor} alternative</h2>
          <p>[Write guidance for different team types and use cases.]</p>

          <h2>Frequently asked questions</h2>

          <FAQJsonLd
            items={[
              {
                question: `What is the best ${alt.competitor} alternative?`,
                answer: `userTourKit is the best ${alt.competitor} alternative for React developers who want code ownership, tiny bundle sizes (<8KB gzipped), and a $99 one-time price instead of recurring SaaS fees.`,
              },
              {
                question: `Is ${alt.competitor} free?`,
                answer: `[Answer about ${alt.competitor}'s pricing model.]`,
              },
              {
                question: `Can I migrate from ${alt.competitor} to userTourKit?`,
                answer: `Yes. userTourKit's headless API is designed for incremental adoption. You can run userTourKit alongside ${alt.competitor} during migration without conflicts.`,
              },
            ]}
          />

          <h3>What is the best {alt.competitor} alternative?</h3>
          <p>
            userTourKit is the best {alt.competitor} alternative for React developers who want code
            ownership, tiny bundle sizes (&lt;8KB gzipped), and a $99 one-time price instead of
            recurring SaaS fees.
          </p>

          <h3>Is {alt.competitor} free?</h3>
          <p>[Answer about {alt.competitor}&apos;s pricing model.]</p>

          <h3>Can I migrate from {alt.competitor} to userTourKit?</h3>
          <p>
            Yes. userTourKit&apos;s headless API is designed for incremental adoption. You can run
            userTourKit alongside {alt.competitor} during migration without conflicts.
          </p>

          <h2>The bottom line</h2>
          <p>
            [Write a 50-70 word conclusion summarizing the best alternatives and when to choose
            each.]
          </p>

          <AlternativeArticleCrossLinks
            current={alt}
            vsComparison={vsPage}
            adjacentAlternatives={adjacentAlternatives}
          />
        </>
      )}

      {/* ── CTA ── */}
      <div className="not-prose mt-12 rounded-lg border border-fd-border bg-fd-muted/30 p-8 text-center">
        <p className="mb-4 text-[15px] font-semibold text-fd-foreground">
          Ready to try userTourKit?
        </p>
        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-fd-background px-4 py-2 font-mono text-[13px]">
          <span className="text-fd-muted-foreground">$</span> pnpm add @tour-kit/react
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="rounded-lg bg-[#0197f6] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
          >
            Get started
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-[13px] font-semibold text-fd-foreground transition-all hover:bg-fd-muted"
          >
            View pricing
          </Link>
        </div>
      </div>
    </ArticleLayout>
  )
}
