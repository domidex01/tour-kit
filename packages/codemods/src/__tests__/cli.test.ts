import { createHash } from 'node:crypto'
import { copyFileSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXPERIMENTAL_TRANSFORMS, runMigrate } from '../cli'

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

describe('CLI --help', () => {
  function captureConsole() {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const join = (spy: typeof log) => spy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
    return {
      get stdout(): string {
        return join(log)
      },
      get stderr(): string {
        return join(error)
      },
      restore: () => {
        log.mockRestore()
        error.mockRestore()
      },
    }
  }

  it('exits 0 on --help (help is success, not a usage error)', async () => {
    const c = captureConsole()
    const code = await runMigrate(['--help'])
    c.restore()
    expect(code).toBe(0)
  })

  it('exits 0 on the -h alias', async () => {
    const c = captureConsole()
    const code = await runMigrate(['-h'])
    c.restore()
    expect(code).toBe(0)
  })

  it('short-circuits before --from is required', async () => {
    // `--help` with no `--from` must still exit 0, not 2 (bad args).
    const c = captureConsole()
    const code = await runMigrate(['--help'])
    c.restore()
    expect(code).toBe(0)
  })

  it('prints usage once to stdout and nothing to stderr', async () => {
    const c = captureConsole()
    await runMigrate(['--help'])
    const { stdout, stderr } = c
    c.restore()
    expect(stdout).toMatch(/Usage: tour-kit-migrate/)
    // Regression guard: the old path threw UsageError and re-printed usage to
    // stderr with a spurious "usage error: help requested" line.
    expect(stderr).toBe('')
    expect(stdout.match(/Usage: tour-kit-migrate/g)).toHaveLength(1)
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

describe('CLI — TRANSFORMS map recognizes shepherd + driver', () => {
  // Exit 3 (no paths) proves the --from source is wired into the TRANSFORMS
  // map. Exit 2 (bad-args) would mean the source isn't registered.
  it('accepts --from shepherd (exits 3 on no paths)', async () => {
    const code = await runMigrate(['--from', 'shepherd'])
    expect(code).toBe(3)
  })
  it('accepts --from driver (exits 3 on no paths)', async () => {
    const code = await runMigrate(['--from', 'driver'])
    expect(code).toBe(3)
  })
})

describe('CLI — experimental warnings', () => {
  function captureStderr() {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    return {
      get text(): string {
        return spy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
      },
      restore: () => spy.mockRestore(),
    }
  }

  const SHEPHERD_FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'shepherd')
  const DRIVER_FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'driver')
  const fixturesByName: Record<string, string> = {
    joyride: FIXTURES,
    shepherd: SHEPHERD_FIXTURES,
    driver: DRIVER_FIXTURES,
  }

  it('prints an experimental warning + percentage when --from is flagged experimental', async () => {
    if (EXPERIMENTAL_TRANSFORMS.size === 0) {
      // No transform is flagged — the suite shipped both at ≥80% so there's
      // nothing to warn about. The remaining tests in this describe still
      // assert the negative path.
      return
    }
    const flagged = [...EXPERIMENTAL_TRANSFORMS][0]
    if (!flagged) return
    const path = fixturesByName[flagged] ?? FIXTURES
    const stderr = captureStderr()
    await runMigrate(['--from', flagged, '--dry-run', path])
    expect(stderr.text).toMatch(/experimental/i)
    expect(stderr.text).toMatch(/\d+%/)
    stderr.restore()
  })

  it('does NOT print the experimental warning for non-flagged sources', async () => {
    const stable = (['joyride', 'shepherd', 'driver'] as const).filter(
      (s) => !EXPERIMENTAL_TRANSFORMS.has(s)
    )
    if (stable.length === 0) return
    const sample = stable[0]
    const path = fixturesByName[sample] ?? FIXTURES
    const stderr = captureStderr()
    await runMigrate(['--from', sample, '--dry-run', path])
    expect(stderr.text).not.toMatch(/experimental/i)
    stderr.restore()
  })
})
