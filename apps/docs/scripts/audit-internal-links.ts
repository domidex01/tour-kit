#!/usr/bin/env tsx
/**
 * Internal-link audit.
 *
 * Scans all MDX in content/{blog,compare,alternatives,docs} and counts
 * internal links per file. Flags files under the minimum threshold and
 * writes a markdown report used to iteratively improve topical authority.
 *
 * "Internal" = a markdown link whose target is a site-relative path
 * (starts with `/`) OR a relative path (`./foo`, `../bar`). Anchor-only
 * links (`#section`) are excluded — they don't help cluster density.
 *
 * Usage:
 *   tsx scripts/audit-internal-links.ts            # prints summary + writes report
 *   tsx scripts/audit-internal-links.ts --min=5    # custom threshold
 *   tsx scripts/audit-internal-links.ts --json     # JSON output to stdout (no report file)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(HERE, '..')
const REPORT_PATH = path.join(APP_ROOT, 'reports', 'internal-link-audit.md')

interface CliArgs {
  min: number
  json: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const minArg = argv.find((a) => a.startsWith('--min='))
  const min = minArg ? Number(minArg.split('=')[1]) : 3
  return {
    min: Number.isFinite(min) && min > 0 ? min : 3,
    json: argv.includes('--json'),
  }
}

interface Collection {
  name: string
  /** Absolute glob pattern. */
  pattern: string
  /** Convert file absolute path → site URL (for reporting context). */
  toUrl: (absPath: string) => string
}

const COLLECTIONS: Collection[] = [
  {
    name: 'blog',
    pattern: path.join(APP_ROOT, 'content/blog/*.mdx'),
    toUrl: (p) => `/blog/${path.basename(p, '.mdx')}`,
  },
  {
    name: 'compare',
    pattern: path.join(APP_ROOT, 'content/compare/*.mdx'),
    toUrl: (p) => `/compare/${path.basename(p, '.mdx')}`,
  },
  {
    name: 'alternatives',
    pattern: path.join(APP_ROOT, 'content/alternatives/*.mdx'),
    toUrl: (p) => `/alternatives/${path.basename(p, '.mdx')}`,
  },
  {
    name: 'docs',
    pattern: path.join(APP_ROOT, 'content/docs/**/*.mdx'),
    toUrl: (p) => {
      const rel = path.relative(path.join(APP_ROOT, 'content/docs'), p).replace(/\.mdx$/, '')
      return rel === 'index' ? '/docs' : `/docs/${rel.replace(/\/index$/, '')}`
    },
  },
]

/**
 * Extract internal link hrefs from MDX body.
 * Strips frontmatter, code fences, and JSX comments to avoid counting example URLs.
 * Matches `[text](href)` where href starts with `/` or `./` or `../`.
 */
function extractInternalLinks(mdx: string): string[] {
  const body = mdx
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')

  const links: string[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const href = m[2].trim()
    if (!href) continue
    if (href.startsWith('#')) continue
    if (href.startsWith('http://') || href.startsWith('https://')) continue
    if (href.startsWith('mailto:') || href.startsWith('tel:')) continue
    links.push(href)
  }
  return links
}

interface FileResult {
  collection: string
  file: string
  url: string
  count: number
  links: string[]
}

async function auditCollection(col: Collection): Promise<FileResult[]> {
  const results: FileResult[] = []
  for await (const file of glob(col.pattern)) {
    const raw = await readFile(file, 'utf8')
    const links = extractInternalLinks(raw)
    results.push({
      collection: col.name,
      file: path.relative(APP_ROOT, file),
      url: col.toUrl(file),
      count: links.length,
      links,
    })
  }
  return results.sort((a, b) => a.count - b.count || a.file.localeCompare(b.file))
}

function formatSummary(all: FileResult[], min: number): string {
  const total = all.length
  const under = all.filter((r) => r.count < min)
  const zero = all.filter((r) => r.count === 0)
  const byCol = new Map<string, { total: number; under: number }>()
  for (const r of all) {
    const entry = byCol.get(r.collection) ?? { total: 0, under: 0 }
    entry.total++
    if (r.count < min) entry.under++
    byCol.set(r.collection, entry)
  }

  const lines: string[] = []
  lines.push(`# Internal-link audit`)
  lines.push('')
  lines.push(`> Minimum threshold: **${min} internal links per page**`)
  lines.push('')
  lines.push(`Total MDX files scanned: **${total}**`)
  lines.push(`Files below threshold: **${under.length}** (${((under.length / total) * 100).toFixed(1)}%)`)
  lines.push(`Files with **zero** internal links: **${zero.length}**`)
  lines.push('')
  lines.push(`## By collection`)
  lines.push('')
  lines.push(`| Collection | Total | Below threshold |`)
  lines.push(`| --- | ---: | ---: |`)
  for (const [col, v] of [...byCol].sort()) {
    lines.push(`| ${col} | ${v.total} | ${v.under} |`)
  }
  lines.push('')

  lines.push(`## Files below threshold`)
  lines.push('')
  if (under.length === 0) {
    lines.push('_None — every MDX file meets the minimum._')
  } else {
    lines.push(`| Collection | File | URL | Link count |`)
    lines.push(`| --- | --- | --- | ---: |`)
    for (const r of under) {
      lines.push(`| ${r.collection} | \`${r.file}\` | [${r.url}](${r.url}) | ${r.count} |`)
    }
  }
  lines.push('')

  if (under.length > 0) {
    lines.push(`## Remediation notes`)
    lines.push('')
    lines.push(
      '- Add links to the closest **pillar page** (e.g. `/docs/guides/product-tour-complete-guide`) — this is the highest-leverage single fix.',
    )
    lines.push(
      '- Cross-link to **adjacent content** (same category, same competitor, same framework) using descriptive anchor text.',
    )
    lines.push(
      '- Prefer **prose links** over "See also" dumps — Google weights contextual links higher.',
    )
    lines.push(
      '- Never use "click here" / "read more" as anchor text; make the anchor describe the destination.',
    )
    lines.push('')
  }

  return lines.join('\n')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const all: FileResult[] = []
  for (const col of COLLECTIONS) {
    const results = await auditCollection(col)
    all.push(...results)
  }

  if (args.json) {
    process.stdout.write(JSON.stringify({ min: args.min, files: all }, null, 2))
    return
  }

  const report = formatSummary(all, args.min)
  await mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await writeFile(REPORT_PATH, report, 'utf8')

  // Brief stdout summary
  const under = all.filter((r) => r.count < args.min)
  console.log(`Scanned ${all.length} MDX files across ${COLLECTIONS.length} collections.`)
  console.log(`${under.length} files have fewer than ${args.min} internal links.`)
  console.log(`Report written to ${path.relative(APP_ROOT, REPORT_PATH)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
