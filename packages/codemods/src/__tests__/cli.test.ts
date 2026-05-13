import { createHash } from 'node:crypto'
import { copyFileSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runMigrate } from '../cli'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')

function sha(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function snapshotDir(dir: string): Array<readonly [string, string]> {
  return readdirSync(dir)
    .sort()
    .map((name) => [name, sha(join(dir, name))] as const)
}

describe('CLI exit codes', () => {
  it('exits 2 on missing --from', async () => {
    const code = await runMigrate([FIXTURES])
    expect(code).toBe(2)
  })

  it('exits 2 on unsupported --from value', async () => {
    const code = await runMigrate(['--from', 'notreal', FIXTURES])
    expect(code).toBe(2)
  })

  it('exits 2 on unknown flag', async () => {
    const code = await runMigrate(['--from', 'joyride', '--bogus', FIXTURES])
    expect(code).toBe(2)
  })

  it('exits 3 when no paths provided', async () => {
    const code = await runMigrate(['--from', 'joyride'])
    expect(code).toBe(3)
  })

  it('exits 3 when path does not exist', async () => {
    const code = await runMigrate(['--from', 'joyride', '/non/existent/path/here'])
    expect(code).toBe(3)
  })

  it('exits 0 on a successful dry-run over the joyride corpus', async () => {
    const code = await runMigrate(['--from', 'joyride', '--dry-run', FIXTURES])
    expect(code).toBe(0)
  })
})

describe('CLI --dry-run safety (SHA comparison)', () => {
  it('does not modify any file on disk', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tk-dry-'))
    for (const f of readdirSync(FIXTURES)) {
      if (f.endsWith('.input.tsx')) {
        copyFileSync(join(FIXTURES, f), join(dir, f))
      }
    }
    const before = snapshotDir(dir)
    const code = await runMigrate(['--from', 'joyride', '--dry-run', dir])
    const after = snapshotDir(dir)
    expect(code).toBe(0)
    expect(after).toEqual(before)
  })
})
