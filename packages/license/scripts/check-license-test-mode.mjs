#!/usr/bin/env node
// Static guard: forbid `LicenseTestMode` imports outside __tests__/, examples/,
// and Storybook files. Run from the repository root or from the package root;
// the script walks `src/` and `examples/` under the current working directory.
//
// Exits 1 with stderr listing offending files when a violation is detected.
// Wired into `pnpm --filter @tour-kit/license test` via package.json scripts.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import process from 'node:process'

const ALLOWED_PATTERNS = [
  /(^|[\\/])__tests__[\\/]/,
  /(^|[\\/])examples[\\/]/,
  /\.stories\.(t|j)sx?$/,
  /\.story\.(t|j)sx?$/,
]

const SOURCE_DIRS = ['src', 'examples']
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.turbo', 'coverage'])

function walk(dir) {
  /** @type {string[]} */
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx|js|jsx)$/.test(full)) {
      out.push(full)
    }
  }
  return out
}

function isAllowed(filePath) {
  const normalized = filePath.replaceAll(sep, '/')
  return ALLOWED_PATTERNS.some((re) => re.test(normalized))
}

// Match any import or re-export statement that mentions LicenseTestMode from
// @tour-kit/license. Tolerates multi-line imports.
const IMPORT_RE =
  /(?:import|export)\s*(?:\{[^}]*\bLicenseTestMode\b[^}]*\}|\*\s+as\s+\w+)\s*from\s*['"]@tour-kit\/license(?:\/[^'"]*)?['"]/m

const cwd = process.cwd()
const offenders = []

for (const dirName of SOURCE_DIRS) {
  const dir = join(cwd, dirName)
  let st
  try {
    st = statSync(dir)
  } catch {
    continue
  }
  if (!st.isDirectory()) continue

  for (const file of walk(dir)) {
    const rel = relative(cwd, file)
    if (isAllowed(rel)) continue
    let contents
    try {
      contents = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    if (IMPORT_RE.test(contents)) {
      offenders.push(rel)
    }
  }
}

if (offenders.length > 0) {
  process.stderr.write(
    "'LicenseTestMode' may only be imported from __tests__/, examples/, or Storybook (*.stories.tsx, *.story.tsx) files:\n"
  )
  for (const offender of offenders) {
    process.stderr.write(`  - ${offender}\n`)
  }
  process.exit(1)
}
