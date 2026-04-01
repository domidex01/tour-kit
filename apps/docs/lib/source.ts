import {
  alternatives as alternativesCollection,
  blog as blogCollection,
  compare as compareCollection,
  docs,
} from '@/.source/server'
import { loader } from 'fumadocs-core/source'
import { icons } from 'lucide-react'
import { createElement } from 'react'

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons])
    }
  },
})

// ── Collection helpers ──
// Collections from defineCollections are arrays of DocCollectionEntry.
// Each entry has: body (MDXContent), toc, info.path, and frontmatter fields.
// We match by file path slug (e.g. "tour-kit-vs-react-joyride" from the .mdx filename).

function slugFromPath(filePath: string): string {
  return filePath.replace(/\.mdx?$/, '').replace(/^.*\//, '')
}

export function getCompareArticle(slug: string) {
  return compareCollection.find((entry) => slugFromPath(entry.info.path) === slug)
}

export function getAllCompareArticles() {
  return compareCollection
}

export function getAlternativeArticle(slug: string) {
  return alternativesCollection.find((entry) => slugFromPath(entry.info.path) === slug)
}

export function getAllAlternativeArticles() {
  return alternativesCollection
}

export function getBlogArticle(slug: string) {
  return blogCollection.find((entry) => slugFromPath(entry.info.path) === slug)
}

export function getAllBlogArticles() {
  return blogCollection
}
