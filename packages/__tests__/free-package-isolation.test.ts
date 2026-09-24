import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
// Strips comments before scanning. `core/src/types/diagnostic.ts` names
// `@tour-kit/license` in a doc comment describing the extension contract —
// the invariant is what a module IMPORTS, not what it mentions.
import { readCode } from '../../tooling/bundle-check/engine-guard.mjs'

const PACKAGES_ROOT = path.resolve(__dirname, '..')

/**
 * Packages that must never import `@tour-kit/license`.
 *
 * This used to read `['core', 'react', 'hints', 'vue', 'svelte']` and was
 * named after a free tier that no longer exists — every package is now
 * BSL 1.1, so "free package" is not the reason any of these stay licence-free.
 * One structural reason survives, and it applies to exactly one package:
 *
 * - `core` cannot import the licence package because the licence package
 *   imports `core`. The rule here is a cycle guard, not a policy — and it is
 *   also what keeps `core/engine` React-free and core's 77 B of dist-gzip
 *   headroom intact.
 *
 * `react` and `hints` were removed when they started mounting `LicenseGate`,
 * which is the whole point of the licence-payment work — the badge reaching
 * the packages consumers actually install. `vue` and `svelte` followed when
 * they went public under BUSL-1.1: they have no React tree to portal a badge
 * from, so they start the DOM gate from `@tour-kit/license/headless` instead.
 * That entry is React-free, which is what keeps their `.d.ts` chains clean.
 */
const LICENCE_FREE_PACKAGES = ['core']

/** Packages that MUST import it — the positive control, so a broken scan fails. */
const LICENCE_GATED_PACKAGES = ['react', 'hints', 'vue', 'svelte']

function getAllFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      results.push(...getAllFiles(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

describe('Licence-free packages — zero @tour-kit/license imports', () => {
  for (const pkg of LICENCE_FREE_PACKAGES) {
    describe(`@tour-kit/${pkg}`, () => {
      it('has no @tour-kit/license references in source files', () => {
        const srcDir = path.join(PACKAGES_ROOT, pkg, 'src')
        const files = getAllFiles(srcDir, ['.ts', '.tsx'])

        for (const file of files) {
          const content = readCode(file)
          const relativePath = path.relative(PACKAGES_ROOT, file)
          expect(
            content.includes('@tour-kit/license'),
            `Found @tour-kit/license reference in ${relativePath}`
          ).toBe(false)
        }
      })

      it('has no @tour-kit/license in package.json dependencies', () => {
        const pkgJsonPath = path.join(PACKAGES_ROOT, pkg, 'package.json')
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))

        const allDeps = {
          ...pkgJson.dependencies,
          ...pkgJson.devDependencies,
          ...pkgJson.peerDependencies,
        }

        expect(allDeps).not.toHaveProperty('@tour-kit/license')
      })
    })
  }
})

// Positive control. Without this, deleting `getAllFiles`'s recursion or
// pointing PACKAGES_ROOT at an empty directory would make every assertion
// above pass vacuously.
describe('Licence-gated packages — the scan can actually see an import', () => {
  for (const pkg of LICENCE_GATED_PACKAGES) {
    describe(`@tour-kit/${pkg}`, () => {
      it('does reference @tour-kit/license in source', () => {
        const files = getAllFiles(path.join(PACKAGES_ROOT, pkg, 'src'), ['.ts', '.tsx'])
        expect(files.length).toBeGreaterThan(0)
        const hits = files.filter((f) => readCode(f).includes('@tour-kit/license'))
        expect(hits.length).toBeGreaterThan(0)
      })

      it('declares @tour-kit/license as a dependency', () => {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(PACKAGES_ROOT, pkg, 'package.json'), 'utf-8')
        )
        expect(pkgJson.dependencies).toHaveProperty('@tour-kit/license')
      })
    })
  }
})
