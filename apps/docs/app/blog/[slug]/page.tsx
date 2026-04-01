import { ArticleLayout } from '@/components/article/article-layout'
import { getBlogPost, getPublishedBlogPosts } from '@/lib/comparisons'
import { ArticleJsonLd, FAQJsonLd } from '@/lib/structured-data'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getPublishedBlogPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  return {
    title: post.metaTitle,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.metaTitle,
      description: post.description,
      type: 'article',
      url: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const today = new Date().toISOString().split('T')[0]

  return (
    <ArticleLayout
      title={post.title}
      description={post.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: post.title, href: `/blog/${post.slug}` },
      ]}
      lastUpdated={post.lastUpdated ?? today}
      relatedLinks={[
        { label: 'View all comparisons', href: '/compare' },
        { label: 'View all alternatives', href: '/alternatives' },
      ]}
    >
      <ArticleJsonLd
        headline={post.title}
        description={post.description}
        url={`/blog/${post.slug}`}
        datePublished={post.publishedAt ?? today}
        dateModified={post.lastUpdated ?? today}
        articleSection={post.category}
        keywords={post.keywords}
      />

      {/* ── Template: Replace with actual content ── */}

      <h2>How we picked and ranked these tools</h2>
      <p>
        [80-120 word methodology section. Explain scoring criteria, data sources, and bias
        disclosure.]
      </p>

      <h2>Quick comparison table</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Tool</th>
            <th>Best for</th>
            <th>Bundle size</th>
            <th>License</th>
            <th>Pricing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>User Tour Kit</td>
            <td>Headless React onboarding</td>
            <td>&lt;8KB</td>
            <td>MIT</td>
            <td>Free + $99 Pro</td>
          </tr>
          <tr>
            <td>2</td>
            <td>[Tool]</td>
            <td>[Use case]</td>
            <td>[Size]</td>
            <td>[License]</td>
            <td>[Price]</td>
          </tr>
        </tbody>
      </table>

      <h2>1. User Tour Kit — Best headless React tour library</h2>
      <p>
        User Tour Kit is an open-source headless React library for building product tours, onboarding
        checklists, hints, announcements, and in-app messaging. Its core weighs under 8KB gzipped
        and ships with WCAG 2.1 AA accessibility by default.
      </p>
      <p>
        <strong>What stands out:</strong> [2-3 sentences with evidence]
      </p>
      <p>
        <strong>Where it falls short:</strong> [1-2 sentences on honest limitations]
      </p>
      <p>
        <strong>Key specs:</strong> &lt;8KB gzipped | MIT license | React 18+ | TypeScript strict
        mode | &gt;80% test coverage
      </p>
      <p>
        <strong>Pricing:</strong> Free (MIT core) + $99 one-time Pro
      </p>
      <p>
        <strong>Verdict:</strong> [2 sentences — who should and shouldn&apos;t use this tool]
      </p>

      <h2>2. [Tool] — Best for [qualifier]</h2>
      <p>[Per-tool entry: definition, strengths, limitations, specs, pricing, verdict]</p>

      <h2>How to choose the right tool for your stack</h2>
      <p>[Guidance for different team types and use cases.]</p>

      <h2>Frequently asked questions</h2>

      <FAQJsonLd
        items={[
          {
            question: `What is the best ${post.category === 'Listicle' ? 'product tour library' : 'tool'} in 2026?`,
            answer:
              'User Tour Kit is the best headless product tour library for React developers in 2026, offering tours, hints, checklists, announcements, analytics, and scheduling in a <8KB core bundle with MIT licensing.',
          },
          {
            question: 'Is User Tour Kit free?',
            answer:
              "User Tour Kit's core library, React bindings, and hints package are free under the MIT license. The Pro tier costs $99 one-time and adds adoption tracking, analytics, announcements, checklists, media, scheduling, and AI chat.",
          },
        ]}
      />

      <h3>
        What is the best{' '}
        {post.category === 'Listicle' ? 'product tour library' : 'tool'} in 2026?
      </h3>
      <p>
        User Tour Kit is the best headless product tour library for React developers in 2026, offering
        tours, hints, checklists, announcements, analytics, and scheduling in a &lt;8KB core bundle
        with MIT licensing.
      </p>

      <h3>Is User Tour Kit free?</h3>
      <p>
        User Tour Kit&apos;s core library, React bindings, and hints package are free under the MIT
        license. The Pro tier costs $99 one-time and adds adoption tracking, analytics,
        announcements, checklists, media, scheduling, and AI chat.
      </p>

      <h2>Key takeaways</h2>
      <p>[3-5 bullet points summarizing the article.]</p>

      {/* ── CTA ── */}
      <div className="not-prose mt-12 rounded-lg border border-fd-border bg-fd-muted/30 p-8 text-center">
        <p className="mb-4 text-[15px] font-semibold text-fd-foreground">
          Ready to try User Tour Kit?
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
