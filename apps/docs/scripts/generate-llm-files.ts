/**
 * generate-llm-files.ts
 *
 * Single entry point for generating all LLM-facing files:
 *   - public/llms.txt       (llmstxt.org standard index)
 *   - public/llms-full.txt  (full documentation content)
 *   - public/context/*.txt  (per-package context files, via Phase 5 script)
 *
 * Run: npx tsx scripts/generate-llm-files.ts
 *   or: pnpm --filter docs generate:llm
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import matter from 'gray-matter'
import { ALTERNATIVES, BLOG_POSTS, COMPARISONS, type BlogMeta } from '../lib/comparisons'

// ─── Configuration ───────────────────────────────────────────────

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname)
const DOCS_ROOT = path.resolve(SCRIPT_DIR, '..')
const MONOREPO_ROOT = path.resolve(DOCS_ROOT, '../..')
const CONTENT_DIR = path.resolve(DOCS_ROOT, 'content/docs')
const BLOG_DIR = path.resolve(DOCS_ROOT, 'content/blog')
const COMPARE_DIR = path.resolve(DOCS_ROOT, 'content/compare')
const ALTERNATIVES_DIR = path.resolve(DOCS_ROOT, 'content/alternatives')
const PUBLIC_DIR = path.resolve(DOCS_ROOT, 'public')

const SITE_URL = 'https://usertourkit.com'
const BASE_URL = `${SITE_URL}/docs`

/**
 * Trust / editorial pages surfaced in llms.txt so AI assistants can cite the
 * publisher, methodology, and author when summarizing userTourKit content.
 */
interface TrustPage {
  title: string
  description: string
  url: string
}

const TRUST_PAGES: TrustPage[] = [
  {
    title: 'About userTourKit',
    description:
      'About page with maintainer bio (Dominique Degottex / domidex01), verifiable external profiles, and Person schema.',
    url: `${SITE_URL}/about`,
  },
  {
    title: 'Editorial Policy',
    description:
      'How userTourKit content is produced, reviewed, sourced, corrected, and disclosed — including AI-assistance disclosure.',
    url: `${SITE_URL}/editorial-policy`,
  },
  {
    title: 'How We Test',
    description:
      'Methodology behind benchmarks, bundle-size claims, accessibility scores, and comparison data. CI gates, manual verification, reproducibility.',
    url: `${SITE_URL}/how-we-test`,
  },
  {
    title: 'Benchmarks',
    description:
      'Reproducible benchmarks comparing userTourKit against other React product tour libraries. Published methodology, timestamped snapshots, linked sources.',
    url: `${SITE_URL}/benchmarks`,
  },
  {
    title: 'Bundle Size Benchmark',
    description:
      'Gzipped + minified production-build sizes for userTourKit, React Joyride, Shepherd.js, Driver.js, Intro.js, Onborda, and Reactour. Sourced from bundlephobia.',
    url: `${SITE_URL}/benchmarks/bundle-size`,
  },
]

const PROJECT_DESCRIPTION =
  'userTourKit is a headless onboarding and product tour library for React. ' +
  'It provides sequential guided tours, persistent hints, onboarding checklists, ' +
  'product announcements, media embeds, feature adoption tracking, analytics integration, ' +
  'and time-based scheduling. All components are accessible (WCAG 2.1 AA), ' +
  'keyboard-navigable, and work with Next.js and Vite.'

// Section display order and labels
const SECTION_ORDER: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'core', label: 'Core' },
  { key: 'react', label: 'React' },
  { key: 'hints', label: 'Hints' },
  { key: 'adoption', label: 'Adoption' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'checklists', label: 'Checklists' },
  { key: 'media', label: 'Media' },
  { key: 'scheduling', label: 'Scheduling' },
  { key: 'ai', label: 'AI' },
  { key: 'guides', label: 'Guides' },
  { key: 'examples', label: 'Examples' },
  { key: 'api', label: 'API Reference' },
  { key: 'ai-assistants', label: 'AI Assistants' },
  { key: 'concepts', label: 'Concepts' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'integrations', label: 'Integrations' },
]

// ─── Types ───────────────────────────────────────────────────────

interface PageMeta {
  title: string
  description: string
  slug: string
  section: string
  content: string
}

// ─── Helpers ─────────────────────────────────────────────────────

function readVersion(): string {
  const corePkgPath = path.resolve(MONOREPO_ROOT, 'packages/core/package.json')
  try {
    const raw = fs.readFileSync(corePkgPath, 'utf-8')
    const parsed = JSON.parse(raw) as { version?: string }
    return parsed.version ?? '0.0.0'
  } catch {
    console.warn('Warning: Could not read packages/core/package.json, using 0.0.0')
    return '0.0.0'
  }
}

function makeVersionStamp(version: string): string {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  return `# userTourKit v${version} — Generated ${now}`
}

