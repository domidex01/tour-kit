import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { stripMdx } from './utils/mdx-stripper.js'

export interface DocPage {
  slug: string
  title: string
  description: string
  url: string
  content: string
  section: string
  headings: string[]
}

export interface DocSection {
  name: string
  slug: string
  pageCount: number
  description: string
}

// Resolve content directory relative to this package's location in the monorepo
const CONTENT_DIR = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  '../../docs/content/docs'
)

let cachedPages: DocPage[] | null = null
let cachedSections: DocSection[] | null = null

function findMdxFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) return files

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findMdxFiles(fullPath))
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{2,3}\s+(.+)$/gm
  const headings: string[] = []
  let match: RegExpExecArray | null = headingRegex.exec(content)
  while (match !== null) {
    headings.push(match[1].trim())
    match = headingRegex.exec(content)
  }
  return headings
}

export function getAllPages(): DocPage[] {
  if (cachedPages) return cachedPages

  const mdxFiles = findMdxFiles(CONTENT_DIR)

  cachedPages = mdxFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: rawContent } = matter(raw)

    const relativePath = path.relative(CONTENT_DIR, filePath)
    // Remove extension and convert index files
    const slugPath = relativePath
      .replace(/\.(mdx|md)$/, '')
      .replace(/\/index$/, '')
      .replace(/\\index$/, '')
      .replace(/\\/g, '/')

    const slugParts = slugPath.split('/')
    const section = slugParts[0] ?? 'root'

    const content = stripMdx(rawContent)
    const headings = extractHeadings(content)

    return {
      slug: slugPath,
      title: (frontmatter.title as string) ?? slugParts[slugParts.length - 1] ?? 'Untitled',
      description: (frontmatter.description as string) ?? '',
      url: `/docs/${slugPath}`,
      content,
      section,
      headings,
    }
  })

  return cachedPages
}

export function getPage(slug: string): DocPage | undefined {
  return getAllPages().find((p) => p.slug === slug)
}

export function getSections(): DocSection[] {
  if (cachedSections) return cachedSections

  const pages = getAllPages()
  const sectionMap = new Map<string, DocPage[]>()

  for (const page of pages) {
    const existing = sectionMap.get(page.section) ?? []
    existing.push(page)
    sectionMap.set(page.section, existing)
  }

  cachedSections = Array.from(sectionMap.entries()).map(([name, sectionPages]) => ({
    name,
    slug: name,
    pageCount: sectionPages.length,
    description: `Documentation for ${name}`,
  }))

  return cachedSections
}
