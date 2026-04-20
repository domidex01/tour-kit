/**
 * check-mdx-freshness.ts
 *
 * Warn when an MDX article's body changed but its `lastUpdated` frontmatter
 * field did not get bumped. AI search engines downweight stale content, so
 * dateModified must track meaningful edits.
 *
 * Behaviour: prints warnings, exits 0. Never mutates files. Intended to run
 * locally before committing or in CI before merge.
 *
 * Usage:
 *   pnpm --filter docs check:freshness
 *   pnpm --filter docs check:freshness -- --base=origin/main
 *
 * The `--base` flag selects the git ref to diff against (default: origin/main,
 * falling back to HEAD when origin/main is unavailable).
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

type FreshnessResult =
  | { file: string; status: 'ok' }
  | { file: string; status: 'stale'; reason: string }
  | { file: string; status: 'skip'; reason: string }

interface ParsedMdx {
  frontmatter: Record<string, string>
  body: string
}

const DOCS_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const MONOREPO_ROOT = path.resolve(DOCS_ROOT, '../..')
const BLOG_DIR_REL = 'apps/docs/content/blog'

function parseArgs(): { base: string } {
  const baseArg = process.argv.find((a) => a.startsWith('--base='))
  return { base: baseArg ? baseArg.slice('--base='.length) : 'origin/main' }
}

function runGit(args: string[]): string {
  return execSync(`git ${args.join(' ')}`, {
    cwd: MONOREPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function tryGit(args: string[]): string | null {
  try {
    return runGit(args)
  } catch {
    return null
  }
}

function resolveBase(preferred: string): string | null {
  if (tryGit(['rev-parse', '--verify', preferred]) !== null) return preferred
  const fallback = tryGit(['rev-parse', '--verify', 'HEAD'])
  return fallback
}

function getChangedMdxFiles(base: string): string[] {
  const raw =
    tryGit(['diff', '--name-only', `${base}...HEAD`, '--', BLOG_DIR_REL]) ??
    tryGit(['diff', '--name-only', base, '--', BLOG_DIR_REL]) ??
    ''
  const workingTree = tryGit(['diff', '--name-only', 'HEAD', '--', BLOG_DIR_REL]) ?? ''
  return [...new Set([...raw.split('\n'), ...workingTree.split('\n')])]
    .map((l) => l.trim())
    .filter((l) => l.endsWith('.mdx') && l.startsWith(BLOG_DIR_REL))
}

function parseMdx(raw: string): ParsedMdx {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: raw }
  const frontmatter: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (kv) frontmatter[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { frontmatter, body: match[2] }
}

function getFileAtRef(ref: string, relPath: string): string | null {
  const out = tryGit(['show', `${ref}:${relPath}`])
  return out
}

function getCurrentFile(relPath: string): string | null {
  const abs = path.resolve(MONOREPO_ROOT, relPath)
  try {
    return fs.readFileSync(abs, 'utf-8')
  } catch {
    return null
  }
}

function checkFile(relPath: string, base: string): FreshnessResult {
  const before = getFileAtRef(base, relPath)
  const after = getCurrentFile(relPath)

  if (after === null) return { file: relPath, status: 'skip', reason: 'file missing on disk' }
  if (before === null)
    return { file: relPath, status: 'skip', reason: 'new file — no prior version to diff' }

  const parsedBefore = parseMdx(before)
  const parsedAfter = parseMdx(after)

  if (parsedBefore.body.trim() === parsedAfter.body.trim()) return { file: relPath, status: 'ok' }

  const prevUpdated = parsedBefore.frontmatter.lastUpdated ?? ''
  const nextUpdated = parsedAfter.frontmatter.lastUpdated ?? ''

  if (!nextUpdated) {
    return {
      file: relPath,
      status: 'stale',
      reason: 'body changed but frontmatter has no `lastUpdated` field',
    }
  }
  if (prevUpdated && nextUpdated === prevUpdated) {
    return {
      file: relPath,
      status: 'stale',
      reason: `body changed but \`lastUpdated\` still \`${nextUpdated}\``,
    }
  }

  return { file: relPath, status: 'ok' }
}

function main(): void {
  const { base: requestedBase } = parseArgs()
  const base = resolveBase(requestedBase)
  if (!base) {
    console.log('MDX freshness: no git base ref available, skipping')
    return
  }

  const files = getChangedMdxFiles(base)
  if (files.length === 0) {
    console.log(`MDX freshness: no changed blog MDX files vs ${base}`)
    return
  }

  console.log(`MDX freshness: checking ${files.length} changed file(s) vs ${base}`)
  const results = files.map((f) => checkFile(f, base))

  const stale = results.filter((r): r is Extract<FreshnessResult, { status: 'stale' }> => r.status === 'stale')
  const skipped = results.filter((r): r is Extract<FreshnessResult, { status: 'skip' }> => r.status === 'skip')
  const ok = results.filter((r) => r.status === 'ok')

  for (const r of stale) {
    console.warn(`  STALE ${r.file}\n    ${r.reason}`)
  }
  for (const r of skipped) {
    console.log(`  skip  ${r.file} (${r.reason})`)
  }

  console.log('')
  console.log(`  ok:      ${ok.length}`)
  console.log(`  stale:   ${stale.length}`)
  console.log(`  skipped: ${skipped.length}`)

  if (stale.length > 0) {
    console.warn('\nBump `lastUpdated` in the flagged files or revert the body edit.')
  }
}

main()
