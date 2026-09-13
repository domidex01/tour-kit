import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Marketing copy does not use em dashes. They read as AI-generated to a
 * developer audience and they survived three copy rewrites precisely because
 * nothing enforced the preference.
 *
 * The scan is comment-aware: an em dash inside a `//` or `/* *\/` comment is
 * engineering prose, not copy, and is free to stay. Anything else, inside a
 * string literal or in JSX text, is user-facing and fails the test with the
 * file and line so the fix is one edit, not a hunt.
 *
 * En dashes (U+2013) are deliberately NOT flagged: they are the correct
 * character for the ranges this copy quotes ("2–4 weeks", "$300–$2,000").
 */
const EM_DASH = '—'

const ROOT = path.resolve(__dirname, '../..')

const COPY_DIRS = [
  'components/landing',
  'components/capability',
  'components/article',
  'components/blog',
]

const COPY_FILES = [
  'components/sale-announcement-banner.tsx',
  'lib/comparisons.ts',
  'lib/pricing-faqs.ts',
  'lib/structured-data.tsx',
]

function collect(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) collect(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
}

function copyFiles(): string[] {
  const files: string[] = []
  for (const rel of COPY_DIRS) collect(path.join(ROOT, rel), files)
  for (const rel of COPY_FILES) files.push(path.join(ROOT, rel))
  // every marketing page: app/page.tsx, app/pricing/page.tsx,
  // app/compare/[slug]/page.tsx, ...
  collect(path.join(ROOT, 'app'), files)
  return files.filter((f) => /page\.tsx$/.test(f) || !f.includes(`${path.sep}app${path.sep}`))
}

/** Indices of em dashes that are user-facing copy on one line. */
function userFacing(line: string, blockAtStart: boolean): { hits: number[]; inBlock: boolean } {
  const hits: number[] = []
  let inBlock = blockAtStart
  let quote: string | null = null
  let i = 0
  while (i < line.length) {
    const c = line[i]
    if (inBlock) {
      if (c === '*' && line[i + 1] === '/') {
        inBlock = false
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === quote) quote = null
      else if (c === EM_DASH) hits.push(i)
      i += 1
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      i += 1
      continue
    }
    if (c === '/' && line[i + 1] === '/') break
    if (c === '/' && line[i + 1] === '*') {
      inBlock = true
      i += 2
      continue
    }
    if (c === EM_DASH) hits.push(i) // outside string and comment: JSX text
    i += 1
  }
  return { hits, inBlock }
}

describe('marketing copy', () => {
  it('contains no em dashes in user-facing strings or JSX text', () => {
    const offenders: string[] = []
    for (const file of copyFiles()) {
      let inBlock = false
      const lines = readFileSync(file, 'utf-8').split('\n')
      lines.forEach((line, n) => {
        const { hits, inBlock: next } = userFacing(line, inBlock)
        inBlock = next
        if (hits.length > 0) offenders.push(`${path.relative(ROOT, file)}:${n + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
