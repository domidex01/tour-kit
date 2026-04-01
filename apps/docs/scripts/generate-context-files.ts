/**
 * generate-context-files.ts
 *
 * Generates plain-text context files for each User Tour Kit package.
 * These files are designed to be copy-pasted into LLM conversations
 * (ChatGPT, Claude, Gemini) so the LLM has accurate API knowledge.
 *
 * Template structure per file:
 *   - Header (package name, version, generation date)
 *   - Overview (from package.json description)
 *   - Installation (npm/pnpm install + peer deps)
 *   - Exports (grouped: types, hooks, components, utilities)
 *   - Types (full interface/type definitions with JSDoc)
 *   - Hooks (signatures with param/return types)
 *   - Components (signatures with prop types)
 *   - Examples (2-3 from MDX docs)
 *
 * Run: npx tsx apps/docs/scripts/generate-context-files.ts
 *   or: pnpm --filter docs generate:context
 */

import fs from 'node:fs'
import path from 'node:path'

// ─── Configuration ───────────────────────────────────────────────

const PACKAGES = [
  'core',
  'react',
  'hints',
  'adoption',
  'analytics',
  'announcements',
  'checklists',
  'media',
  'scheduling',
] as const

type PackageName = (typeof PACKAGES)[number]

// Support MONOREPO_ROOT env var override for running from outside the project tree
const SCRIPT_DIR = __dirname
const DOCS_ROOT = process.env.DOCS_ROOT || path.resolve(SCRIPT_DIR, '..')
const MONOREPO_ROOT = process.env.MONOREPO_ROOT || path.resolve(DOCS_ROOT, '../..')
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve(DOCS_ROOT, 'public/context')
const CONTENT_DIR = path.resolve(DOCS_ROOT, 'content/docs')

const MAX_LINES = 500
const MAX_EXAMPLES = 3

// ─── Types ───────────────────────────────────────────────────────

interface ExportEntry {
  name: string
  kind: 'type' | 'interface' | 'function' | 'component' | 'const' | 'unknown'
  signature: string
  jsdoc: string
}

interface CodeExample {
  title: string
  code: string
}

interface PackageInfo {
  name: PackageName
  fullName: string
  version: string
  description: string
  peerDeps: Record<string, string>
  exports: ExportEntry[]
  typeDefinitions: string[]
  examples: CodeExample[]
}

// ─── File reading helpers ────────────────────────────────────────

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function safeReadDir(dirPath: string, recursive = false): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { recursive })
    return entries.map((e) => String(e))
  } catch {
    return []
  }
}

// ─── Export path resolution ──────────────────────────────────────

function resolveExportPath(indexDir: string, relativePath: string): string | null {
  const base = path.resolve(indexDir, relativePath)
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const full = base + ext
    if (fs.existsSync(full)) return full
  }
  return null
}

// ─── Extraction: exports from index.ts ───────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: export parsing requires many conditional branches
function extractExportsFromIndex(indexPath: string): {
  entries: ExportEntry[]
  reExportPaths: string[]
} {
  const source = safeReadFile(indexPath)
  if (!source) return { entries: [], reExportPaths: [] }

  const entries: ExportEntry[] = []
  const reExportPaths: string[] = []
  const indexDir = path.dirname(indexPath)

  // Re-exports: export { Foo, Bar } from './module'
  const reExportRegex = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null = reExportRegex.exec(source)
  while (match !== null) {
    const names = match[1].split(',').map((n) => {
      const trimmed = n.trim()
      // Handle "type Foo" prefix inside braces
      return trimmed.replace(/^type\s+/, '')
    })
    const modulePath = match[2]
    const isTypeOnly = match[0].startsWith('export type')

    for (const name of names) {
      if (!name) continue
      entries.push({
        name,
        kind:
          isTypeOnly || /^[A-Z].*(?:Props|Config|State|Options|Value|Return|Variants)$/.test(name)
            ? 'type'
            : name.startsWith('use')
              ? 'function'
              : /^[A-Z]/.test(name)
                ? 'component'
                : 'const',
        signature: '',
        jsdoc: '',
      })
    }

    if (modulePath.startsWith('.')) {
      const resolved = resolveExportPath(indexDir, modulePath)
      if (resolved) reExportPaths.push(resolved)
    }
    match = reExportRegex.exec(source)
  }

  // Direct exports: export function foo / export const foo / export interface Foo
  const directRegex = /export\s+(type|interface|function|const)\s+(\w+)/g
  match = directRegex.exec(source)
  while (match !== null) {
    const kind = match[1] as ExportEntry['kind']
    const name = match[2]
    if (!entries.some((e) => e.name === name)) {
      entries.push({ name, kind, signature: '', jsdoc: '' })
    }
    match = directRegex.exec(source)
  }

  return { entries, reExportPaths }
}

