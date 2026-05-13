import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(__dirname, '..', '..')
const MAIN_CJS = join(PKG_ROOT, 'dist', 'index.cjs')
const SETUP_CJS = join(PKG_ROOT, 'dist', 'setup.cjs')

const distExists = existsSync(MAIN_CJS) && existsSync(SETUP_CJS)

describe('entry points', () => {
  it.skipIf(!distExists)('CJS require of main entry resolves expectStepVisible', () => {
    const out = execFileSync(
      'node',
      ['-e', `process.stdout.write(typeof require(${JSON.stringify(MAIN_CJS)}).expectStepVisible)`],
      { encoding: 'utf8' }
    )
    expect(out).toBe('function')
  })

  it.skipIf(!distExists)('CJS require of ./setup resolves setupTourKitTesting', () => {
    const out = execFileSync(
      'node',
      [
        '-e',
        `process.stdout.write(typeof require(${JSON.stringify(SETUP_CJS)}).setupTourKitTesting)`,
      ],
      { encoding: 'utf8' }
    )
    expect(out).toBe('function')
  })

  // Phrase is split to avoid the grep matching this file's own description.
  it(`test files contain ZERO consumer-side ${'await' + ' ' + 'act'}(...) calls`, () => {
    // Headline contract — helpers wrap the flush internally; consumers must
    // never need to repeat the flush themselves.
    let out: string
    try {
      out = execFileSync(
        'grep',
        [
          '-rEc',
          '--include=*.ts',
          '--include=*.tsx',
          '--exclude=entry-points.test.ts',
          'await\\s+act\\b',
          'src/__tests__',
        ],
        {
          cwd: PKG_ROOT,
          encoding: 'utf8',
        }
      )
    } catch (e) {
      // grep exits 1 when no matches found across any file. The `-c` per-file
      // counts are still printed on stdout, so capture from the error.
      const err = e as { stdout?: string; status?: number }
      if (err.status === 1 && typeof err.stdout === 'string') {
        out = err.stdout
      } else {
        throw e
      }
    }
    const total = out
      .split('\n')
      .filter(Boolean)
      .reduce((sum, line) => sum + Number(line.split(':').at(-1) ?? 0), 0)
    expect(total).toBe(0)
  })
})
