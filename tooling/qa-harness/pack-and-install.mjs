#!/usr/bin/env node
// FIX→VERIFY pass: build @tour-kit/* from LOCAL source, pack each into a tarball,
// and install those tarballs into the QA dashboards. This is how a source fix in
// packages/<x>/src becomes verifiable in the running apps.
//
//   node tooling/qa-harness/pack-and-install.mjs              # rebuild+pack ALL, install
//   node tooling/qa-harness/pack-and-install.mjs react hints  # rebuild+pack only these
//                                                             # (reuse existing tarballs for the rest)
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { APPS, REPO_ROOT, TARBALL_DIR, TK_PACKAGES } from './lib.mjs'

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
for (const n of requested) {
  if (!TK_PACKAGES.includes(n)) {
    console.error(`Unknown package "${n}". Known: ${TK_PACKAGES.join(', ')}`)
    process.exit(1)
  }
}
const toBuild = requested.length ? requested : [...TK_PACKAGES]

mkdirSync(TARBALL_DIR, { recursive: true })

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })

const tarballFor = (name) => readdirSync(TARBALL_DIR).find((f) => f.startsWith(`tour-kit-${name}-`))

function buildAndPack(name) {
  console.log(`\n[qa-harness] build + pack @tour-kit/${name}…`)
  run('pnpm', ['build', '--filter', `@tour-kit/${name}`], REPO_ROOT)
  // Drop stale tarball(s) for this package, then pack fresh.
  for (const f of readdirSync(TARBALL_DIR)) {
    if (f.startsWith(`tour-kit-${name}-`)) rmSync(resolve(TARBALL_DIR, f))
  }
  run('pnpm', ['pack', '--pack-destination', TARBALL_DIR], resolve(REPO_ROOT, 'packages', name))
}

// Rebuild/repack the requested packages…
for (const name of toBuild) buildAndPack(name)
// …and pack any package that has never been packed (first run with a subset).
for (const name of TK_PACKAGES) if (!tarballFor(name)) buildAndPack(name)

const tarballs = TK_PACKAGES.map((name) => {
  const f = tarballFor(name)
  if (!f) throw new Error(`No tarball for @tour-kit/${name}`)
  return resolve(TARBALL_DIR, f)
})

for (const app of APPS) {
  if (!existsSync(app.dir)) {
    console.log(`[qa-harness] skip ${app.name} (missing)`)
    continue
  }
  console.log(`\n[qa-harness] installing local tarballs into ${app.name}…`)
  // Force fresh extraction: drop the previously-installed @tour-kit dirs so npm
  // re-unpacks the new tarball content for the same version.
  rmSync(resolve(app.dir, 'node_modules/@tour-kit'), { recursive: true, force: true })
  run('npm', ['install', '--no-audit', '--no-fund', ...tarballs], app.dir)
}

console.log('\n[qa-harness] FIX→VERIFY pass ready — apps consume LOCAL builds.')