// ─── Extraction: type/interface definitions ──────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: type extraction requires nested brace counting
function extractTypeDefinitions(filePaths: string[]): string[] {
  const definitions: string[] = []
  const seen = new Set<string>()

  for (const filePath of filePaths) {
    const source = safeReadFile(filePath)
    if (!source) continue

    // Match exported interfaces with optional JSDoc
    const interfaceRegex =
      /(\/\*\*[\s\S]*?\*\/\s*)?export\s+interface\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+[^{]*)?\s*\{/g
    let match: RegExpExecArray | null = interfaceRegex.exec(source)
    while (match !== null) {
      const name = match[2]
      if (seen.has(name)) {
        match = interfaceRegex.exec(source)
        continue
      }
      seen.add(name)

      // Find the closing brace by counting braces
      const startIdx = match.index
      let braceCount = 0
      let endIdx = startIdx
      let foundOpen = false
      for (let i = startIdx; i < source.length; i++) {
        if (source[i] === '{') {
          braceCount++
          foundOpen = true
        } else if (source[i] === '}') {
          braceCount--
          if (foundOpen && braceCount === 0) {
            endIdx = i + 1
            break
          }
        }
      }
      if (endIdx > startIdx) {
        definitions.push(source.slice(startIdx, endIdx).trim())
      }
      match = interfaceRegex.exec(source)
    }

    // Match exported type aliases with optional JSDoc
    const typeRegex = /(\/\*\*[\s\S]*?\*\/\s*)?export\s+type\s+(\w+)(?:<[^>]*>)?\s*=\s*/g
    match = typeRegex.exec(source)
    while (match !== null) {
      const name = match[2]
      if (seen.has(name)) {
        match = typeRegex.exec(source)
        continue
      }
      seen.add(name)

      // Find the end of the type (semicolon or newline after last line)
      const startIdx = match.index
      let endIdx = source.indexOf('\n\n', match.index + match[0].length)
      if (endIdx === -1) endIdx = source.length

      // Try to find a semicolon-terminated statement
      const semiIdx = source.indexOf(';', match.index + match[0].length)
      if (semiIdx !== -1 && semiIdx < endIdx) {
        endIdx = semiIdx + 1
      }

      definitions.push(source.slice(startIdx, endIdx).trim())
      match = typeRegex.exec(source)
    }
  }

  return definitions
}

// ─── Extraction: function/hook signatures ────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: signature extraction requires multiple regex passes
function extractFunctionSignatures(
  filePaths: string[],
  exportNames: string[]
): Map<string, { signature: string; jsdoc: string }> {
  const result = new Map<string, { signature: string; jsdoc: string }>()
  const hookAndFnNames = new Set(exportNames.filter((n) => /^use[A-Z]|^[a-z]/.test(n)))

  for (const filePath of filePaths) {
    const source = safeReadFile(filePath)
    if (!source) continue

    // Match exported functions with optional JSDoc
    const fnRegex =
      /(\/\*\*[\s\S]*?\*\/\s*)?export\s+(?:default\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^\n{]+))?/g
    let match: RegExpExecArray | null = fnRegex.exec(source)
    while (match !== null) {
      const jsdoc = (match[1] || '').trim()
      const name = match[2]
      const generics = match[3] || ''
      const params = match[4].trim()
      const returnType = (match[5] || '').trim()

      if (hookAndFnNames.has(name) || exportNames.includes(name)) {
        const sig = `${name}${generics}(${params})${returnType ? `: ${returnType}` : ''}`
        result.set(name, { signature: sig, jsdoc })
      }
      match = fnRegex.exec(source)
    }

    // Also match arrow function exports: export const useFoo = (...) => ...
    const arrowRegex =
      /(\/\*\*[\s\S]*?\*\/\s*)?export\s+const\s+(\w+)\s*=\s*(?:<[^>]*>\s*)?\(([^)]*)\)(?:\s*:\s*([^\n=>{]+))?\s*=>/g
    match = arrowRegex.exec(source)
    while (match !== null) {
      const jsdoc = (match[1] || '').trim()
      const name = match[2]
      const params = match[3].trim()
      const returnType = (match[4] || '').trim()

      if (hookAndFnNames.has(name) || exportNames.includes(name)) {
        if (!result.has(name)) {
          const sig = `${name}(${params})${returnType ? `: ${returnType}` : ''}`
          result.set(name, { signature: sig, jsdoc })
        }
      }
      match = arrowRegex.exec(source)
    }
  }

  return result
}

