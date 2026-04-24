#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo', '.vercel', 'out', 'dist', '.git'])
const PATTERN = /NEXT_PUBLIC_(POLAR_ACCESS|RESEND_API|OPS_ALERT)/

const hits = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(ts|tsx|js|mjs|cjs|jsx|mdx|md|json|yml|yaml|env|example|local)$/i.test(entry)) continue
    const text = readFileSync(full, 'utf8')
    text.split('\n').forEach((line, i) => {
      if (PATTERN.test(line)) hits.push(`${full}:${i + 1}: ${line.trim()}`)
    })
  }
}

walk(root)

if (hits.length) {
  console.error('[check:secrets] Server-only secrets must not be prefixed NEXT_PUBLIC_:\n')
  for (const h of hits) console.error(h)
  process.exit(1)
}
