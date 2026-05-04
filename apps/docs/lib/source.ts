import { docs } from '@/.source/server'
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
//
// We import the collection modules lazily inside each helper rather than at
// module top-level. The .source/server module uses top-level await; pulling
// the collections at top-level here causes Next.js prerender workers to hit
// `ReferenceError: <name> is not defined` for some routes, presumably because
// the bundler's TLA scope-hoisting is unreliable across the worker pool.
// Deferring to call-time forces a fresh `await import(...)` per call and
// sidesteps the issue.

function slugFromPath(filePath: string): string {
  return filePath.replace(/\.mdx?$/, '').replace(/^.*\//, '')
}

export async function getCompareArticle(slug: string) {
  const { compare } = await import('@/.source/server')
  return compare.find((entry) => slugFromPath(entry.info.path) === slug)
}

export async function getAllCompareArticles() {
  const { compare } = await import('@/.source/server')
  return compare
}

export async function getAlternativeArticle(slug: string) {
  const { alternatives } = await import('@/.source/server')
  return alternatives.find((entry) => slugFromPath(entry.info.path) === slug)
}

export async function getAllAlternativeArticles() {
  const { alternatives } = await import('@/.source/server')
  return alternatives
}

export async function getBlogArticle(slug: string) {
  const { blog } = await import('@/.source/server')
  return blog.find((entry) => slugFromPath(entry.info.path) === slug)
}

export async function getAllBlogArticles() {
  const { blog } = await import('@/.source/server')
  return blog
}
