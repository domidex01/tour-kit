#!/usr/bin/env node
// Stamps the Change Date (publication date + 4 years, the BSL 1.1 maximum) and the
// Licensed Work version (from package.json) into every Pro package's LICENSE.md.
// Runs inside `pnpm release` immediately before `changeset publish`, so each
// published tarball carries its own current Change Date and version.
// ponytail: assumes the Pro release train moves in lockstep — all 9 packages get
// the same stamp regardless of which are being published. If trains ever split,
// parse the changeset publish manifest instead.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PRO_PACKAGES = [
  'adoption',
  'ai',
  'analytics',
  'announcements',
  'checklists',
  'license',
  'media',
  'scheduling',
  'surveys',
]

const stamp = new Date()
stamp.setFullYear(stamp.getFullYear() + 4)
const changeDate = stamp.toISOString().slice(0, 10)

let failed = false
for (const name of PRO_PACKAGES) {
  const file = join('packages', name, 'LICENSE.md')
  const text = readFileSync(file, 'utf8')
  const version = JSON.parse(readFileSync(join('packages', name, 'package.json'), 'utf8')).version

  if (!/^Change Date:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(text)) {
    console.error(`ERROR: ${file} has no "Change Date: <ISO date>" line — refusing to publish`)
    failed = true
    continue
  }

  const next = text
    .replace(/^Licensed Work:.*$/m, `Licensed Work:        @tour-kit/${name} ${version}`)
    .replace(/^Change Date:.*$/m, `Change Date:          ${changeDate}`)
  writeFileSync(file, next)
}

if (failed) process.exit(1)
console.log(
  `Stamped Change Date ${changeDate} and current versions in ${PRO_PACKAGES.length} Pro LICENSE.md files`
)
