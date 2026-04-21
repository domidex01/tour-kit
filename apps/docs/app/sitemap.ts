import path from 'node:path'
import {
  getPublishedAlternatives,
  getPublishedBlogPosts,
  getPublishedComparisons,
} from '@/lib/comparisons'
import { getGitLastModified } from '@/lib/git-dates'
import { source } from '@/lib/source'
import type { MetadataRoute } from 'next'

const SITE_URL = 'https://usertourkit.com'

function mdxPath(collection: 'blog' | 'compare' | 'alternatives', slug: string): string {
  return path.join(process.cwd(), 'content', collection, `${slug}.mdx`)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()

  const docEntries: MetadataRoute.Sitemap = pages.map((page) => {
    const lastModified = page.absolutePath ? getGitLastModified(page.absolutePath) : new Date()

    return {
      url: `${SITE_URL}${page.url}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: page.slugs.length === 0 ? 1.0 : page.slugs.length === 1 ? 0.8 : 0.6,
    }
  })

  const blogEntries: MetadataRoute.Sitemap = getPublishedBlogPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: getGitLastModified(mdxPath('blog', post.slug)),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    images: [`${SITE_URL}/blog/${post.slug}/opengraph-image`],
  }))

  const compareEntries: MetadataRoute.Sitemap = getPublishedComparisons().map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: getGitLastModified(mdxPath('compare', c.slug)),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const alternativeEntries: MetadataRoute.Sitemap = getPublishedAlternatives().map((a) => ({
    url: `${SITE_URL}/alternatives/${a.slug}`,
    lastModified: getGitLastModified(mdxPath('alternatives', a.slug)),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const trustPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/about`,
      lastModified: getGitLastModified(path.join(process.cwd(), 'app/about/page.tsx')),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/editorial-policy`,
      lastModified: getGitLastModified(path.join(process.cwd(), 'app/editorial-policy/page.tsx')),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/how-we-test`,
      lastModified: getGitLastModified(path.join(process.cwd(), 'app/how-we-test/page.tsx')),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/benchmarks`,
      lastModified: getGitLastModified(
        path.join(process.cwd(), 'content/benchmarks/bundle-sizes.json')
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/benchmarks/bundle-size`,
      lastModified: getGitLastModified(
        path.join(process.cwd(), 'content/benchmarks/bundle-sizes.json')
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/sitemap`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
  ]

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...trustPages,
    ...docEntries,
    ...blogEntries,
    ...compareEntries,
    ...alternativeEntries,
  ]
}
