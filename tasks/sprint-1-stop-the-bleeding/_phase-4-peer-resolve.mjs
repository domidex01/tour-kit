// Phase 4: assert every `catalog:` reference in packages/*/package.json
// resolves against the `catalog:` block in pnpm-workspace.yaml.
// Exits 0 if every catalog reference has a matching entry; 1 otherwise.
//
// Avoids a `yaml` dependency: pnpm-workspace.yaml's catalog block is a flat
// key→version map, parseable with a 10-line regex.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function parseCatalogBlock(yamlText) {
  // Find the `catalog:` block and collect `  key: value` (one indent level).
  const lines = yamlText.split(/\r?\n/)
  const catalog = {}
  let inCatalog = false
  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true
      continue
    }
    if (!inCatalog) continue
    if (/^\S/.test(line)) {
      // Top-level key — left the catalog block.
      inCatalog = false
      continue
    }
    // Match `  "@scope/pkg": ^1.2.3` or `  pkg: ^1.2.3` (no nested objects in catalog).
    const m = line.match(/^\s+"?([^"\s:]+)"?:\s*(.+?)\s*$/)
    if (m) catalog[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return catalog
}

const catalog = parseCatalogBlock(readFileSync('pnpm-workspace.yaml', 'utf8'))

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
          if (!catalog[name]) {
            process.stderr.write(
              `FAIL ${pkgPath} ${section}.${name}: catalog: but no catalog entry in pnpm-workspace.yaml\n`
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
