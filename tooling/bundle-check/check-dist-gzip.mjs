#!/usr/bin/env node
// Raw dist gzip size gate — the BINDING merge gate for bundle size.
//
// Measures what a consumer actually downloads: each published entry's import
// closure, gzipped. This is the number CLAUDE.md quotes and the one a reviewer
// can reproduce with `gzip -c`. `size-limit` (root `.size-limit.json`) is the
// secondary smoke signal — it bundles with dependencies and measures brotli,
// which is a different unit and not comparable to these numbers.
//
// The budgets and their rationale live in `budgets.mjs`; the walker lives in
// `closure.mjs`. Both are separate modules so tests can import them without
// executing this script.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { budgets } from './budgets.mjs'
import { closureOf } from './closure.mjs'

// Resolve paths relative to the repo root so the checker works regardless of cwd.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

let fails = 0
for (const [name, relPath, budget] of budgets) {
  try {
    const files = closureOf(resolve(repoRoot, relPath))
    const gz = files.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0)
    const over = gz > budget
    if (over) fails++
    const status = over ? '✗ OVER' : '✓'
    // Name the file count when the closure is more than the entry, so a
    // reviewer can see at a glance which rows are reading a chunk graph.
    const shape = files.length > 1 ? `  (${files.length} files)` : ''
    console.log(
      `${status.padEnd(8)} ${name.padEnd(24)} gz=${String(gz).padStart(6)}  budget=${budget}${shape}`
    )
  } catch (e) {
    console.log(`?        ${name.padEnd(24)} MISSING (${e.code ?? e.message})`)
  }
}

if (fails > 0) {
  console.error(`\n${fails} bundle(s) over budget`)
  process.exit(1)
}
console.log('\nAll bundles within budget')