// ─── Extraction: examples from MDX ──────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: example extraction with filtering logic
function extractExamplesFromMdx(pkgName: string): CodeExample[] {
  const docsDir = path.join(CONTENT_DIR, pkgName)
  const mdxFiles = safeReadDir(docsDir, true).filter((f) => f.endsWith('.mdx'))

  const examples: CodeExample[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g

  for (const file of mdxFiles) {
    const filePath = path.join(docsDir, file)
    const content = safeReadFile(filePath)
    if (!content) continue

    let match: RegExpExecArray | null = codeBlockRegex.exec(content)
    while (match !== null) {
      const lang = match[1] ?? ''
      const code = match[2].trim()

      // Only include substantial tsx/ts/jsx examples (>5 lines)
      if (code.split('\n').length >= 5 && ['tsx', 'ts', 'jsx'].includes(lang)) {
        // Skip import-only blocks or config-only blocks
        if (code.split('\n').every((l) => l.startsWith('import ') || l.trim() === '')) continue

        // Derive title from nearest heading above the code block
        const beforeBlock = content.slice(0, match.index)
        const headings = beforeBlock.match(/^#{1,3}\s+(.+)$/gm)
        const lastHeading = headings?.pop()?.replace(/^#+\s+/, '') ?? 'Usage Example'

        examples.push({ title: lastHeading, code })
      }

      if (examples.length >= MAX_EXAMPLES) break
      match = codeBlockRegex.exec(content)
    }
    if (examples.length >= MAX_EXAMPLES) break
  }

  return examples.slice(0, MAX_EXAMPLES)
}

// ─── Read package metadata ───────────────────────────────────────

function readPackageInfo(pkgName: PackageName): PackageInfo {
  const pkgDir = path.join(MONOREPO_ROOT, 'packages', pkgName)
  const pkgJsonPath = path.join(pkgDir, 'package.json')
  const pkgJson = safeReadFile(pkgJsonPath)

  let version = '0.0.0'
  let description = ''
  let peerDeps: Record<string, string> = {}
  let fullName = `@tour-kit/${pkgName}`

  if (pkgJson) {
    try {
      const parsed = JSON.parse(pkgJson)
      version = parsed.version || version
      description = parsed.description || ''
      peerDeps = parsed.peerDependencies || {}
      fullName = parsed.name || fullName
    } catch {
      // ignore parse errors
    }
  }

  // Extract exports from index.ts
  const indexPath = path.join(pkgDir, 'src', 'index.ts')
  const { entries, reExportPaths } = extractExportsFromIndex(indexPath)

  // Collect all source files to scan
  const allSourceFiles = [indexPath, ...reExportPaths]

  // Extract type definitions
  const typeDefinitions = extractTypeDefinitions(allSourceFiles)

  // Extract function signatures and enrich export entries
  const exportNames = entries.map((e) => e.name)
  const fnSigs = extractFunctionSignatures(allSourceFiles, exportNames)

  for (const entry of entries) {
    const sig = fnSigs.get(entry.name)
    if (sig) {
      entry.signature = sig.signature
      entry.jsdoc = sig.jsdoc
    }
  }

  // Extract examples from MDX docs
  const examples = extractExamplesFromMdx(pkgName)

  return {
    name: pkgName,
    fullName,
    version,
    description,
    peerDeps,
    exports: entries,
    typeDefinitions,
    examples,
  }
}

// ─── Assemble context file ──────────────────────────────────────

function fencedToIndented(code: string): string {
  return code
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
}

function formatJsdoc(jsdoc: string): string {
  if (!jsdoc) return ''
  // Extract the description from JSDoc, stripping comment syntax
  return jsdoc
    .replace(/\/\*\*\s*/, '')
    .replace(/\s*\*\//, '')
    .replace(/^\s*\*\s?/gm, '')
    .trim()
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: template assembly with many sections
function assembleContextFile(info: PackageInfo): string {
  const lines: string[] = []
  const date = new Date().toISOString().split('T')[0]

  // ── Header ──
  lines.push(`User Tour Kit — ${info.fullName} Context File`)
  lines.push(`Version: ${info.version} | Generated: ${date}`)
  lines.push(`Paste this into your LLM to get accurate answers about ${info.fullName}.`)
  lines.push('='.repeat(73))
  lines.push('')

  // ── Overview ──
  lines.push('OVERVIEW')
  lines.push('--------')
  lines.push(info.description || `${info.fullName} package for User Tour Kit.`)
  lines.push('')

  // ── Installation ──
  lines.push('INSTALLATION')
  lines.push('------------')
  lines.push(`    npm install ${info.fullName}`)
  lines.push('    # or')
  lines.push(`    pnpm add ${info.fullName}`)
  lines.push('')

  if (Object.keys(info.peerDeps).length > 0) {
    lines.push('Peer dependencies:')
    for (const [dep, ver] of Object.entries(info.peerDeps)) {
      lines.push(`    ${dep}: ${ver}`)
    }
    lines.push('')
  }

  // ── Exports ──
  lines.push('EXPORTS')
  lines.push('-------')

  const typeExports = info.exports.filter((e) => e.kind === 'type' || e.kind === 'interface')
  const hookExports = info.exports.filter((e) => e.kind === 'function' && e.name.startsWith('use'))
  const componentExports = info.exports.filter((e) => e.kind === 'component')
  const utilExports = info.exports.filter(
    (e) => e.kind === 'const' || (e.kind === 'function' && !e.name.startsWith('use'))
  )

  if (typeExports.length > 0) {
    lines.push('')
    lines.push('Types:')
    for (const e of typeExports) {
      lines.push(`    ${e.name}`)
    }
  }

  if (hookExports.length > 0) {
    lines.push('')
    lines.push('Hooks:')
    for (const e of hookExports) {
      const desc = e.jsdoc ? ` — ${formatJsdoc(e.jsdoc).split('\n')[0]}` : ''
      lines.push(`    ${e.name}${desc}`)
    }
  }

  if (componentExports.length > 0) {
    lines.push('')
    lines.push('Components:')
    for (const e of componentExports) {
      lines.push(`    ${e.name}`)
    }
  }

  if (utilExports.length > 0) {
    lines.push('')
    lines.push('Utilities:')
    for (const e of utilExports) {
      lines.push(`    ${e.name}`)
    }
  }

  lines.push('')

  // ── Type Definitions ──
  // Budget: reserve ~200 lines for types. If more, truncate with a note.
  if (info.typeDefinitions.length > 0) {
    lines.push('TYPES')
    lines.push('-----')
    const TYPE_LINE_BUDGET = 150
    let typeLinesUsed = 0
    let typesIncluded = 0
    for (const def of info.typeDefinitions) {
      const defLines = fencedToIndented(def).split('\n').length + 1 // +1 for blank line
      if (typeLinesUsed + defLines > TYPE_LINE_BUDGET && typesIncluded > 0) {
        const remaining = info.typeDefinitions.length - typesIncluded
        lines.push('')
        lines.push(`    ... and ${remaining} more types. See source for full definitions.`)
        break
      }
      lines.push('')
      lines.push(fencedToIndented(def))
      typeLinesUsed += defLines
      typesIncluded++
    }
    lines.push('')
  }

  // ── Hook Signatures (compact: one line each to save space) ──
  if (hookExports.length > 0) {
    lines.push('HOOKS')
    lines.push('-----')
    for (const e of hookExports) {
      lines.push(`    ${e.signature || `${e.name}(...)`}`)
    }
    lines.push('')
  }

  // ── Component Signatures (compact: one line each) ──
  if (componentExports.length > 0) {
    lines.push('COMPONENTS')
    lines.push('----------')
    for (const e of componentExports) {
      lines.push(`    <${e.name} />`)
    }
    lines.push('')
  }

  // ── Examples ──
  if (info.examples.length > 0) {
    lines.push('EXAMPLES')
    lines.push('--------')
    for (let i = 0; i < info.examples.length; i++) {
      const ex = info.examples[i]
      lines.push('')
      lines.push(`Example ${i + 1}: ${ex.title}`)
      lines.push('')
      lines.push(fencedToIndented(ex.code))
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('Generating User Tour Kit context files...')
  console.log(`  Monorepo root: ${MONOREPO_ROOT}`)
  console.log(`  Output dir:    ${OUTPUT_DIR}`)
  console.log('')

  let totalLines = 0
  let maxLines = 0
  let fileCount = 0

  for (const pkg of PACKAGES) {
    const info = readPackageInfo(pkg)
    const content = assembleContextFile(info)
    const outputPath = path.join(OUTPUT_DIR, `${pkg}.txt`)
    fs.writeFileSync(outputPath, content, 'utf-8')

    const lineCount = content.split('\n').length
    totalLines += lineCount
    maxLines = Math.max(maxLines, lineCount)
    fileCount++

    const warning = lineCount > MAX_LINES ? '  WARNING: over 500 lines!' : ''
    const exportCount = info.exports.length
    const exampleCount = info.examples.length
    console.log(
      `  ${pkg}.txt — ${lineCount} lines, ${exportCount} exports, ${exampleCount} examples${warning}`
    )
  }

  console.log('')
  console.log(
    `Generated ${fileCount} context files (avg ${Math.round(totalLines / fileCount)} lines, max ${maxLines} lines)`
  )

  if (maxLines > MAX_LINES) {
    console.log('')
    console.log('WARNING: Some files exceed the 500-line budget. Consider trimming.')
  }
}

main().catch((err) => {
  console.error('Failed to generate context files:', err)
  process.exit(1)
})
