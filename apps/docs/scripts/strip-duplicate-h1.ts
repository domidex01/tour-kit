#!/usr/bin/env bun
// One-shot sweep: remove redundant leading `# Heading` from docs MDX.
// Fumadocs' <DocsTitle> renders an H1 from frontmatter `title`, so any
// leading `# Heading` in the body becomes a duplicate H1 regardless of
// whether the text matches. We strip the first H1 that appears in the
// body (after imports, JSX blocks, comments) and optionally promote
// existing `## ` headings one level only if the stripped H1's text
// *didn't* match the title (signal that it held unique info).
//
// Flags:
//   --dry-run   show what would change without writing
//   --force     strip even when H1 ≠ title (by default we still strip;
//                flag kept for clarity)
//
// See reports/SEO-SYNTHESIS-20260419.md §7 and memory #165.

import { readFile, writeFile } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', 'content', 'docs')
const DRY_RUN = process.argv.includes('--dry-run')

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const TITLE_RE = /^title:\s*['"]?([^'"\n\r]+?)['"]?\s*$/m

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Skip a JSX / MDX comment block starting at lines[i] (on a line that opens
// with `<` or `{/*`). Returns the next index after the block. Matches brace
// and angle depth to find the end.
function skipBlock(lines: string[], start: number): number {
  const line = lines[start]
  // MDX comment: {/* ... */}
  if (/^\s*\{\s*\/\*/.test(line)) {
    let i = start
    while (i < lines.length && !/\*\/\s*\}/.test(lines[i])) i++
    return i + 1
  }
  // JSX element: consume until tag balance returns to zero and current
  // element is closed. Very lightweight — counts `<Name` opens and `</`
  // / self-closing `/>` closes. Good enough for our MDX usage.
  let depth = 0
  let i = start
  while (i < lines.length) {
    const l = lines[i]
    // Count self-closing tags (<Foo ... />) as neutral.
    const selfClosing = (l.match(/<[A-Za-z][^<>]*\/>/g) || []).length
    // Count opening tags that are NOT self-closing.
    const openTags = (l.match(/<[A-Za-z][A-Za-z0-9]*(?:\s[^<>]*)?(?<!\/)>/g) || []).length
    const closeTags = (l.match(/<\/[A-Za-z][A-Za-z0-9]*\s*>/g) || []).length
    depth += openTags - closeTags
    // selfClosing doesn't affect depth
    void selfClosing
    i++
    if (depth <= 0) break
  }
  return i
}

async function processFile(file: string) {
  const raw = await readFile(file, 'utf8')
  const fmMatch = FRONTMATTER_RE.exec(raw)
  if (!fmMatch) return { file, changed: false, reason: 'no frontmatter' }

  const frontmatter = fmMatch[1]
  const titleMatch = TITLE_RE.exec(frontmatter)
  if (!titleMatch) return { file, changed: false, reason: 'no title' }

  const title = titleMatch[1]
  const body = raw.slice(fmMatch[0].length)
  // Preserve CRLF vs LF — split on either but remember the original sep.
  const eol = body.includes('\r\n') ? '\r\n' : '\n'
  const lines = body.split(/\r?\n/)

  // Walk past blank lines, imports/exports, MDX comments, and top-level
  // JSX blocks (e.g. <Callout>...</Callout>) until we reach the first
  // content line. Cap iterations as a safety net.
  let i = 0
  let guard = 0
  while (i < lines.length && guard++ < 500) {
    const t = lines[i].trim()
    if (t === '') { i++; continue }
    if (/^(import|export)\b/.test(t)) {
      let braceDepth = 0
      for (const ch of lines[i]) {
        if (ch === '{') braceDepth++
        else if (ch === '}') braceDepth--
      }
      if (lines[i].trimEnd().endsWith(';') || lines[i].trim().endsWith('}')) { i++; continue }
      i++
      while (i < lines.length && braceDepth > 0) {
        for (const ch of lines[i]) {
          if (ch === '{') braceDepth++
          else if (ch === '}') braceDepth--
        }
        i++
      }
      continue
    }
    // MDX comment or JSX element — skip the whole block
    if (/^\s*\{\s*\/\*/.test(lines[i]) || /^\s*</.test(lines[i])) {
      i = skipBlock(lines, i)
      continue
    }
    break
  }
  if (i >= lines.length) return { file, changed: false, reason: 'empty body' }

  const firstLine = lines[i]
  const h1Match = /^#\s+(.+?)\s*$/.exec(firstLine)
  if (!h1Match) return { file, changed: false, reason: 'no leading #' }

  const matched = norm(h1Match[1]) === norm(title)

  // Always strip — Fumadocs DocsTitle renders title as H1, so a body H1 is
  // a duplicate regardless of text. Record whether it matched for reporting.
  lines.splice(i, 1)
  if (i < lines.length && lines[i].trim() === '') lines.splice(i, 1)
  const newBody = lines.join(eol)
  const newRaw = raw.slice(0, fmMatch[0].length) + newBody
  if (!DRY_RUN) await writeFile(file, newRaw, 'utf8')
  return {
    file,
    changed: true,
    title,
    reason: matched ? 'stripped (match)' : `stripped (mismatch: "${h1Match[1]}" vs "${title}")`,
  }
}

async function main() {
  const files: string[] = []
  for await (const f of glob('**/*.mdx', { cwd: ROOT })) {
    files.push(path.join(ROOT, f))
  }

  const results = await Promise.all(files.map(processFile))
  const changed = results.filter((r) => r.changed)
  const skipped = results.filter((r) => !r.changed)

  console.log(`Scanned: ${results.length}`)
  console.log(`Changed: ${changed.length}${DRY_RUN ? ' (DRY RUN — no writes)' : ''}`)
  for (const r of changed.slice(0, 30)) console.log(`  ✓ ${path.relative(ROOT, r.file)}`)
  if (changed.length > 30) console.log(`  … and ${changed.length - 30} more`)

  const reasonCounts = skipped.reduce<Record<string, number>>((acc, r) => {
    acc[r.reason!] = (acc[r.reason!] ?? 0) + 1
    return acc
  }, {})
  console.log('\nSkipped reasons:')
  for (const [reason, n] of Object.entries(reasonCounts)) console.log(`  ${n.toString().padStart(4)}  ${reason}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