function stripMdxSyntax(content: string): string {
  return content
    .replace(/^import\s+.*$/gm, '') // import statements
    .replace(/^export\s+(?:default\s+)?(?:const|let|var|function)\s+.*$/gm, '') // export statements
    .replace(/<[A-Z][a-zA-Z]*\s[^>]*\/>/g, '') // self-closing JSX <Foo />
    .replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '') // JSX blocks <Foo>...</Foo>
    .replace(/<[A-Z][a-zA-Z]*\s*\/>/g, '') // <Foo/>
    .replace(/\n{3,}/g, '\n\n') // collapse excess newlines
    .trim()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

// ─── Blog / Compare / Alternatives collection ────────────────────
//
// These use the editorial registry in lib/comparisons.ts as the source of
// truth for "published" state and canonical titles. Bodies are read from
// the corresponding MDX file when it exists; when no MDX file has been
// written yet (registry entry exists with `published: false`), the entry
// is skipped entirely.

function readMdxBody(dir: string, slug: string): string | undefined {
  const file = path.resolve(dir, `${slug}.mdx`)
  if (!fs.existsSync(file)) return undefined
  const raw = fs.readFileSync(file, 'utf-8')
  const { content } = matter(raw)
  return stripMdxSyntax(content)
}

function collectBlogPages(): PageMeta[] {
  return BLOG_POSTS.filter((p) => p.published)
    .map((post) => ({
      title: post.title,
      description: post.description,
      slug: post.slug,
      section: 'blog',
      content: readMdxBody(BLOG_DIR, post.slug) ?? post.description,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function collectComparePages(): PageMeta[] {
  return COMPARISONS.filter((c) => c.published)
    .map((c) => ({
      title: c.title,
      description: c.description,
      slug: c.slug,
      section: 'compare',
      content: readMdxBody(COMPARE_DIR, c.slug) ?? c.description,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function collectAlternativePages(): PageMeta[] {
  return ALTERNATIVES.filter((a) => a.published)
    .map((a) => ({
      title: a.title,
      description: a.description,
      slug: a.slug,
      section: 'alternatives',
      content: readMdxBody(ALTERNATIVES_DIR, a.slug) ?? a.description,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

/** Blog posts categorized as "Pillar Pages" — featured in the curated llms.txt. */
function getPillarPosts(): BlogMeta[] {
  return BLOG_POSTS.filter((p) => p.published && p.category === 'Pillar Pages').sort((a, b) =>
    a.slug.localeCompare(b.slug),
  )
}

// ─── Page Collection ─────────────────────────────────────────────

function collectPages(): PageMeta[] {
  const files = globSync('**/*.mdx', { cwd: CONTENT_DIR })

  return files
    .map((file) => {
      const fullPath = path.resolve(CONTENT_DIR, file)
      const raw = fs.readFileSync(fullPath, 'utf-8')
      const { data, content } = matter(raw)

      // Build slug: remove .mdx extension and /index suffix
      const slug = file
        .replace(/\.mdx$/, '')
        .replace(/\/index$/, '')
        .replace(/\\/, '/') // normalize Windows paths

      // Derive section from first path segment
      const section = slug.includes('/') ? slug.split('/')[0] : slug

      return {
        title: (data.title as string) ?? slug,
        description: (data.description as string) ?? '',
        slug,
        section,
        content: stripMdxSyntax(content),
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

// ─── llms.txt Generation ─────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: section grouping and ordering logic
function generateLlmsTxt(pages: PageMeta[], versionStamp: string): string {
  const lines: string[] = []

  // Header
  lines.push(versionStamp)
  lines.push('')
  lines.push('# userTourKit')
  lines.push('')
  lines.push(`> ${PROJECT_DESCRIPTION}`)
  lines.push('')

  // Group pages by section
  const sectionMap = new Map<string, PageMeta[]>()
  for (const page of pages) {
    const existing = sectionMap.get(page.section) ?? []
    existing.push(page)
    sectionMap.set(page.section, existing)
  }

  // Output sections in defined order, then any remaining
  const outputtedSections = new Set<string>()

  for (const { key, label } of SECTION_ORDER) {
    const sectionPages = sectionMap.get(key)
    if (!sectionPages || sectionPages.length === 0) continue

    outputtedSections.add(key)
    lines.push(`## ${label}`)
    lines.push('')

    for (const page of sectionPages) {
      const url = `${BASE_URL}/${page.slug}`
      const desc = page.description ? `: ${page.description}` : ''
      lines.push(`- [${page.title}](${url})${desc}`)
    }

    lines.push('')
  }

  // Any sections not in the predefined order
  for (const [section, sectionPages] of sectionMap) {
    if (outputtedSections.has(section)) continue

    const label = section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')
    lines.push(`## ${label}`)
    lines.push('')

    for (const page of sectionPages) {
      const url = `${BASE_URL}/${page.slug}`
      const desc = page.description ? `: ${page.description}` : ''
      lines.push(`- [${page.title}](${url})${desc}`)
    }

    lines.push('')
  }

  // Pillar blog posts — curated long-form hubs LLMs cite for topic coverage.
  const pillars = getPillarPosts()
  if (pillars.length > 0) {
    lines.push('## Pillar Articles (Blog)')
    lines.push('')
    for (const post of pillars) {
      const url = `${SITE_URL}/blog/${post.slug}`
      const desc = post.description ? `: ${post.description}` : ''
      lines.push(`- [${post.title.replace(/["']/g, '')}](${url})${desc}`)
    }
    lines.push('')
  }

  // Comparisons — head-to-head articles against every major tour library.
  const compares = COMPARISONS.filter((c) => c.published).sort((a, b) =>
    a.slug.localeCompare(b.slug),
  )
  if (compares.length > 0) {
    lines.push('## Comparisons')
    lines.push('')
    for (const c of compares) {
      const url = `${SITE_URL}/compare/${c.slug}`
      lines.push(`- [userTourKit vs ${c.competitor}](${url}): ${c.description}`)
    }
    lines.push('')
  }

  // Alternatives — roundup articles for people searching "X alternatives".
  const alts = ALTERNATIVES.filter((a) => a.published).sort((a, b) => a.slug.localeCompare(b.slug))
  if (alts.length > 0) {
    lines.push('## Alternatives')
    lines.push('')
    for (const a of alts) {
      const url = `${SITE_URL}/alternatives/${a.slug}`
      lines.push(`- [${a.competitor} alternatives](${url}): ${a.description}`)
    }
    lines.push('')
  }

  // Trust / editorial — the pages LLMs cite when asked "is this credible?"
  lines.push('## About & Editorial')
  lines.push('')
  for (const p of TRUST_PAGES) {
    lines.push(`- [${p.title}](${p.url}): ${p.description}`)
  }
  lines.push('')

  return lines.join('\n')
}

// ─── llms-full.txt Generation ────────────────────────────────────

function generateLlmsFullTxt(pages: PageMeta[], versionStamp: string): string {
  const lines: string[] = []

  lines.push(versionStamp)
  lines.push('')

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    lines.push(`# ${page.title}`)
    if (page.description) {
      lines.push('')
      lines.push(`> ${page.description}`)
    }
    lines.push('')
    lines.push(page.content)

    if (i < pages.length - 1) {
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ─── Context Files (Phase 5 integration) ─────────────────────────

function generateContextFiles(): void {
  const contextScript = path.resolve(DOCS_ROOT, 'scripts/generate-context-files.ts')

  if (!fs.existsSync(contextScript)) {
    console.warn(
      'Warning: scripts/generate-context-files.ts not found, skipping context file generation'
    )
    return
  }

  console.log('Generating per-package context files...')

  // Try bun first (faster, avoids esbuild platform issues in WSL), fall back to npx tsx
  // Timeout after 60s to prevent build from hanging indefinitely
  const commands = [
    'bun run scripts/generate-context-files.ts',
    'npx tsx scripts/generate-context-files.ts',
  ]
  for (const cmd of commands) {
    try {
      execSync(cmd, { cwd: DOCS_ROOT, stdio: 'inherit', timeout: 60_000 })
      return
    } catch (error) {
      const err = error as { killed?: boolean }
      if (err.killed) {
        console.warn('Warning: Context file generation timed out after 60s, skipping')
        return
      }
      // try next command
    }
  }

  console.warn('Warning: Could not run generate-context-files.ts, skipping context file generation')
}

// ─── Main ────────────────────────────────────────────────────────

function main(): void {
  const startTime = Date.now()

  console.log('Generating LLM files for userTourKit...')
  console.log(`  Content dir: ${CONTENT_DIR}`)
  console.log(`  Output dir:  ${PUBLIC_DIR}`)
  console.log('')

  // Read version
  const version = readVersion()
  const versionStamp = makeVersionStamp(version)
  console.log(`  Version: ${version}`)
  console.log('')

  // Collect all MDX pages
  const pages = collectPages()
  const blogPages = collectBlogPages()
  const comparePages = collectComparePages()
  const alternativePages = collectAlternativePages()
  console.log(`  Found ${pages.length} docs pages`)
  console.log(`  Found ${blogPages.length} published blog posts`)
  console.log(`  Found ${comparePages.length} published comparisons`)
  console.log(`  Found ${alternativePages.length} published alternatives`)
  console.log('')

  // Generate llms.txt (curated index — uses docs pages + pillar blog + compare + alts + trust)
  const llmsTxt = generateLlmsTxt(pages, versionStamp)
  const llmsTxtPath = path.resolve(PUBLIC_DIR, 'llms.txt')
  fs.writeFileSync(llmsTxtPath, llmsTxt, 'utf-8')
  console.log(`  llms.txt:      ${formatFileSize(Buffer.byteLength(llmsTxt, 'utf-8'))}`)

  // Generate llms-full.txt (full corpus — every published page body)
  const fullCorpus = [...pages, ...blogPages, ...comparePages, ...alternativePages]
  const llmsFullTxt = generateLlmsFullTxt(fullCorpus, versionStamp)
  const llmsFullTxtPath = path.resolve(PUBLIC_DIR, 'llms-full.txt')
  fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf-8')
  console.log(`  llms-full.txt: ${formatFileSize(Buffer.byteLength(llmsFullTxt, 'utf-8'))}`)
  console.log('')

  // Generate per-package context files (Phase 5)
  generateContextFiles()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('')
  console.log(`All LLM files generated successfully in ${elapsed}s`)
}

main()
