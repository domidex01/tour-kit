import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Integration test: runs the real Biome CLI from the workspace against
// fixture files. Validates that our biome.json `noConsole` rule + overrides
// produce the correct pass/fail behavior for the production gate.

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..')

describe('Biome noConsole rule + overrides (integration)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'biome-noconsole-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('flags console.warn in an arbitrary non-overridden source file', () => {
    const file = join(dir, 'fixture.ts')
    writeFileSync(file, "console.warn('should fail noConsole')\n")
    let exitCode = 0
    try {
      execSync(`pnpm --silent exec biome lint ${file}`, {
        cwd: REPO_ROOT,
        stdio: 'pipe',
      })
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1
    }
    expect(exitCode).not.toBe(0)
  })

  it('locks the override list to documented preserve + exempt paths', () => {
    // Memory #208 / phase-2.md: the override list is the contract.
    // If a maintainer "fixes" a file by routing through logger but forgets
    // to drop the override, the file ends up too permissive. Conversely,
    // if they drop a path that still has loud-by-design console.*,
    // pnpm lint breaks. This test pins both sides.
    const config = readFileSync(join(REPO_ROOT, 'tooling/biome/biome.json'), 'utf-8')

    // Preserve list — must remain in the override include array
    expect(config).toMatch(/packages\/core\/src\/utils\/logger\.ts/)
    expect(config).toMatch(/packages\/core\/src\/lib\/interpolate\.ts/)
    expect(config).toMatch(/packages\/core\/src\/context\/tour-provider\.tsx/)
    expect(config).toMatch(/packages\/analytics\/src\/plugins\/console\.ts/)
    expect(config).toMatch(/packages\/license\/src\/components\/license-test-mode\.tsx/)
    expect(config).toMatch(/packages\/license\/src\/components\/license-warning\.tsx/)
    expect(config).toMatch(/packages\/license\/src\/components\/pro-gate\.tsx/)
    expect(config).toMatch(/packages\/license\/src\/lib\/domain\.ts/)

    // Exempt CLI surfaces
    expect(config).toMatch(/packages\/codemods\/src\/cli\.ts/)
    expect(config).toMatch(/packages\/codemods\/src\/bin/)

    // Rule itself must be present at error level
    expect(config).toMatch(/"noConsole":\s*\{[^}]*"level":\s*"error"/)
  })
})
