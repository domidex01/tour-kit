import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const guardScript = resolve(here, '../../scripts/check-license-test-mode.mjs')

const IMPORT_LINE = `import { LicenseTestMode } from '@tour-kit/license'\n`

function fixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'license-guard-'))
  mkdirSync(join(dir, 'src'))
  mkdirSync(join(dir, 'src', '__tests__'))
  mkdirSync(join(dir, 'examples'))
  return dir
}

function runGuard(cwd: string) {
  return spawnSync('node', [guardScript], { cwd, encoding: 'utf8' })
}

describe('check-license-test-mode.mjs', () => {
  it('rejects LicenseTestMode imports from application source', () => {
    const dir = fixtureDir()
    writeFileSync(join(dir, 'src', 'app.tsx'), IMPORT_LINE)
    const result = runGuard(dir)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('LicenseTestMode')
    expect(result.stderr).toContain('may only be imported')
  })

  it('allows imports from __tests__ paths', () => {
    const dir = fixtureDir()
    writeFileSync(join(dir, 'src', '__tests__', 'foo.test.tsx'), IMPORT_LINE)
    const result = runGuard(dir)
    expect(result.status).toBe(0)
  })

  it('allows imports from examples/ paths', () => {
    const dir = fixtureDir()
    writeFileSync(join(dir, 'examples', 'app.tsx'), IMPORT_LINE)
    const result = runGuard(dir)
    expect(result.status).toBe(0)
  })

  it('allows imports from *.stories.tsx files', () => {
    const dir = fixtureDir()
    writeFileSync(join(dir, 'src', 'Demo.stories.tsx'), IMPORT_LINE)
    const result = runGuard(dir)
    expect(result.status).toBe(0)
  })

  it('allows imports from *.story.tsx files', () => {
    const dir = fixtureDir()
    writeFileSync(join(dir, 'src', 'Demo.story.tsx'), IMPORT_LINE)
    const result = runGuard(dir)
    expect(result.status).toBe(0)
  })
})
