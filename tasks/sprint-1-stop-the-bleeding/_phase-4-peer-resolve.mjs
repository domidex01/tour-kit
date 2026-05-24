// Phase 4: assert every `catalog:` reference in packages/*/package.json
// resolves against the `catalog:` block in pnpm-workspace.yaml.
// Exits 0 if every catalog reference has a matching entry; 1 otherwise.
//
// Avoids a `yaml` dependency: pnpm-workspace.yaml's catalog block is a flat
// key→version map, parseable with a 10-line regex.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function parseCatalogKeys(yamlText) {
  // Collect the set of package names listed under the `catalog:` block.
  // We only care about presence — the resolved version is pnpm's job.
  const keys = new Set()
  let inCatalog = false
  for (const line of yamlText.split(/\r?\n/)) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true
      continue
    }
    if (!inCatalog) continue
    if (/^\S/.test(line)) {
      inCatalog = false
      continue
    }
    // Match `  "@scope/pkg":` or `  pkg:` — the value side is ignored.
    const m = line.match(/^\s+"?([^"\s:]+)"?:/)
    if (m) keys.add(m[1])
  }
  return keys
}

const catalogKeys = parseCatalogKeys(readFileSync('pnpm-workspace.yaml', 'utf8'))

const pkgDirs = readdirSync('packages').filter(
  (d) =>
    statSync(join('packages', d)).isDirectory() && existsSync(join('packages', d, 'package.json'))
)

let fails = 0
let checked = 0
for (const dir of pkgDirs) {
  const pkgPath = join('packages', dir, 'package.json')
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    for (const section of ['dependencies', 'peerDependencies', 'devDependencies']) {
      const block = pkg[section] ?? {}
      for (const [name, range] of Object.entries(block)) {
        if (range === 'catalog:') {
          checked++
          if (!catalogKeys.has(name)) {
            const known = [...catalogKeys].join(', ')
            process.stderr.write(
              `FAIL ${pkgPath} ${section}.${name}: catalog: but no entry in pnpm-workspace.yaml (known: ${known})\n`
            )
            fails++
          }
        }
      }
    }
  } catch (e) {
    process.stderr.write(`Cannot read ${pkgPath}: ${e.message}\n`)
    fails++
  }
}

if (fails === 0) {
  process.stdout.write(`OK ${checked} catalog: references resolve to a catalog entry.\n`)
}
process.exit(fails === 0 ? 0 : 1)
