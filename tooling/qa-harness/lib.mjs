// Shared constants + helpers for the tour-kit QA harness.
//
// The QA dashboards (examples/qa-next, examples/qa-vite) are deliberately
// EXCLUDED from the pnpm workspace (see pnpm-workspace.yaml) so they install
// @tour-kit/* like a real external consumer would — from npm, or from local
// tarballs — instead of getting workspace symlinks for free.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '../..')
export const TARBALL_DIR = resolve(HERE, '.tarballs')

// Short name === packages/<name> dir === @tour-kit/<name> npm name.
// Order matters: dependencies before dependents so `pnpm pack` sees fresh deps.
export const TK_PACKAGES = [
  'core',
  'license',
  'analytics',
  'react',
  'hints',
  'adoption',
  'announcements',
  'checklists',
  'media',
  'scheduling',
  'surveys',
  'ai',
]

export const APPS = [
  { name: 'qa-next', dir: resolve(REPO_ROOT, 'examples/qa-next') },
  { name: 'qa-vite', dir: resolve(REPO_ROOT, 'examples/qa-vite') },
]

export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeJSON(path, obj) {
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`)
}

/** Rewrite every @tour-kit/* dependency in a package.json using specFor(name). */
export function setTkDeps(pkgJsonPath, specFor) {
  const pkg = readJSON(pkgJsonPath)
  pkg.dependencies ??= {}
  for (const name of TK_PACKAGES) {
    pkg.dependencies[`@tour-kit/${name}`] = specFor(name)
  }
  writeJSON(pkgJsonPath, pkg)
  return pkg
}
