import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'

const PACKAGES_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(PACKAGES_ROOT, '..')

/**
 * The nine published Pro packages. Their LICENSE.md is the contract the
 * pricing page, the legal terms page and the FAQs all quote — BSL 1.1 with a
 * stamped Change Date and an MIT Change License. This suite fails if any of
 * them regresses to the old "proprietary and confidential" boilerplate, which
 * contradicted every buyer-facing claim on the site (the contradiction that
 * motivated `plan/license-bsl-fix.md`).
 */
const PRO_PACKAGES = [
  'adoption',
  'ai',
  'analytics',
  'announcements',
  'checklists',
  'license',
  'media',
  'scheduling',
  'surveys',
] as const

/** Covered by the root MIT LICENSE; must stay outside the BSL story. */
const FREE_PACKAGES = ['core', 'react', 'hints'] as const

describe('license story consistency (BSL 1.1 Pro / MIT free)', () => {
  it.each(PRO_PACKAGES)(
    '%s/LICENSE.md ships BSL 1.1 with stamped fields, not proprietary boilerplate',
    (name) => {
      const text = fs.readFileSync(path.join(PACKAGES_ROOT, name, 'LICENSE.md'), 'utf8')
      expect(text).toMatch(/Business Source License 1\.1/)
      expect(text).toMatch(/^Licensor:\s+domidex01\s*$/m)
      expect(text).toMatch(
        new RegExp(`^Licensed Work:\\s+@tour-kit/${name} \\d+\\.\\d+\\.\\d+`, 'm')
      )
      expect(text).toMatch(/^Change Date:\s+\d{4}-\d{2}-\d{2}\s*$/m)
      expect(text).toMatch(/^Change License:\s+MIT\s*$/m)
      expect(text).not.toMatch(/proprietary/i)
      expect(text).not.toMatch(/confidential/i)
    }
  )

  it.each(PRO_PACKAGES)('%s points package.json license at LICENSE.md', (name) => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PACKAGES_ROOT, name, 'package.json'), 'utf8')
    ) as { license?: string; private?: boolean }
    expect(pkg.license).toBe('SEE LICENSE IN LICENSE.md')
    expect(pkg.private ?? false).toBe(false)
  })

  it('free packages stay covered by the root MIT LICENSE', () => {
    const root = fs.readFileSync(path.join(REPO_ROOT, 'LICENSE'), 'utf8')
    expect(root).toMatch(/MIT License/)
    for (const name of FREE_PACKAGES) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(PACKAGES_ROOT, name, 'package.json'), 'utf8')
      ) as { license?: string }
      expect(pkg.license).toBe('MIT')
    }
  })

  it('stamp script exists and is wired into the release chain', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'tooling/release/stamp-change-dates.mjs'))).toBe(true)
    const root = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>
    }
    expect(root.scripts?.release).toContain('stamp-change-dates.mjs')
    expect(root.scripts?.release?.indexOf('stamp-change-dates.mjs')).toBeLessThan(
      root.scripts?.release?.indexOf('changeset publish') ?? Number.POSITIVE_INFINITY
    )
  })
})
