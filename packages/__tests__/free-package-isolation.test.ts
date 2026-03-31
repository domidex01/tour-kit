import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'

const PACKAGES_ROOT = path.resolve(__dirname, '..')
const FREE_PACKAGES = ['core', 'react', 'hints']

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

describe('Free package isolation — zero @tour-kit/license imports', () => {
  for (const pkg of FREE_PACKAGES) {
    describe(`@tour-kit/${pkg}`, () => {
      it('has no @tour-kit/license references in source files', () => {
        const srcDir = path.join(PACKAGES_ROOT, pkg, 'src')
        const files = getAllFiles(srcDir, ['.ts', '.tsx'])

        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
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
