#!/usr/bin/env node
// FIND pass: point the QA dashboards at the PUBLISHED npm packages and install
// them like a real consumer. Use this to reproduce bugs that ship to users.
//
//   node tooling/qa-harness/install-from-npm.mjs            # all apps, latest
//   node tooling/qa-harness/install-from-npm.mjs qa-next    # one app
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { APPS, TK_PACKAGES, setTkDeps } from './lib.mjs'

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const apps = only.length ? APPS.filter((a) => only.includes(a.name)) : APPS
if (!apps.length) {
  console.error(`No matching apps. Known: ${APPS.map((a) => a.name).join(', ')}`)
  process.exit(1)
}

function publishedVersion(name) {
  const v = execFileSync('npm', ['view', `@tour-kit/${name}`, 'version'], {
    encoding: 'utf8',
  }).trim()
  if (!v) throw new Error(`@tour-kit/${name} has no published version`)
  return v
}

console.log('[qa-harness] resolving latest published versions…')
const versions = Object.fromEntries(
  TK_PACKAGES.map((name) => {
    const v = publishedVersion(name)
    console.log(`  @tour-kit/${name.padEnd(13)} -> ${v}`)
    return [name, v]
  }),
)

for (const app of apps) {
  const pkgPath = resolve(app.dir, 'package.json')
  setTkDeps(pkgPath, (name) => versions[name])
  console.log(`\n[qa-harness] npm install (published) in ${app.name}…`)
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: app.dir,
    stdio: 'inherit',
  })
}

console.log('\n[qa-harness] FIND pass ready — apps consume PUBLISHED npm packages.')
