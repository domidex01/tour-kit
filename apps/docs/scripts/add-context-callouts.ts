/**
 * add-context-callouts.ts
 *
 * Adds LLM Context File callout to each package's docs landing page (index.mdx)
 * and updates the AI Assistants page with a context file listing table.
 *
 * Run: npx tsx apps/docs/scripts/add-context-callouts.ts
 */

import fs from 'node:fs'
import path from 'node:path'

const PACKAGES = [
  'core', 'react', 'hints', 'adoption', 'analytics',
  'announcements', 'checklists', 'media', 'scheduling',
] as const

const SCRIPT_DIR = __dirname
const DOCS_ROOT = path.resolve(SCRIPT_DIR, '..')
const CONTENT_DIR = path.resolve(DOCS_ROOT, 'content/docs')
const CONTEXT_DIR = path.resolve(DOCS_ROOT, 'public/context')

const CALLOUT_MARKER = '<!-- llm-context-callout -->'

function getCalloutBlock(pkg: string): string {
  return `${CALLOUT_MARKER}
<Callout type="info" title="LLM Context File">
  Working with an AI assistant? Download the
  <a href="/context/${pkg}.txt" download>context file for @tour-kit/${pkg}</a>
  and paste it into your conversation for accurate code generation.
</Callout>
`
}

function getLineCount(pkg: string): number {
  const filePath = path.join(CONTEXT_DIR, `${pkg}.txt`)
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').length
  } catch {
    return 0
  }
}

function addCalloutToPackagePage(pkg: string): boolean {
  const mdxPath = path.join(CONTENT_DIR, pkg, 'index.mdx')
  if (!fs.existsSync(mdxPath)) {
    console.log(`  SKIP: ${pkg}/index.mdx not found`)
    return false
  }

  let content = fs.readFileSync(mdxPath, 'utf-8')

  if (content.includes(CALLOUT_MARKER)) {
    console.log(`  SKIP: ${pkg}/index.mdx already has callout`)
    return false
  }

  // Insert after frontmatter closing --- and the first paragraph
  const firstDash = content.indexOf('---')
  const frontmatterEnd = content.indexOf('---', firstDash + 3)
  if (frontmatterEnd === -1) {
    console.log(`  SKIP: ${pkg}/index.mdx has no frontmatter`)
    return false
  }

  const afterFrontmatter = frontmatterEnd + 3
  const restContent = content.slice(afterFrontmatter)
  const firstDoubleNewline = restContent.indexOf('\n\n')

  if (firstDoubleNewline === -1) {
    content = content.slice(0, afterFrontmatter) + '\n\n' + getCalloutBlock(pkg) + '\n' + restContent
  } else {
    const insertPos = afterFrontmatter + firstDoubleNewline + 2
    content = content.slice(0, insertPos) + getCalloutBlock(pkg) + '\n' + content.slice(insertPos)
  }

  fs.writeFileSync(mdxPath, content, 'utf-8')
  console.log(`  OK: ${pkg}/index.mdx`)
  return true
}

function updateAIAssistantsPage(): boolean {
  const aiPath = path.join(CONTENT_DIR, 'ai-assistants', 'index.mdx')
  if (!fs.existsSync(aiPath)) {
    console.log(`  SKIP: ai-assistants/index.mdx not found`)
    return false
  }

  let content = fs.readFileSync(aiPath, 'utf-8')
  const SECTION_MARKER = '<!-- per-package-context-files -->'

  if (content.includes(SECTION_MARKER)) {
    console.log(`  SKIP: ai-assistants/index.mdx already has context files section`)
    return false
  }

  const rows = PACKAGES.map((pkg) => {
    const lines = getLineCount(pkg)
    return `| @tour-kit/${pkg} | [${pkg}.txt](/context/${pkg}.txt) | ~${lines} lines |`
  }).join('\n')

  const section = `
${SECTION_MARKER}
## Per-Package Context Files

For targeted assistance with a specific package, paste the corresponding context file
into your LLM conversation. Each file contains the complete API surface, type definitions,
and usage examples — optimized to fit within a single paste.

| Package | Context File | Size |
|---------|-------------|------|
${rows}

### How to Use

1. Download the context file for the package you need help with
2. Paste the file contents at the start of your conversation with ChatGPT, Claude, or Gemini
3. Ask your question — the LLM will have accurate API knowledge to generate correct code
`

  content = content.trimEnd() + '\n' + section + '\n'
  fs.writeFileSync(aiPath, content, 'utf-8')
  console.log(`  OK: ai-assistants/index.mdx`)
  return true
}

function main() {
  console.log('Adding LLM Context File callouts to package docs...\n')
  let updated = 0
  for (const pkg of PACKAGES) {
    if (addCalloutToPackagePage(pkg)) updated++
  }
  console.log(`\nUpdated ${updated} of ${PACKAGES.length} package pages.\n`)
  console.log('Updating AI Assistants page...')
  updateAIAssistantsPage()
  console.log('\nDone!')
}

main()
