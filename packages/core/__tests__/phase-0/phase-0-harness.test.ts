import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot, run, withTempDir, writeFile } from './_helpers'

const REPO = repoRoot()
const SELFTEST = 'packages/core/src/__tests__/types/harness-selftest.test-d.ts'

// Shelling out to pnpm + tsc easily exceeds the default 5s under parallel load.
const SHELL_TIMEOUT_MS = 60_000

describe('Phase 0 — type-test harness', () => {
  it(
    'typecheck:types exits 0 on the committed selftest',
    () => {
      const r = run('pnpm --filter @tour-kit/core typecheck:types', { cwd: REPO })
      expect(r.code, `stderr:\n${r.stderr}\nstdout:\n${r.stdout}`).toBe(0)
    },
    SHELL_TIMEOUT_MS
  )

  it(
    'typecheck:types exits non-zero when @ts-expect-error is removed from a scratch copy',
    () => {
      const committed = readFileSync(join(REPO, SELFTEST), 'utf8')
      const broken = committed.replace(/\s*\/\/\s*@ts-expect-error[^\n]*/g, '')
      expect(broken).not.toBe(committed)

      withTempDir((dir) => {
        const scratchFile = join(dir, 'harness-broken.test-d.ts')
        writeFile(scratchFile, broken)
        const scratchTsconfig = join(dir, 'tsconfig.json')
        const scratchConfig = {
          extends: join(REPO, 'packages/core/tsconfig.type-tests.json'),
          compilerOptions: { rootDir: '.' },
          include: [scratchFile],
          exclude: ['node_modules'],
        }
        writeFile(scratchTsconfig, JSON.stringify(scratchConfig, null, 2))
        const r = run(`pnpm exec tsc --noEmit --project "${scratchTsconfig}"`, { cwd: REPO })
        expect(r.code).not.toBe(0)
        expect(r.stdout + r.stderr).toMatch(/Type 'string' is not assignable to type 'number'/)
      })
    },
    SHELL_TIMEOUT_MS
  )
})
