#!/usr/bin/env bun
// One-shot sweep: remove redundant leading `# Heading` from docs MDX
// when the heading text matches the frontmatter `title`.
// Fumadocs' <DocsTitle> already renders an H1, so a matching MDX H1
// creates a duplicate. See reports/SEO-SYNTHESIS-20260419.md §7.

import { readFile, writeFile } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', 'content', 'docs')
const DRY_RUN = process.argv.includes('--dry-run')

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/
const TITLE_RE = /^title:\s*['"]?([^'"\n]+?)['"]?\s*$/m

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
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
  const lines = body.split('\n')
  // Skip blank lines + import/export statements (possibly multi-line braced)
  let i = 0
  while (i < lines.length) {
    const t = lines[i].trim()
    if (t === '') { i++; continue }
    if (/^(import|export)\b/.test(t)) {
      // consume until the statement closes (semicolon or matching brace)
      let braceDepth = 0
      for (const ch of lines[i]) {
        if (ch === '{') braceDepth++
        else if (ch === '}') braceDepth--
      }
      if (lines[i].trimEnd().endsWith(';') || lines[i].trim().endsWith('}')) { i++; continue }
      // multi-line import
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
    break
  }
  if (i >= lines.length) return { file, changed: false, reason: 'empty body' }

  const firstLine = lines[i]
  const h1Match = /^#\s+(.+?)\s*$/.exec(firstLine)
  if (!h1Match) return { file, changed: false, reason: 'no leading #' }

  if (norm(h1Match[1]) !== norm(title)) {
    return { file, changed: false, reason: `mismatch ("${h1Match[1]}" vs "${title}")` }
  }

  // Remove the H1 line + any immediately following blank line
  lines.splice(i, 1)
  if (i < lines.length && lines[i].trim() === '') lines.splice(i, 1)
  const newBody = lines.join('\n')
  const newRaw = raw.slice(0, fmMatch[0].length) + newBody
  if (!DRY_RUN) await writeFile(file, newRaw, 'utf8')
  return { file, changed: true, title, reason: 'stripped' }
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
