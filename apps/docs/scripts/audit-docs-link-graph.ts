#!/usr/bin/env tsx
/**
 * Docs-scoped link graph audit.
 *
 * For every MDX file under content/docs:
 *   - Extracts internal outbound links (markdown `[](...)` AND JSX `href="..."`),
 *     including <Card href>, <a href>, <Link href>, etc.
 *   - Builds inbound/outbound counts across the docs sub-graph (only edges where
 *     the target resolves to a /docs/... URL count toward the graph).
 *   - Flags orphan pages (0 inbound from other docs pages) and dead-ends (0 outbound).
 *   - Detects natural-link candidates: prose mentions of public API symbols
 *     (hooks, components, providers, packages) that are NOT linked.
 *
 * CI gate: pass `--gate` to exit non-zero when orphans > MAX_ORPHANS or
 * dead-ends > MAX_DEAD_ENDS. Defaults are set to the post-fix baseline so any
 * regression that adds an unlinked page fails the build.
 *
 * Output: reports/docs-link-graph.md and reports/docs-link-graph.json
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(HERE, '..')
const DOCS_ROOT = path.join(APP_ROOT, 'content/docs')
const REPORT_MD = path.join(APP_ROOT, 'reports', 'docs-link-graph.md')
const REPORT_JSON = path.join(APP_ROOT, 'reports', 'docs-link-graph.json')

/**
 * CI gate thresholds. Lower these as the docs improve to prevent regressions.
 * 2026-05-24 baselines (274 pages total):
 *   - Before audit:                  53 orphans / 67 dead-ends
 *   - After P0+P1+P2 (wave 1):       41 orphans / 61 dead-ends
 *   - After extractor fix:           34 orphans / 54 dead-ends
 *   - After P1 wave 2 (core/react):  20 orphans / 28 dead-ends
 *   - After P2/P3 (api/* + ann/hl):  11 orphans / 17 dead-ends
 *   - After wave 3 (guides + idx):    0 orphans /  0 dead-ends  ← current
 * Headroom of 3 absorbs a couple of new pages between cleanups. Any new page
 * added without inbound or outbound /docs links will fail this gate.
 */
const MAX_ORPHANS = 3
const MAX_DEAD_ENDS = 3

async function walkMdx(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walkMdx(p)))
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      out.push(p)
    }
  }
  return out
}

function fileToUrl(absPath: string): string {
  const rel = path.relative(DOCS_ROOT, absPath).replace(/\.mdx?$/, '')
  if (rel === 'index') return '/docs'
  return `/docs/${rel.replace(/\/index$/, '')}`
}

/**
 * Strip frontmatter, fenced code blocks, MDX expressions, and JSX comments.
 * IMPORTANT: do NOT strip inline backticks here — `[`Name`](url)` is a common
 * MDX link pattern and stripping the backticks first collapses it to `[](url)`,
 * which won't match the markdown-link regex and undercounts outbound edges.
 */
function stripCodeAndFrontmatter(mdx: string): string {
  return mdx
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
}

