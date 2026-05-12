import { type ExecSyncOptions, execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface RunResult {
  code: number
  stdout: string
  stderr: string
}

export function run(cmd: string, opts: ExecSyncOptions = {}): RunResult {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    })
    return { code: 0, stdout: String(stdout), stderr: '' }
  } catch (e) {
    const err = e as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string }
    return {
      code: err.status ?? 1,
      stdout: err.stdout ? String(err.stdout) : '',
      stderr: err.stderr ? String(err.stderr) : '',
    }
  }
}

export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'phase-0-'))
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function writeFile(path: string, contents: string): void {
  writeFileSync(path, contents, 'utf8')
}

export function repoRoot(cwd: string = process.cwd()): string {
  let dir = cwd
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = join(dir, 'package.json')
      const json = JSON.parse(require('node:fs').readFileSync(pkg, 'utf8'))
      if (json.name === 'tour-kit') return dir
    } catch {
      // keep walking
    }
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return cwd
}
