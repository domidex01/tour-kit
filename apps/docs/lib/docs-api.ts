import fs from 'node:fs'
import path from 'node:path'
import { source } from './source'

// ── Types ──

export interface SearchResult {
  title: string
  description: string
  slug: string
  url: string
  score: number
  section: string
  highlights: string[]
}

export interface DocPage {
  title: string
  description: string
  body: string
  toc: TocEntry[]
  slug: string
  url: string
}

export interface TocEntry {
  title: string
  depth: number
  url: string
}

export interface CodeExample {
  language: string
  code: string
  sourceSlug: string
  sourceTitle: string
}

export interface NavSection {
  name: string
  slug: string
  pageCount: number
}

// ── Scoring weights (matches MCP server) ──

const WEIGHTS = {
  titleExact: 10,
  titlePartial: 5,
  description: 3,
  heading: 2,
  body: 1,
} as const

// ── Content directory for raw MDX reading ──

const CONTENT_DIR = path.resolve(process.cwd(), 'content/docs')

// ── MDX stripping (inline — avoids cross-package dependency) ──

function stripMdx(mdxContent: string): string {
  let result = mdxContent

  // Protect fenced code blocks
  const codeBlocks: string[] = []
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // Remove imports, exports, JSX, MDX expressions
  result = result.replace(/^import\s+.*$/gm, '')
  result = result.replace(/^export\s+(?!default\s).*$/gm, '')
  result = result.replace(/^export\s+default\s+/gm, '')
  result = result.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, '')
  for (let i = 0; i < 3; i++) {
    result = result.replace(
      /<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g,
      ''
    )
  }
  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  result = result.replace(/\{[^}]*\}/g, '')

  // Remove frontmatter
  result = result.replace(/^---[\s\S]*?---\n*/m, '')

  // Restore code blocks
  result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[parseInt(index, 10)]
  })

  // Clean up blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

// ── File reading helpers ──

function resolveContentPath(slugs: string[]): string | null {
  // Try direct file: content/docs/core/hooks/use-tour.mdx
  const directMdx = path.join(CONTENT_DIR, ...slugs) + '.mdx'
  if (fs.existsSync(directMdx)) return directMdx

  const directMd = path.join(CONTENT_DIR, ...slugs) + '.md'
  if (fs.existsSync(directMd)) return directMd

  // Try index file: content/docs/core/hooks/use-tour/index.mdx
  const indexMdx = path.join(CONTENT_DIR, ...slugs, 'index.mdx')
  if (fs.existsSync(indexMdx)) return indexMdx

  const indexMd = path.join(CONTENT_DIR, ...slugs, 'index.md')
  if (fs.existsSync(indexMd)) return indexMd

  return null
}

function readRawContent(slugs: string[]): string | null {
  const filePath = resolveContentPath(slugs)
  if (!filePath) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return stripMdx(raw)
}

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{2,3}\s+(.+)$/gm
  const headings: string[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim())
  }
  return headings
}

// ── Public API ──

export function searchDocs(
  query: string,
  options: { section?: string; limit?: number } = {}
): SearchResult[] {
  const { section, limit = 10 } = options
  const pages = source.getPages()
  const normalizedQuery = query.toLowerCase().trim()
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  if (terms.length === 0) return []

  const scored = pages
    .filter((page) => !section || page.slugs[0] === section)
    .map((page) => {
      const titleLower = (page.data.title ?? '').toLowerCase()
      const descLower = (page.data.description ?? '').toLowerCase()

      let score = 0
      const matchedFields: string[] = []

      // Title exact match
      if (titleLower === normalizedQuery) {
        score += WEIGHTS.titleExact
        matchedFields.push('title')
      } else if (terms.every((term) => titleLower.includes(term))) {
        score += WEIGHTS.titlePartial
        matchedFields.push('title')
      }

      // Description match
      if (terms.some((term) => descLower.includes(term))) {
        score += WEIGHTS.description
        matchedFields.push('description')
      }

      // Heading + body scoring from raw content
      const rawContent = readRawContent(page.slugs)
      if (rawContent) {
        const headings = extractHeadings(rawContent)
        for (const heading of headings) {
          if (terms.some((term) => heading.toLowerCase().includes(term))) {
            score += WEIGHTS.heading
            matchedFields.push('heading')
            break
          }
        }

        const bodyLower = rawContent.toLowerCase()
        if (terms.some((term) => bodyLower.includes(term))) {
          score += WEIGHTS.body
          matchedFields.push('body')
        }
      }

      // Build highlights from matched fields
      const highlights: string[] = []
      if (matchedFields.includes('title'))
        highlights.push(page.data.title ?? '')
      if (matchedFields.includes('description'))
        highlights.push(page.data.description ?? '')

      return { page, score, highlights }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, 50))

  return scored.map(({ page, score, highlights }) => ({
    title: page.data.title ?? '',
    description: page.data.description ?? '',
    slug: page.slugs.join('/'),
    url: page.url,
    score,
    section: page.slugs[0] ?? '',
    highlights,
  }))
}

export function getDocPage(slug: string[]): DocPage | null {
  const page = source.getPage(slug)
  if (!page) return null

  const body = readRawContent(slug) ?? ''

  const toc: TocEntry[] = (page.data.toc as TocEntry[] | undefined)?.map(
    (entry) => ({
      title: entry.title,
      depth: entry.depth,
      url: entry.url,
    })
  ) ?? []

  return {
    title: page.data.title ?? '',
    description: page.data.description ?? '',
    body,
    toc,
    slug: slug.join('/'),
    url: page.url,
  }
}

export function getCodeExamples(pkg: string): CodeExample[] {
  const pages = source.getPages().filter((p) => p.slugs[0] === pkg)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const examples: CodeExample[] = []

  for (const page of pages) {
    const rawContent = readRawContent(page.slugs)
    if (!rawContent) continue

    let match: RegExpExecArray | null
    codeBlockRegex.lastIndex = 0
    while ((match = codeBlockRegex.exec(rawContent)) !== null) {
      examples.push({
        language: match[1] ?? 'text',
        code: match[2].trim(),
        sourceSlug: page.slugs.join('/'),
        sourceTitle: page.data.title ?? '',
      })
    }
  }

  return examples
}

export function getNavTree(): NavSection[] {
  const pages = source.getPages()
  const sectionMap = new Map<string, number>()

  for (const page of pages) {
    const section = page.slugs[0] ?? 'root'
    sectionMap.set(section, (sectionMap.get(section) ?? 0) + 1)
  }

  return Array.from(sectionMap.entries()).map(([name, pageCount]) => ({
    name,
    slug: name,
    pageCount,
  }))
}
