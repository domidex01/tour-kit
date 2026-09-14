import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { budgets } from '../../../../tooling/bundle-check/budgets.mjs'

const DOCS = path.resolve(__dirname, '../..')

/**
 * Which gate row backs each package word the marketing copy uses. A claim is
 * allowed to quote the *ceiling* the merge gate enforces, never a number
 * nothing measures — that is how `<8KB` survived in 571 places while the build
 * printed 22 923.
 */
const ROW: Record<string, string> = {
  core: 'core',
  react: 'react',
  hints: 'hints',
  checklists: 'checklists',
  announcements: 'announcements',
  surveys: 'surveys',
  adoption: 'adoption',
  media: 'media',
  analytics: 'analytics:main',
  scheduling: 'scheduling',
  license: 'license',
}

/**
 * One file still claims 8KB in its title, slug and OG image: the whole article
 * is about that number. Renumbering it would leave an argument that no longer
 * reaches its own conclusion, so it needs rewriting or retiring rather than a
 * find-and-replace. Listed here so the debt is visible instead of silent.
 */
const AWAITING_REWRITE = new Set(['tour-kit-8kb-zero-dependencies.mdx'])

const budgetKb = (pkg: string): number | undefined => {
  const row = budgets.find((b: [string, string, number]) => b[0] === ROW[pkg])
  return row ? row[2] / 1000 : undefined
}

function mdxFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) mdxFiles(full, out)
    else if (e.name.endsWith('.mdx')) out.push(full)
  }
  return out
}

// a tour-kit package word, then a size claim within the same clause
// `react` is deliberately absent as a bare word: "React 19", "@react-aria/*"
// and "React Aria Tooltip" all precede sizes that are not ours, and policing it
// flagged Zustand's 1.2KB and react-aria's 8kB as our claims. The React package
// is policed through its scoped name only.
const CLAIM =
  /(?:@tour-kit\/(react)|\b(core|hints|checklists|announcements|surveys|adoption|media|analytics|scheduling|license)\b)[^.\n|]{0,40}?(?:<|under\s+|about\s+|&lt;|~)\s*(\d{1,3}(?:\.\d)?)\s*k[Bb]/gi

describe('bundle-size claims', () => {
  it('never claims a size smaller than the gate enforces', () => {
    const offenders: string[] = []
    const files = [...mdxFiles(path.join(DOCS, 'content')), path.join(DOCS, 'lib/comparisons.ts')]

    for (const file of files) {
      if (AWAITING_REWRITE.has(path.basename(file))) continue
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(CLAIM)) {
        const pkg = (m[1] ?? m[2]).toLowerCase()
        const claimed = Number(m[3])
        const ceiling = budgetKb(pkg)
        if (ceiling !== undefined && claimed < ceiling) {
          offenders.push(
            `${path.relative(DOCS, file)}: claims ${pkg} <${claimed}KB, gate enforces ${ceiling}KB`
          )
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('has a budget row for every package word it polices', () => {
    for (const pkg of Object.keys(ROW)) {
      expect(budgetKb(pkg), `no budget row for ${pkg}`).toBeTypeOf('number')
    }
  })
})
