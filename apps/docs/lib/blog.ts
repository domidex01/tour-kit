import { type BlogMeta, getPublishedBlogPosts } from '@/lib/comparisons'

export const POSTS_PER_PAGE = 20

/** Pinned slugs shown in the featured section on page 1. */
export const FEATURED_SLUGS = [
  'add-product-tour-react-19',
  'tour-kit-vs-react-joyride',
  'shadcn-ui-product-tour-tutorial',
]

/** Get featured blog posts. */
export function getFeaturedBlogPosts(): BlogMeta[] {
  const all = getPublishedBlogPosts()
  return FEATURED_SLUGS.map((slug) => all.find((p) => p.slug === slug)).filter(
    (p): p is BlogMeta => !!p
  )
}

/** Estimate reading time from MDX file word count. Returns "X min read". */
export function getReadingTime(slug: string): string {
  try {
    const fs = require('node:fs')
    const path = require('node:path')
    const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
    const content = fs.readFileSync(filePath, 'utf-8')
    // Strip frontmatter, code blocks, HTML tags, and JSON-LD
    const stripped = content
      .replace(/^---[\s\S]*?---/, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    const words = stripped.split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 200))
    return `${minutes} min read`
  } catch {
    return '5 min read'
  }
}

/** Normalize a category name into a URL-safe slug: lowercase, spaces→hyphens, strip non [a-z0-9-]. */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Get all unique categories from published posts. */
export function getBlogCategories(): string[] {
  const posts = getPublishedBlogPosts()
  const categories = new Set(posts.map((p) => p.category))
  return [...categories].sort()
}

/** Get published posts filtered by slugified category (e.g. "build-vs-buy"). */
export function getPostsByCategory(categorySlug: string): BlogMeta[] {
  return getPublishedBlogPosts().filter((p) => slugifyCategory(p.category) === categorySlug)
}

/** Look up the original category display name from a slug, or undefined. */
export function getCategoryDisplayName(categorySlug: string): string | undefined {
  return getBlogCategories().find((c) => slugifyCategory(c) === categorySlug)
}

export function getPaginatedBlogPosts(page: number) {
  const allPosts = getPublishedBlogPosts()
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const start = (page - 1) * POSTS_PER_PAGE
  const posts = allPosts.slice(start, start + POSTS_PER_PAGE)

  return { posts, totalPages, currentPage: page, totalPosts: allPosts.length }
}

export function getBlogPageCount(): number {
  return Math.ceil(getPublishedBlogPosts().length / POSTS_PER_PAGE)
}

/** Get previous and next posts for navigation. */
export function getAdjacentPosts(slug: string): {
  prev: Pick<BlogMeta, 'slug' | 'title'> | null
  next: Pick<BlogMeta, 'slug' | 'title'> | null
} {
  const posts = getPublishedBlogPosts()
  const index = posts.findIndex((p) => p.slug === slug)
  if (index === -1) return { prev: null, next: null }

  const prev = index > 0 ? { slug: posts[index - 1].slug, title: posts[index - 1].title } : null
  const next =
    index < posts.length - 1 ? { slug: posts[index + 1].slug, title: posts[index + 1].title } : null

  return { prev, next }
}