/** Normalize a href: strip query, anchor, trailing slash. Keep absolute /docs paths. */
function normalizeHref(href: string, fromUrl: string): string | null {
  let h = href.trim()
  if (!h) return null
  if (h.startsWith('#')) return null
  if (/^[a-z]+:\/\//i.test(h)) return null
  if (h.startsWith('mailto:') || h.startsWith('tel:')) return null

  // Strip query and anchor
  h = h.split('#')[0].split('?')[0]

  if (h.startsWith('./') || h.startsWith('../')) {
    // Resolve relative to fromUrl directory
    const base = fromUrl.endsWith('/') ? fromUrl : fromUrl + '/'
    const url = new URL(h, `https://x${base}`)
    h = url.pathname
  }

  if (!h.startsWith('/')) return null

  // Strip trailing slash (except root)
  if (h.length > 1 && h.endsWith('/')) h = h.slice(0, -1)
  return h
}

function extractLinks(mdx: string, fromUrl: string): string[] {
  const body = stripCodeAndFrontmatter(mdx)
  const out = new Set<string>()
  // markdown [text](href)
  const mdRe = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let m: RegExpExecArray | null
  while ((m = mdRe.exec(body)) !== null) {
    const norm = normalizeHref(m[1], fromUrl)
    if (norm) out.add(norm)
  }
  // JSX href="..." or href='...'
  const jsxRe = /\bhref\s*=\s*["']([^"']+)["']/g
  while ((m = jsxRe.exec(body)) !== null) {
    const norm = normalizeHref(m[1], fromUrl)
    if (norm) out.add(norm)
  }
  return [...out]
}

interface PageInfo {
  file: string
  absFile: string
  url: string
  section: string
  title: string | null
  outbound: string[]
  outboundDocs: string[]
  inboundDocs: Set<string>
}

function extractTitle(mdx: string): string | null {
  const fm = mdx.match(/^---([\s\S]*?)---/)
  if (!fm) return null
  const t = fm[1].match(/^title:\s*(.+?)\s*$/m)
  if (!t) return null
  return t[1].replace(/^["']|["']$/g, '')
}

function sectionOf(url: string): string {
  if (url === '/docs') return '_root'
  const parts = url.replace(/^\/docs\//, '').split('/')
  return parts[0]
}

/* ------------------------- Natural-link detection ------------------------- */

/** Build a symbol → URL map from filenames in known API directories. */
function buildSymbolMap(pages: PageInfo[]): Map<string, string> {
  const map = new Map<string, string>()

  // Directories whose filenames are API symbols. Kebab → camel/Pascal.
  const apiDirs = [
    { dir: 'core/hooks', kind: 'hook' },
    { dir: 'core/providers', kind: 'provider' },
    { dir: 'core/utilities', kind: 'util' },
    { dir: 'react/components', kind: 'component' },
    { dir: 'react/hooks', kind: 'hook' },
    { dir: 'react/providers', kind: 'provider' },
    { dir: 'react/headless', kind: 'component' },
    { dir: 'hints/headless', kind: 'component' },
    { dir: 'adoption/components', kind: 'component' },
    { dir: 'adoption/hooks', kind: 'hook' },
    { dir: 'adoption/providers', kind: 'provider' },
    { dir: 'adoption/dashboard', kind: 'component' },
    { dir: 'announcements/components', kind: 'component' },
    { dir: 'announcements/headless', kind: 'component' },
    { dir: 'announcements/hooks', kind: 'hook' },
    { dir: 'announcements/providers', kind: 'provider' },
    { dir: 'checklists/components', kind: 'component' },
    { dir: 'checklists/headless', kind: 'component' },
    { dir: 'checklists/hooks', kind: 'hook' },
    { dir: 'checklists/providers', kind: 'provider' },
    { dir: 'checklists/utilities', kind: 'util' },
    { dir: 'media/components', kind: 'component' },
    { dir: 'media/headless', kind: 'component' },
    { dir: 'media/hooks', kind: 'hook' },
    { dir: 'media/utilities', kind: 'util' },
    { dir: 'scheduling/hooks', kind: 'hook' },
    { dir: 'scheduling/utilities', kind: 'util' },
    { dir: 'surveys/components', kind: 'component' },
    { dir: 'surveys/headless', kind: 'component' },
    { dir: 'surveys/hooks', kind: 'hook' },
    { dir: 'surveys/providers', kind: 'provider' },
    { dir: 'surveys/utilities', kind: 'util' },
    { dir: 'analytics/hooks', kind: 'hook' },
    { dir: 'analytics/providers', kind: 'provider' },
    { dir: 'analytics/plugins', kind: 'util' },
  ]

  const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const kebabToPascal = (s: string) => s.charAt(0).toUpperCase() + kebabToCamel(s).slice(1)

  for (const page of pages) {
    for (const { dir, kind } of apiDirs) {
      const prefix = `/docs/${dir}/`
      if (!page.url.startsWith(prefix)) continue
      const slug = page.url.slice(prefix.length)
      if (!slug || slug === 'index' || slug === 'meta') continue
      // hooks: use-foo → useFoo
      if (kind === 'hook' && slug.startsWith('use-')) {
        const sym = kebabToCamel(slug) // useFoo
        if (!map.has(sym)) map.set(sym, page.url)
      } else if (kind === 'component' || kind === 'provider') {
        const sym = kebabToPascal(slug) // ChecklistPanel, TourProvider
        if (!map.has(sym)) map.set(sym, page.url)
      } else {
        // util: keep both pascal and camel
        const camel = kebabToCamel(slug)
        const pascal = kebabToPascal(slug)
        if (!map.has(pascal)) map.set(pascal, page.url)
        if (!map.has(camel)) map.set(camel, page.url)
      }
    }
  }

  // Hand-curated package aliases
  const pkgAliases: Array<[string, string]> = [
    ['@tour-kit/core', '/docs/core'],
    ['@tour-kit/react', '/docs/react'],
    ['@tour-kit/hints', '/docs/hints'],
    ['@tour-kit/adoption', '/docs/adoption'],
    ['@tour-kit/analytics', '/docs/analytics'],
    ['@tour-kit/announcements', '/docs/announcements'],
    ['@tour-kit/checklists', '/docs/checklists'],
    ['@tour-kit/media', '/docs/media'],
    ['@tour-kit/scheduling', '/docs/scheduling'],
    ['@tour-kit/surveys', '/docs/surveys'],
    ['@tour-kit/ai', '/docs/ai'],
    ['@tour-kit/license', '/docs/licensing'],
  ]
  for (const [k, v] of pkgAliases) {
    if (!map.has(k)) map.set(k, v)
  }

  return map
}

interface NaturalLinkCandidate {
  symbol: string
  target: string
  fromUrl: string
  fromFile: string
  /** Approximate prose excerpt around the mention. */
  excerpt: string
}

function findNaturalLinks(pages: PageInfo[], symbols: Map<string, string>, raw: Map<string, string>): NaturalLinkCandidate[] {
  const out: NaturalLinkCandidate[] = []
  for (const page of pages) {
    const mdx = raw.get(page.absFile)!
    const body = stripCodeAndFrontmatter(mdx)
    // Build a quick set of already-linked anchor texts (rough — used to skip)
    const linkedAnchors = new Set<string>()
    const reAnchor = /\[([^\]]+)\]\(([^)]+)\)/g
    let am: RegExpExecArray | null
    while ((am = reAnchor.exec(body)) !== null) linkedAnchors.add(am[1].trim())

    for (const [sym, target] of symbols) {
      if (target === page.url) continue // don't suggest self-link
      // Don't suggest if page already links to target
      if (page.outboundDocs.includes(target)) continue
      // Pick a regex that matches the symbol as a standalone token, but
      // excludes occurrences inside a markdown link (`[...](...)`) by anchor.
      let pat: RegExp
      if (sym.startsWith('@')) {
        pat = new RegExp(`(?<![\\w/@-])${sym.replace(/[/.@-]/g, (c) => '\\' + c)}(?![\\w/])`, 'g')
      } else {
        // Word-boundary-ish: not preceded by alnum/<, not followed by alnum
        pat = new RegExp(`(?<![A-Za-z0-9_<])${sym}(?![A-Za-z0-9_])`, 'g')
      }
      const matches = body.match(pat)
      if (!matches || matches.length === 0) continue
      // Skip if every occurrence is the anchor text of an existing link
      if (linkedAnchors.has(sym)) continue
      // Get a short excerpt around first match
      const idx = body.search(pat)
      const start = Math.max(0, idx - 40)
      const end = Math.min(body.length, idx + sym.length + 60)
      const excerpt = body.slice(start, end).replace(/\s+/g, ' ').trim()
      out.push({
        symbol: sym,
        target,
        fromUrl: page.url,
        fromFile: page.file,
        excerpt,
      })
    }
  }
  return out
}

/* ------------------------- Main ------------------------- */

async function main() {
  const files = await walkMdx(DOCS_ROOT)
  const raw = new Map<string, string>()
  const pages: PageInfo[] = []

  for (const f of files) {
    const text = await readFile(f, 'utf8')
    raw.set(f, text)
    const url = fileToUrl(f)
    const outbound = extractLinks(text, url)
    pages.push({
      file: path.relative(APP_ROOT, f),
      absFile: f,
      url,
      section: sectionOf(url),
      title: extractTitle(text),
      outbound,
      outboundDocs: [],
      inboundDocs: new Set<string>(),
    })
  }

  const byUrl = new Map<string, PageInfo>()
  for (const p of pages) byUrl.set(p.url, p)

  // Compute outboundDocs (only edges into other docs pages) and inbound
  for (const p of pages) {
    for (const href of p.outbound) {
      // Treat /docs and /docs/... as docs edges
      if (href === '/docs' || href.startsWith('/docs/')) {
        const target = byUrl.get(href)
        if (target && target.url !== p.url) {
          p.outboundDocs.push(target.url)
          target.inboundDocs.add(p.url)
        }
      }
    }
    p.outboundDocs = [...new Set(p.outboundDocs)]
  }

  const symbols = buildSymbolMap(pages)
  const candidates = findNaturalLinks(pages, symbols, raw)

  /* Aggregate */
  const orphans = pages
    .filter((p) => p.inboundDocs.size === 0 && p.url !== '/docs')
    .sort((a, b) => a.section.localeCompare(b.section) || a.url.localeCompare(b.url))

  const deadEnds = pages
    .filter((p) => p.outboundDocs.length === 0)
    .sort((a, b) => a.section.localeCompare(b.section) || a.url.localeCompare(b.url))

  const lowInbound = pages
    .filter((p) => p.inboundDocs.size > 0 && p.inboundDocs.size <= 1 && p.url !== '/docs')
    .sort((a, b) => a.inboundDocs.size - b.inboundDocs.size)

  // Most-linked-to (hubs)
  const topInbound = [...pages]
    .sort((a, b) => b.inboundDocs.size - a.inboundDocs.size)
    .slice(0, 20)

  // Top dead-end sections
  const sectionStats = new Map<string, { total: number; orphan: number; dead: number; outboundAvg: number; inboundAvg: number }>()
  for (const p of pages) {
    const s = sectionStats.get(p.section) ?? { total: 0, orphan: 0, dead: 0, outboundAvg: 0, inboundAvg: 0 }
    s.total++
    if (p.inboundDocs.size === 0 && p.url !== '/docs') s.orphan++
    if (p.outboundDocs.length === 0) s.dead++
    s.outboundAvg += p.outboundDocs.length
    s.inboundAvg += p.inboundDocs.size
    sectionStats.set(p.section, s)
  }
  for (const s of sectionStats.values()) {
    s.outboundAvg = +(s.outboundAvg / s.total).toFixed(2)
    s.inboundAvg = +(s.inboundAvg / s.total).toFixed(2)
  }

  // Group natural-link candidates by source page
  const candidatesByPage = new Map<string, NaturalLinkCandidate[]>()
  for (const c of candidates) {
    const arr = candidatesByPage.get(c.fromUrl) ?? []
    arr.push(c)
    candidatesByPage.set(c.fromUrl, arr)
  }
  const pagesWithMostOpportunities = [...candidatesByPage.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)

  /* Output */
  const out: string[] = []
  out.push('# Docs internal-link graph audit')
  out.push('')
  out.push(`Scanned **${pages.length}** MDX pages under \`content/docs\`.`)
  out.push('')
  out.push('## Top-line metrics')
  out.push('')
  const totalOut = pages.reduce((s, p) => s + p.outboundDocs.length, 0)
  const totalIn = pages.reduce((s, p) => s + p.inboundDocs.size, 0)
  out.push(`- Total docs→docs edges: **${totalOut}**`)
  out.push(`- Avg outbound docs-links per page: **${(totalOut / pages.length).toFixed(2)}**`)
  out.push(`- Avg inbound docs-links per page: **${(totalIn / pages.length).toFixed(2)}**`)
  out.push(`- Orphans (0 inbound): **${orphans.length}** (${((orphans.length / pages.length) * 100).toFixed(1)}%)`)
  out.push(`- Dead-ends (0 outbound): **${deadEnds.length}** (${((deadEnds.length / pages.length) * 100).toFixed(1)}%)`)
  out.push(`- Low-inbound (1 inbound): **${lowInbound.length}**`)
  out.push(`- Natural-link candidates: **${candidates.length}** across **${candidatesByPage.size}** pages`)
  out.push('')

  out.push('## Per-section health')
  out.push('')
  out.push('| Section | Pages | Orphans | Dead-ends | Avg out | Avg in |')
  out.push('| --- | ---: | ---: | ---: | ---: | ---: |')
  for (const [name, s] of [...sectionStats.entries()].sort()) {
    out.push(`| ${name} | ${s.total} | ${s.orphan} | ${s.dead} | ${s.outboundAvg} | ${s.inboundAvg} |`)
  }
  out.push('')

  out.push('## Top inbound (current hubs)')
  out.push('')
  out.push('| URL | Inbound |')
  out.push('| --- | ---: |')
  for (const p of topInbound) {
    out.push(`| [${p.url}](${p.url}) | ${p.inboundDocs.size} |`)
  }
  out.push('')

  out.push('## Orphan pages (0 inbound docs links)')
  out.push('')
  out.push('Pages no other doc page points to. The section index page is usually the right home for at least one inbound link.')
  out.push('')
  out.push('| Section | URL | Outbound |')
  out.push('| --- | --- | ---: |')
  for (const p of orphans) {
    out.push(`| ${p.section} | [${p.url}](${p.url}) | ${p.outboundDocs.length} |`)
  }
  out.push('')

  out.push('## Dead-end pages (0 outbound docs links)')
  out.push('')
  out.push('Pages a reader cannot navigate further from. Every dead-end should at minimum point back to its section index and to one peer.')
  out.push('')
  out.push('| Section | URL | Inbound |')
  out.push('| --- | --- | ---: |')
  for (const p of deadEnds) {
    out.push(`| ${p.section} | [${p.url}](${p.url}) | ${p.inboundDocs.size} |`)
  }
  out.push('')

  out.push('## Top natural-link opportunities (per page)')
  out.push('')
  out.push('Pages whose prose mentions API symbols (hooks, components, packages) that are not currently linked. Top 30 by opportunity count.')
  out.push('')
  for (const [url, items] of pagesWithMostOpportunities) {
    out.push(`### \`${url}\` (${items.length} candidates)`)
    out.push('')
    out.push('| Symbol mention | Suggested link | Excerpt |')
    out.push('| --- | --- | --- |')
    for (const c of items.slice(0, 12)) {
      const exc = c.excerpt.replace(/\|/g, '\\|')
      out.push(`| \`${c.symbol}\` | [${c.target}](${c.target}) | …${exc}… |`)
    }
    out.push('')
  }

  await mkdir(path.dirname(REPORT_MD), { recursive: true })
  await writeFile(REPORT_MD, out.join('\n'), 'utf8')

  const json = {
    pages: pages.map((p) => ({
      url: p.url,
      file: p.file,
      section: p.section,
      title: p.title,
      outbound: p.outboundDocs,
      inboundCount: p.inboundDocs.size,
      inbound: [...p.inboundDocs],
    })),
    sectionStats: Object.fromEntries(sectionStats),
    orphans: orphans.map((p) => p.url),
    deadEnds: deadEnds.map((p) => p.url),
    naturalLinkCandidates: candidates,
  }
  await writeFile(REPORT_JSON, JSON.stringify(json, null, 2), 'utf8')

  console.log(`Scanned ${pages.length} docs pages.`)
  console.log(`Orphans: ${orphans.length}, Dead-ends: ${deadEnds.length}, Natural-link candidates: ${candidates.length}`)
  console.log(`Wrote ${path.relative(APP_ROOT, REPORT_MD)} and ${path.relative(APP_ROOT, REPORT_JSON)}.`)

  if (process.argv.includes('--gate')) {
    const failures: string[] = []
    if (orphans.length > MAX_ORPHANS) {
      failures.push(`orphans=${orphans.length} exceeds MAX_ORPHANS=${MAX_ORPHANS}`)
    }
    if (deadEnds.length > MAX_DEAD_ENDS) {
      failures.push(`deadEnds=${deadEnds.length} exceeds MAX_DEAD_ENDS=${MAX_DEAD_ENDS}`)
    }
    if (failures.length) {
      console.error(`\nCI gate failed:\n  - ${failures.join('\n  - ')}`)
      console.error(`Add inbound or outbound /docs links to recover, or lower the threshold once intentional.`)
      process.exit(1)
    }
    console.log(`CI gate passed (orphans <= ${MAX_ORPHANS}, dead-ends <= ${MAX_DEAD_ENDS}).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
