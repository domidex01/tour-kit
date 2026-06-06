// Generates the Agent Skills Discovery index (RFC v0.2.0, cloudflare/agent-skills-discovery-rfc)
// from the user-tour-kit Claude plugin skills.
//
// Source of truth: <repo-root>/user-tour-kit/skills/*/SKILL.md
// Output:          public/.well-known/agent-skills/<name>/SKILL.md (verbatim copies)
//                  public/.well-known/agent-skills/index.json (with sha256 digests)
//
// Runs in prebuild (see package.json); output is committed so the dev server
// serves it without a build. Re-run after editing any plugin skill:
//   pnpm generate:agent-skills

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = join(__dirname, '../../../user-tour-kit/skills')
const OUT_DIR = join(__dirname, '../public/.well-known/agent-skills')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fields = {}
  // Frontmatter here is flat `key: value` pairs (values may contain colons).
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(':')
    if (sep === -1 || /^\s/.test(line)) continue
    fields[line.slice(0, sep).trim()] = line.slice(sep + 1).trim()
  }
  return fields
}

const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const skills = []

rmSync(OUT_DIR, { recursive: true, force: true })

for (const dir of skillDirs) {
  const raw = readFileSync(join(SKILLS_DIR, dir, 'SKILL.md'), 'utf-8')
  const { name = dir, description } = parseFrontmatter(raw)
  if (!description) {
    console.error(`✖ ${dir}/SKILL.md has no description in frontmatter`)
    process.exit(1)
  }

  mkdirSync(join(OUT_DIR, name), { recursive: true })
  writeFileSync(join(OUT_DIR, name, 'SKILL.md'), raw)

  skills.push({
    name,
    type: 'skill-md',
    description,
    url: `/.well-known/agent-skills/${name}/SKILL.md`,
    digest: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  })
}

const index = {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills,
}

writeFileSync(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
console.log(`✔ agent-skills index: ${skills.length} skills → public/.well-known/agent-skills/`)
