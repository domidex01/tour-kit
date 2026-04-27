import { getBlogCategories, getPostsByCategory, slugifyCategory } from '@/lib/blog'
import {
  getPublishedAlternatives,
  getPublishedBlogPosts,
  getPublishedComparisons,
} from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { BreadcrumbJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Site map'
const DESCRIPTION =
  'Every page on usertourkit.com, grouped by section — documentation, guides, API reference, blog, comparisons, alternatives, benchmarks, and company pages. A one-click index for readers and crawlers.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/sitemap' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/sitemap',
    images: [`/api/og?title=${encodeURIComponent('Site map')}&category=SITEMAP`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Site map')}&category=SITEMAP`],
  },
  robots: { index: true, follow: true },
}

// ── Section components ──────────────────────────────────────────────────────

/**
 * <details>/<summary> keeps every link in the rendered HTML (crawlable) while
 * letting humans collapse the noise. Default-open for the short sections,
 * default-closed for the long ones, so the page doesn't dump 500 links above
 * the fold.
 */
function SitemapSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-fd-border bg-fd-card/30 open:bg-fd-card/50"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold text-fd-foreground hover:bg-fd-muted/30">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block transition-transform group-open:rotate-90"
          >
            ›
          </span>
          {title}
        </span>
        <span className="font-mono text-[12px] text-fd-muted-foreground">{count}</span>
      </summary>
      <div className="border-t border-fd-border px-5 py-4">{children}</div>
    </details>
  )
}

// ── Data collection ────────────────────────────────────────────────────────

interface DocsGroup {
  section: string
  pages: { title: string; url: string }[]
}

function buildDocsTree(): DocsGroup[] {
  const pages = source.getPages()
  const groups = new Map<string, { title: string; url: string }[]>()
  for (const page of pages) {
    const top = page.slugs[0] ?? ''
    const key = top || 'root'
    const title = page.data.title ?? (page.slugs.join('/') || 'Documentation home')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)?.push({ title, url: page.url })
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title))
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([section, pages]) => ({
      section: section === 'root' ? 'Overview' : section,
      pages,
    }))
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SitemapPage() {
  const docsGroups = buildDocsTree()
  const docsTotal = docsGroups.reduce((sum, g) => sum + g.pages.length, 0)

  const compares = getPublishedComparisons()
  const alternatives = getPublishedAlternatives()
  const blogPosts = getPublishedBlogPosts()
  const blogCategories = getBlogCategories()

  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Site map', url: '/sitemap' },
        ]}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[980px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {TITLE}
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">{DESCRIPTION}</p>
          <p className="mt-3 text-[13px] text-fd-muted-foreground">
            Looking for the XML version?{' '}
            <a href="/sitemap.xml" className="underline hover:text-fd-foreground">
              /sitemap.xml
            </a>{' '}
            is what search engines read.
          </p>
        </header>

        <nav aria-label="All pages" className="flex flex-col gap-4">
          {/* ── Top-level pages ── */}
          <SitemapSection title="Top pages" count={9} defaultOpen>
            <ul className="grid gap-2 sm:grid-cols-2">
              <li>
                <Link href="/" className="text-fd-foreground hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-fd-foreground hover:underline">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-fd-foreground hover:underline">
                  Live demo
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-fd-foreground hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-fd-foreground hover:underline">
                  Comparisons
                </Link>
              </li>
              <li>
                <Link href="/alternatives" className="text-fd-foreground hover:underline">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link href="/benchmarks" className="text-fd-foreground hover:underline">
                  Benchmarks
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-fd-foreground hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-fd-foreground hover:underline">
                  Search
                </Link>
              </li>
            </ul>
          </SitemapSection>

          {/* ── Documentation ── */}
          <SitemapSection title="Documentation" count={docsTotal}>
            <div className="space-y-5">
              {docsGroups.map((group) => (
                <div key={group.section}>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
                    {group.section}
                  </h3>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {group.pages.map((p) => (
                      <li key={p.url}>
                        <Link
                          href={p.url}
                          className="text-[14px] text-fd-foreground hover:underline"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SitemapSection>

          {/* ── Blog (by category) ── */}
          <SitemapSection title="Blog" count={blogPosts.length}>
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
                  Category indexes
                </h3>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {blogCategories.map((cat) => (
                    <li key={cat}>
                      <Link
                        href={`/blog/category/${slugifyCategory(cat)}`}
                        className="text-[14px] text-fd-foreground hover:underline"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {blogCategories.map((cat) => {
                const posts = getPostsByCategory(slugifyCategory(cat))
                if (posts.length === 0) return null
                return (
                  <div key={cat}>
                    <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
                      {cat} ({posts.length})
                    </h3>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {posts.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/blog/${p.slug}`}
                            className="text-[14px] text-fd-foreground hover:underline"
                          >
                            {p.title.replace(/["']/g, '')}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </SitemapSection>

          {/* ── Comparisons ── */}
          <SitemapSection title="Comparisons" count={compares.length}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {compares.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/compare/${c.slug}`}
                    className="text-[14px] text-fd-foreground hover:underline"
                  >
                    userTourKit vs {c.competitor}
                  </Link>
                </li>
              ))}
            </ul>
          </SitemapSection>

          {/* ── Alternatives ── */}
          <SitemapSection title="Alternatives" count={alternatives.length}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {alternatives.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/alternatives/${a.slug}`}
                    className="text-[14px] text-fd-foreground hover:underline"
                  >
                    {a.competitor} alternatives
                  </Link>
                </li>
              ))}
            </ul>
          </SitemapSection>

          {/* ── Benchmarks ── */}
          <SitemapSection title="Benchmarks" count={2}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li>
                <Link href="/benchmarks" className="text-[14px] text-fd-foreground hover:underline">
                  Benchmarks index
                </Link>
              </li>
              <li>
                <Link
                  href="/benchmarks/bundle-size"
                  className="text-[14px] text-fd-foreground hover:underline"
                >
                  Bundle size
                </Link>
              </li>
            </ul>
          </SitemapSection>

          {/* ── Company / Trust ── */}
          <SitemapSection title="Company & trust" count={4}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li>
                <Link href="/about" className="text-[14px] text-fd-foreground hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="text-[14px] text-fd-foreground hover:underline"
                >
                  Editorial policy
                </Link>
              </li>
              <li>
                <Link
                  href="/how-we-test"
                  className="text-[14px] text-fd-foreground hover:underline"
                >
                  How we test
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-[14px] text-fd-foreground hover:underline"
                >
                  Privacy policy
                </Link>
              </li>
            </ul>
          </SitemapSection>
        </nav>
      </main>
    </HomeLayout>
  )
}
