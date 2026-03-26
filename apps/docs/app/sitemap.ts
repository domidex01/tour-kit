import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'
import { execSync } from 'node:child_process'

const SITE_URL = 'https://tourkit.dev'

function getGitLastModified(filePath: string): Date {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim()
    return result ? new Date(result) : new Date()
  } catch {
    return new Date()
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()

  const docEntries: MetadataRoute.Sitemap = pages.map((page) => {
    const lastModified = page.absolutePath
      ? getGitLastModified(page.absolutePath)
      : new Date()

    return {
      url: `${SITE_URL}${page.url}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority:
        page.slugs.length === 0
          ? 1.0
          : page.slugs.length === 1
            ? 0.8
            : 0.6,
    }
  })

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...docEntries,
  ]
}
