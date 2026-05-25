import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const BIN = join(__dirname, '..', '..', 'dist', 'bin', 'tour-kit-migrate.cjs')
const skipUnlessBuilt = existsSync(BIN) ? it : it.skip

function run(args: string[]): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [BIN, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (e) {
    const err = e as { status?: number | null; stdout?: Buffer | string; stderr?: Buffer | string }
    return {
      code: err.status ?? 1,
      stdout: String(err.stdout ?? ''),
      stderr: String(err.stderr ?? ''),
    }
  }
}

describe('bin smoke (gated on dist/bin/tour-kit-migrate.cjs existing)', () => {
  skipUnlessBuilt('exits 2 when --from value is unrecognized', () => {
    const r = run(['--from', 'foo', './does-not-matter'])
    expect(r.code).toBe(2)
  })

  skipUnlessBuilt('exits 2 with no args', () => {
    const r = run([])
    expect(r.code).toBe(2)
  })

  skipUnlessBuilt('exits 3 when --from joyride has no paths', () => {
    const r = run(['--from', 'joyride'])
    expect(r.code).toBe(3)
  })

  skipUnlessBuilt('exits 0 on --help and prints usage to stdout', () => {
    const r = run(['--help'])
    expect(r.code).toBe(0)
    expect(r.stdout).toMatch(/Usage: tour-kit-migrate/)
    expect(r.stderr).toBe('')
  })
})
