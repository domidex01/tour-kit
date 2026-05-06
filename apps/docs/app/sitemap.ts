import fs from 'node:fs'
import path from 'node:path'
import {
  getPublishedAlternatives,
  getPublishedBlogPosts,
  getPublishedComparisons,
} from '@/lib/comparisons'
import { SITE_LAUNCH_FALLBACK, getGitLastModified } from '@/lib/git-dates'
import { source } from '@/lib/source'
import type { MetadataRoute } from 'next'

const SITE_URL = 'https://usertourkit.com'

/**
 * Per-top-level-docs-section fallback dates. Used when an MDX file has no
 * frontmatter date AND git history isn't available (shallow clones). Each
 * value is the last-known commit date for that section, baked in so the
 * sitemap never broadcasts a single build-time sentinel across hundreds of
 * URLs (which Google ignores as a freshness signal). Update when a section
 * sees a meaningful refresh.
 */
const DOC_SECTION_FALLBACKS: Record<string, string> = {
  adoption: '2026-04-27',
  'ai-assistants': '2026-04-27',
  ai: '2026-04-27',
  analytics: '2026-04-03',
  announcements: '2026-05-05',
  api: '2026-04-27',
  checklists: '2026-04-27',
  core: '2026-04-27',
  examples: '2026-05-03',
  'getting-started': '2026-04-20',
  guides: '2026-05-05',
  hints: '2026-04-27',
  licensing: '2026-04-03',
  media: '2026-04-27',
  react: '2026-05-03',
  scheduling: '2026-04-27',
  surveys: '2026-04-27',
  'use-cases': '2026-04-19',
}

/** Default doc-section fallback when section isn't in the explicit map. */
const DOC_DEFAULT_FALLBACK = '2026-04-12'

/** Hardcoded launch dates for trust pages, used only if git mtime is unavailable. */
const TRUST_PAGE_FALLBACKS: Record<string, string> = {
  pricing: '2026-03-26',
  compare: '2026-04-01',
  alternatives: '2026-04-01',
  about: '2026-04-19',
  'editorial-policy': '2026-04-20',
  'how-we-test': '2026-04-20',
  benchmarks: '2026-04-20',
  'benchmarks/bundle-size': '2026-04-20',
  demo: '2026-04-27',
}

function mdxPath(collection: 'blog' | 'compare' | 'alternatives', slug: string): string {
  return path.join(process.cwd(), 'content', collection, `${slug}.mdx`)
}

/**
 * Read `lastUpdated`/`updated`/`date` from an MDX file's YAML frontmatter
 * directly. Sitemap data sources don't always surface these (the BLOG_POSTS
 * registry is partial; doc collections drop unknown keys), so reading the
 * file is the most reliable signal. Returns ISO string or null.
 */
function readFrontmatterDate(filePath: string): string | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const fm = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!fm) return null
    const block = fm[1]
    const keys = ['lastUpdated', 'updated', 'date']
    for (const key of keys) {
      const m = block.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'))
      if (m) {
        const value = m[1].trim()
        if (value && !Number.isNaN(new Date(value).getTime())) return value
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Resolve a freshness signal that Google won't ignore. Priority:
 *   frontmatterArg → MDX frontmatter (lastUpdated/updated/date) → git mtime → fallback constant.
 * Never returns the build timestamp — that pollutes lastmod across hundreds
 * of URLs and causes Google to drop the signal entirely.
 */
function resolveLastModified(
  filePath: string,
  frontmatterLastUpdated: string | undefined,
  fallback: string
): Date {
  if (frontmatterLastUpdated) {
    const parsed = new Date(frontmatterLastUpdated)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const fromFile = readFrontmatterDate(filePath)
  if (fromFile) {
    const parsed = new Date(fromFile)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const fromGit = getGitLastModified(filePath)
  if (fromGit) return fromGit
  return new Date(fallback)
}

function resolveDocLastModified(absolutePath: string | undefined, topSlug: string): Date {
  const fallback =
    DOC_SECTION_FALLBACKS[topSlug] ?? DOC_DEFAULT_FALLBACK
  if (!absolutePath) return new Date(fallback)
  const fromFile = readFrontmatterDate(absolutePath)
  if (fromFile) {
    const parsed = new Date(fromFile)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const fromGit = getGitLastModified(absolutePath)
  if (fromGit) return fromGit
  return new Date(fallback)
}

function resolveTrustPageLastModified(filePath: string, fallbackKey: string): Date {
  const fromGit = getGitLastModified(filePath)
  if (fromGit) return fromGit
  const fallback = TRUST_PAGE_FALLBACKS[fallbackKey]
  return new Date(fallback ?? SITE_LAUNCH_FALLBACK)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()

  const docEntries: MetadataRoute.Sitemap = pages.map((page) => {
    const topSlug = page.slugs[0] ?? ''
    return {
      url: `${SITE_URL}${page.url}`,
      lastModified: resolveDocLastModified(page.absolutePath, topSlug),
      changeFrequency: 'weekly' as const,
      priority: page.slugs.length === 0 ? 1.0 : page.slugs.length === 1 ? 0.8 : 0.6,
    }
  })

  const blogEntries: MetadataRoute.Sitemap = getPublishedBlogPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: resolveLastModified(
      mdxPath('blog', post.slug),
      post.lastUpdated,
      DOC_DEFAULT_FALLBACK
    ),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    images: [`${SITE_URL}/blog/${post.slug}/opengraph-image`],
  }))

  const compareEntries: MetadataRoute.Sitemap = getPublishedComparisons().map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: resolveLastModified(
      mdxPath('compare', c.slug),
      c.lastUpdated,
      TRUST_PAGE_FALLBACKS.compare ?? DOC_DEFAULT_FALLBACK
    ),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const alternativeEntries: MetadataRoute.Sitemap = getPublishedAlternatives().map((a) => ({
    url: `${SITE_URL}/alternatives/${a.slug}`,
    lastModified: resolveLastModified(
      mdxPath('alternatives', a.slug),
      a.lastUpdated,
      TRUST_PAGE_FALLBACKS.alternatives ?? DOC_DEFAULT_FALLBACK
    ),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const trustPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/pricing`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/pricing/page.tsx'),
        'pricing'
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/compare/page.tsx'),
        'compare'
      ),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/about/page.tsx'),
        'about'
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/editorial-policy`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/editorial-policy/page.tsx'),
        'editorial-policy'
      ),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/how-we-test`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/how-we-test/page.tsx'),
        'how-we-test'
      ),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/benchmarks`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'content/benchmarks/bundle-sizes.json'),
        'benchmarks'
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/benchmarks/bundle-size`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'content/benchmarks/bundle-sizes.json'),
        'benchmarks/bundle-size'
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified: resolveTrustPageLastModified(
        path.join(process.cwd(), 'app/demo/page.tsx'),
        'demo'
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
  ]

  // Compute the freshest content date once so homepage + /sitemap track real
  // updates instead of the build clock.
  const allEntries = [
    ...trustPages,
    ...docEntries,
    ...blogEntries,
    ...compareEntries,
    ...alternativeEntries,
  ]
  const freshest = allEntries.reduce<Date>((max, e) => {
    const d = e.lastModified instanceof Date ? e.lastModified : new Date(e.lastModified ?? 0)
    return d > max ? d : max
  }, new Date(0))

  return [
    {
      url: SITE_URL,
      lastModified: freshest,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/sitemap`,
      lastModified: freshest,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
    ...trustPages,
    ...docEntries,
    ...blogEntries,
    ...compareEntries,
    ...alternativeEntries,
  ]
}
