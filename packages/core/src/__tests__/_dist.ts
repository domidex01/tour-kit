/**
 * Shared `dist/` path helpers for build-dependent tests (bundle hygiene,
 * subpath resolution). Tests that import this file MUST guard with
 * `distExists()` and `it.skip(...)` so local-dev test runs don't fail
 * before the package has been built.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PKG_ROOT = join(__dirname, '..', '..')

export const MAIN_MJS = join(PKG_ROOT, 'dist', 'index.js')
export const MAIN_CJS = join(PKG_ROOT, 'dist', 'index.cjs')
export const SCHEMAS_MJS = join(PKG_ROOT, 'dist', 'schemas', 'index.js')
export const SCHEMAS_CJS = join(PKG_ROOT, 'dist', 'schemas', 'index.cjs')

export function readMainBundle(): string {
  if (!existsSync(MAIN_MJS)) {
    throw new Error(`Run \`pnpm --filter @tour-kit/core build\` first — ${MAIN_MJS} missing.`)
  }
  return readFileSync(MAIN_MJS, 'utf8')
}

export function readMainBundleCjs(): string {
  if (!existsSync(MAIN_CJS)) {
    throw new Error(`Run \`pnpm --filter @tour-kit/core build\` first — ${MAIN_CJS} missing.`)
  }
  return readFileSync(MAIN_CJS, 'utf8')
}

export function distExists(): boolean {
  return existsSync(MAIN_MJS) && existsSync(SCHEMAS_MJS) && existsSync(SCHEMAS_CJS)
}
