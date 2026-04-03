import { ArticleLayout } from '@/components/article/article-layout'
import { getComparison, getPublishedComparisons, getRelatedComparisons } from '@/lib/comparisons'
import { getCompareArticle } from '@/lib/source'
import { ArticleJsonLd, FAQJsonLd } from '@/lib/structured-data'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getPublishedComparisons().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) return {}

  return {
    title: comparison.metaTitle,
    description: comparison.description,
    keywords: comparison.keywords,
    openGraph: {
      title: comparison.metaTitle,
      description: comparison.description,
      type: 'article',
      url: `/compare/${comparison.slug}`,
    },
  }
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) notFound()

  const related = getRelatedComparisons(slug)
  const today = new Date().toISOString().split('T')[0]

  // Try to load MDX content from the collection
  const article = getCompareArticle(slug)
  const hasMdxContent = !!article

  return (
    <ArticleLayout
      title={comparison.title}
      description={comparison.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Compare', href: '/compare' },
        { label: `userTourKit vs ${comparison.competitor}`, href: `/compare/${comparison.slug}` },
      ]}
      lastUpdated={comparison.lastUpdated ?? today}
      relatedLinks={related.map((r) => ({
        label: `userTourKit vs ${r.competitor}`,
        href: `/compare/${r.slug}`,
      }))}
    >
      <ArticleJsonLd
        headline={comparison.title}
        description={comparison.description}
        url={`/compare/${comparison.slug}`}
        datePublished={comparison.publishedAt ?? today}
        dateModified={comparison.lastUpdated ?? today}
        articleSection="Comparisons"
        keywords={comparison.keywords}
      />

      {hasMdxContent ? (
        <>
          {/* Render MDX article content */}
          <article.body components={defaultMdxComponents} />

          {/* FAQ Schema (extracted from MDX heading structure) */}
          <FAQJsonLd
            items={[
              {
                question: `What is the difference between userTourKit and ${comparison.competitor}?`,
                answer: `userTourKit is a headless React library with tours, hints, checklists, announcements, analytics, and scheduling under an MIT license. ${comparison.competitor} is a monolithic tour component with inline styles.`,
              },
              {
                question: 'Is userTourKit free to use?',
                answer:
                  "userTourKit's core library, React bindings, and hints package are free under the MIT license. The Pro tier costs $99 one-time (not recurring) and adds adoption tracking, analytics, announcements, checklists, media, scheduling, and AI chat capabilities.",
              },
              {
                question: "What is userTourKit's bundle size?",
                answer:
                  "userTourKit's core package is under 8KB gzipped, the React package is under 12KB gzipped, and the hints package is under 5KB gzipped. This makes it one of the smallest product tour libraries available.",
              },
              {
                question: 'Does userTourKit work with Next.js and React 19?',
                answer:
                  'Yes. userTourKit supports React 18 and React 19, including Next.js App Router and server components. Its headless architecture separates logic from UI, making it compatible with any React-based framework.',
              },
              {
                question: `Can I migrate from ${comparison.competitor} to userTourKit?`,
                answer: `Yes. Step definitions map almost directly. The main work involves adding step IDs, switching from callbacks to hooks, and replacing custom tooltip overrides with userTourKit's compound components.`,
              },
            ]}
          />
        </>
      ) : (
        <>
          {/* ── Fallback template for articles without MDX content ── */}

          <h2>The bottom line</h2>
          <p>
            <strong>userTourKit is a headless React library</strong> offering tours, hints, checklists,
            announcements, analytics, and scheduling in a &lt;8KB core bundle.{' '}
            <strong>{comparison.competitor}</strong> is [category description] focused on [primary
            capability]. userTourKit suits React teams wanting code ownership and tiny bundles;{' '}
            {comparison.competitor} is better when you need [honest competitor advantage].
          </p>

          <h2>What is userTourKit?</h2>
          <p>
            userTourKit is an open-source headless React library for building product tours, onboarding
            checklists, hints, announcements, and in-app messaging. Its framework-agnostic core weighs
            under 8KB gzipped, ships with WCAG 2.1 AA accessibility and Lighthouse 100 scores by
            default, and integrates natively with shadcn/ui, Radix UI, and Base UI through its
            UnifiedSlot pattern. The MIT-licensed free tier includes tours, React bindings, and hints.
            The $99 one-time Pro tier adds adoption tracking, analytics, announcements, checklists,
            media, scheduling, and AI chat.
          </p>

          <h2>What is {comparison.competitor}?</h2>
          <p>
            [Write a factual 20-25 word definition of {comparison.competitor}. Include category, primary
            function, key characteristic, and pricing model.]
          </p>

          <h2>Feature-by-feature comparison</h2>

          <h3>Tours and step types</h3>
          <p>[Compare tour capabilities]</p>

          <h3>Hints and hotspots</h3>
          <p>[Compare hint/beacon features]</p>

          <h3>Checklists and onboarding flows</h3>
          <p>[Compare checklist capabilities]</p>

          <h3>Announcements and banners</h3>
          <p>[Compare announcement features]</p>

          <h3>Analytics and tracking</h3>
          <p>[Compare analytics integration]</p>

          <h3>Scheduling and targeting</h3>
          <p>[Compare scheduling capabilities]</p>

          <h3>Accessibility and WCAG compliance</h3>
          <p>[Compare accessibility features]</p>

          <h3>Bundle size and performance</h3>
          <p>[Compare bundle sizes with exact numbers]</p>

          <h3>Framework support and TypeScript</h3>
          <p>[Compare framework and TypeScript support]</p>

          <h3>Licensing and pricing</h3>
          <p>[Compare licensing models and pricing]</p>

          <h2>Side-by-side comparison table</h2>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>userTourKit</th>
                <th>{comparison.competitor}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product tours</td>
                <td>Built-in (core)</td>
                <td>[Status]</td>
              </tr>
              <tr>
                <td>Hints/hotspots</td>
                <td>Built-in (&lt;5KB)</td>
                <td>[Status]</td>
              </tr>
              <tr>
                <td>Onboarding checklists</td>
                <td>Pro ($99 one-time)</td>
                <td>[Status]</td>
              </tr>
              <tr>
                <td>Core bundle (gzipped)</td>
                <td>&lt;8KB</td>
                <td>[Size]</td>
              </tr>
              <tr>
                <td>License</td>
                <td>MIT (free tier)</td>
                <td>[License]</td>
              </tr>
              <tr>
                <td>Pricing</td>
                <td>Free + $99 one-time Pro</td>
                <td>[Pricing]</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[13px] text-fd-muted-foreground">
            Data verified [Month Year]. Sources: official documentation, npm, GitHub.
          </p>

          <h2>When to choose {comparison.competitor} instead</h2>
          <p>[Write 80-120 words honestly explaining when the competitor is the better choice.]</p>

          <h2>When userTourKit is the better fit</h2>
          <p>[Write 80-120 words explaining userTourKit&apos;s advantages for specific use cases.]</p>

          <h2>Migration path from {comparison.competitor} to userTourKit</h2>
          <p>[Describe the migration approach in 100-150 words.]</p>

          <h2>What developers say</h2>
          <p>[Add social proof quotes from Reddit, GitHub, or developer communities.]</p>

          <h2>Frequently asked questions</h2>

          <FAQJsonLd
            items={[
              {
                question: `What is the difference between userTourKit and ${comparison.competitor}?`,
                answer: `userTourKit is a headless React library with tours, hints, checklists, announcements, analytics, and scheduling under an MIT license. ${comparison.competitor} [brief differentiator].`,
              },
              {
                question: 'Is userTourKit free to use?',
                answer:
                  "userTourKit's core library, React bindings, and hints package are free under the MIT license. The Pro tier costs $99 one-time (not recurring) and adds adoption tracking, analytics, announcements, checklists, media, scheduling, and AI chat capabilities.",
              },
            ]}
          />

          <h3>What is the difference between userTourKit and {comparison.competitor}?</h3>
          <p>[Core architectural difference]</p>

          <h3>Is userTourKit free to use?</h3>
          <p>
            userTourKit&apos;s core library, React bindings, and hints package are free under the MIT
            license. The Pro tier costs $99 one-time and adds adoption tracking, analytics,
            announcements, checklists, media, scheduling, and AI chat.
          </p>

          <h2>Final verdict</h2>
          <p>
            [Write a 50-70 word conclusion with a definitive recommendation based on specific use cases.]
          </p>
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
