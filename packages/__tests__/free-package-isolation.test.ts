import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
// `specifierPattern` matches `from`, `import(` and `require(` — an import, not a
// test that names the package to assert it is absent. `readCode` strips
// comments, so a doc comment quoting an import cannot trip it either.
import { specifierPattern } from '../../tooling/bundle-check/closure.mjs'
import { readCode } from '../../tooling/bundle-check/engine-guard.mjs'

const PACKAGES_ROOT = path.resolve(__dirname, '..')
const LICENCE = '@tour-kit/license'

/**
 * Tour Kit is MIT (2026-10, plan/v3/mit-relicense-plan.md). `@tour-kit/license`
 * is retired: no package may import it or depend on it.
 *
 * This is the guard against a repeat of 2.1.1, when `@tour-kit/react` and
 * `@tour-kit/hints` shipped the licence badge as a 2.x patch. If this test goes
 * red, someone put the gate back — that needs a decision, not a test edit.
 */
const PACKAGES = fs
  .readdirSync(PACKAGES_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'license' && d.name !== '__tests__')
  .filter((d) => fs.existsSync(path.join(PACKAGES_ROOT, d.name, 'package.json')))
  .map((d) => d.name)

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs', '.vue', '.svelte']

function sourceFiles(pkg: string): string[] {
  const srcDir = path.join(PACKAGES_ROOT, pkg, 'src')
  if (!fs.existsSync(srcDir)) return []
  // `readdirSync(..., { recursive: true })`, not `fs.globSync`: CI runs Node 20.
  return fs
    .readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((f) => SOURCE_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .map((f) => path.join(srcDir, f))
}

function filesImporting(pkg: string, specifier: string): string[] {
  const pattern = specifierPattern(specifier)
  return sourceFiles(pkg)
    .filter((f) => pattern.test(readCode(f)))
    .map((f) => path.relative(PACKAGES_ROOT, f))
}

function allDeps(pkg: string): Record<string, string> {
  const json = JSON.parse(fs.readFileSync(path.join(PACKAGES_ROOT, pkg, 'package.json'), 'utf8'))
  return {
    ...json.dependencies,
    ...json.devDependencies,
    ...json.peerDependencies,
    ...json.optionalDependencies,
  }
}

describe('no package imports or depends on the retired @tour-kit/license', () => {
  it.each(PACKAGES)('@tour-kit/%s source never imports it', (pkg) => {
    expect(filesImporting(pkg, LICENCE)).toEqual([])
  })

  it.each(PACKAGES)('@tour-kit/%s package.json never depends on it', (pkg) => {
    expect(allDeps(pkg)).not.toHaveProperty(LICENCE)
  })
})

// Positive control. Without it, a walker that returns nothing (a wrong root, a
// broken recursion, an extension typo) would make every case above pass.
describe('positive control — the same scan does see real imports', () => {
  it('walks every package that ships, not an empty list', () => {
    for (const pkg of ['core', 'react', 'hints', 'surveys', 'vue', 'svelte']) {
      expect(PACKAGES).toContain(pkg)
    }
  })

  it.each(['react', 'hints', 'adoption', 'surveys', 'vue', 'svelte'])(
    '@tour-kit/%s source is found to import @tour-kit/core',
    (pkg) => {
      expect(sourceFiles(pkg).length).toBeGreaterThan(5)
      expect(filesImporting(pkg, '@tour-kit/core').length).toBeGreaterThan(0)
    }
  )

  it('the dependency reader sees a real dependency', () => {
    expect(allDeps('react')).toHaveProperty('@tour-kit/core')
  })
})
