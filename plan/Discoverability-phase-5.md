# Discoverability Phase 5 — Per-Package Context Files

**Duration:** Days 18–20 (~5h)
**Depends on:** Nothing (independent phase)
**Blocks:** Phase 6 (CI Freshness Pipeline — integrates context file generation into automated build)
**Risk Level:** LOW — reads existing source files and produces static text output; no runtime dependencies; no infrastructure changes
**Stack:** nextjs, typescript
**Runner:** `apps/docs/` (Fumadocs Next.js app) + monorepo root scripts

---

## 1. Objective + What Success Looks Like

Generate copy-paste-friendly context files for each of the 9 Tour Kit packages. These files are designed for developers who manually feed documentation to LLMs (ChatGPT, Claude, Gemini) by pasting context into their prompt. Each file is a self-contained summary of a package's API surface: exported types, hook/component signatures, JSDoc descriptions, and usage examples.

**Success looks like:**

- Running `pnpm generate:context` produces 9 files at `apps/docs/public/context/{package}.txt`
- Each file contains: package overview, all exported types with their fields, all exported hook/component signatures with JSDoc, and 2–3 real usage examples
- Each file is under 500 lines (fits comfortably in a single LLM context paste)
- A developer can copy-paste `core.txt` into ChatGPT and immediately get accurate answers about `@tour-kit/core` APIs
- Each package's docs landing page has a "Download LLM Context" link pointing to `/context/{package}.txt`
- The AI Assistants docs page lists all 9 context files with descriptions

---

## 2. Key Design Decisions

**D1: Context files are plain text (`.txt`), not markdown.**
Plain text is universally supported by all LLMs and avoids formatting confusion. Headings use `===` underlines and `---` separators. Code blocks use indentation (4 spaces) rather than fenced blocks to avoid confusing LLMs that might interpret triple-backticks as prompt boundaries.

**D2: Generation script reads TypeScript source directly, not compiled output.**
The script reads `packages/{name}/src/index.ts` (and the files it re-exports) to extract the public API surface. This ensures the context file reflects the actual source of truth, not a potentially stale build artifact. It uses regex-based extraction, not a full TypeScript compiler API — keeping the script simple and fast.

**D3: Examples come from MDX docs, not source code.**
The 2–3 usage examples per package are extracted from the corresponding `content/docs/{package}/` MDX files. This ensures examples are the same polished, documented snippets that appear on the docs site, not raw test fixtures.

**D4: Each context file has a standard header with version, date, and usage instructions.**
The header tells the LLM what the file is and how to use it:

```
Tour Kit — @tour-kit/core Context File
Version: 1.2.0 | Generated: 2026-03-24
Paste this into your LLM to get accurate answers about @tour-kit/core.
=========================================================================
```

**D5: Type extraction is signature-level, not full implementation.**
For types/interfaces, the script includes the full definition (all fields with JSDoc). For hooks and components, it includes only the signature and return type — not the implementation body. This keeps files concise while giving LLMs enough information to generate correct code.

**D6: Download links use a simple `<a>` tag with `download` attribute, not a custom component.**
No need for a React component — a styled anchor tag in the MDX page is sufficient. The link points to `/context/{package}.txt` which is served as a static file from `public/`.

### Data Model Strategy

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Source of truth | `packages/{name}/src/index.ts` + re-exported files | Public API is defined by what `index.ts` exports |
| Example source | `content/docs/{package}/` MDX files | Polished, documented examples |
| Output location | `apps/docs/public/context/{package}.txt` | Served as static files by Next.js |
| File format | Plain text with ASCII headings | Universal LLM compatibility |
| Size budget | <500 lines per file | Fits in a single paste for any LLM |
| Generation trigger | `pnpm generate:context` script | Manual now, automated in Phase 6 |
| Type parsing | Regex on `.ts` source files | Avoids TypeScript compiler API dependency; sufficient for export extraction |
| Package list | Hardcoded array of 9 names | Stable — new packages are rare events |

---

## 3. Tasks

### 5.1: Design context file template (0.5h)

**Output:** Template specification (documented in the generation script as comments)

Define the standard structure for all 9 context files:

```
Tour Kit — @tour-kit/{name} Context File
Version: {version} | Generated: {date}
Paste this into your LLM to get accurate answers about @tour-kit/{name}.
=========================================================================

OVERVIEW
--------
{One paragraph from package.json description + README first section}

INSTALLATION
------------
    npm install @tour-kit/{name}
    # or
    pnpm add @tour-kit/{name}

Peer dependencies: {list from package.json peerDependencies}

EXPORTS
-------
{Grouped by category: Types, Hooks, Components, Utilities}

Each export:
    {name}: {brief description from JSDoc}
    Signature: {type signature or function signature}

TYPES
-----
{Full interface/type definitions with field-level JSDoc}

    interface TourConfig {
      /** Unique identifier for this tour */
      tourId: string
      /** Array of step definitions */
      steps: TourStep[]
      /** Called when tour completes */
      onComplete?: () => void
    }

HOOKS
-----
{Hook signatures with parameter and return types}

    useTour(tourId: string): UseTourReturn
      Returns: { currentStep, next, prev, start, stop, isActive }

COMPONENTS
----------
{Component signatures with prop types}

    <TourCard step={TourStep} onNext={() => void} onPrev={() => void} />
      Props: TourCardProps { step, onNext, onPrev, className? }

EXAMPLES
--------
Example 1: {title}

    {code indented 4 spaces}

Example 2: {title}

    {code indented 4 spaces}
```

### 5.2: Write `scripts/generate-context-files.ts` (2h)

**File:** `apps/docs/scripts/generate-context-files.ts`

- Reads each package's source to extract the public API:
  - Parse `packages/{name}/package.json` for version, description, peerDependencies
  - Read `packages/{name}/src/index.ts` to find all named exports
  - Follow re-export paths (e.g., `export { useTour } from './hooks/use-tour'`) to source files
  - Extract type/interface definitions with JSDoc comments using regex
  - Extract function/hook signatures (name, params, return type)
  - Extract component prop types
- Reads MDX docs to extract examples:
  - Scan `content/docs/{package}/` for MDX files
  - Extract fenced code blocks (` ```tsx ... ``` `) from MDX
  - Take the first 2–3 substantial examples (>5 lines)
  - Strip MDX-specific syntax (imports, JSX components that aren't examples)
- Assembles the context file using the template from task 5.1
- Writes to `apps/docs/public/context/{name}.txt`
- Validates each file is under 500 lines; warns if over budget
- Prints summary: `Generated 9 context files (avg {n} lines, max {n} lines)`

**Script structure:**

```typescript
import fs from 'node:fs'
import path from 'node:path'

const PACKAGES = [
  'core', 'react', 'hints', 'adoption', 'analytics',
  'announcements', 'checklists', 'media', 'scheduling',
] as const

const MONOREPO_ROOT = path.resolve(__dirname, '../../..')
const OUTPUT_DIR = path.resolve(__dirname, '../public/context')

interface PackageInfo {
  name: string
  version: string
  description: string
  peerDeps: Record<string, string>
  exports: ExportEntry[]
  types: string[]
  examples: CodeExample[]
}

interface ExportEntry {
  name: string
  kind: 'type' | 'interface' | 'function' | 'component' | 'const'
  signature: string
  jsdoc: string
}

interface CodeExample {
  title: string
  language: string
  code: string
}

// 1. Read package metadata
function readPackageInfo(pkg: string): PackageInfo { /* ... */ }

// 2. Extract exports from index.ts
function extractExports(indexPath: string): ExportEntry[] { /* ... */ }

// 3. Extract type definitions from source files
function extractTypes(filePath: string): string[] { /* ... */ }

// 4. Extract code examples from MDX files
function extractExamples(docsDir: string, limit: number): CodeExample[] { /* ... */ }

// 5. Assemble context file from template
function assembleContextFile(info: PackageInfo): string { /* ... */ }

// 6. Main
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const pkg of PACKAGES) {
    const info = readPackageInfo(pkg)
    const content = assembleContextFile(info)
    const outputPath = path.join(OUTPUT_DIR, `${pkg}.txt`)
    fs.writeFileSync(outputPath, content, 'utf-8')

    const lineCount = content.split('\n').length
    const status = lineCount > 500 ? '  WARNING: over 500 lines!' : ''
    console.log(`  ${pkg}.txt — ${lineCount} lines${status}`)
  }
}

main().catch(console.error)
```

**Regex patterns for extraction:**

```typescript
// Named exports from index.ts
const RE_EXPORT = /export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
const RE_EXPORT_DIRECT = /export\s+(type\s+|interface\s+|function\s+|const\s+)(\w+)/g

// Interface/type definitions
const RE_INTERFACE = /(?:\/\*\*[\s\S]*?\*\/\s*)?export\s+(?:interface|type)\s+(\w+)[\s\S]*?(?:\{[\s\S]*?\n\}|=\s*[^;]+;)/g

// Function signatures (hooks)
const RE_FUNCTION = /(?:\/\*\*[\s\S]*?\*\/\s*)?export\s+function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)\s*:\s*([^\{]+)/g

// Fenced code blocks in MDX
const RE_CODE_BLOCK = /```(\w+)?\n([\s\S]*?)```/g
```

### 5.3: Generate context files for all 9 packages (1h)

- Run the script: `npx tsx apps/docs/scripts/generate-context-files.ts`
- Review each generated file for accuracy:
  - Verify all public exports are listed
  - Verify type definitions are complete (not truncated)
  - Verify examples are real, working code
  - Verify each file is under 500 lines
- Fix any extraction issues (adjust regex patterns, add special cases)
- Add `"generate:context": "tsx scripts/generate-context-files.ts"` to `apps/docs/package.json`

### 5.4: Add download links on each package's docs landing page (1h)

**Files:** 9 MDX files under `content/docs/{package}/index.mdx`

Add a callout/info box near the top of each package's landing page:

```mdx
<Callout type="info" title="LLM Context File">
  Working with an AI assistant? Download the
  <a href="/context/{package}.txt" download>context file for @tour-kit/{package}</a>
  and paste it into your conversation for accurate code generation.
</Callout>
```

- Place after the introduction paragraph, before the API overview
- Use the existing Fumadocs `<Callout>` component (already available in the docs site)
- Verify the link works in dev mode (`pnpm --filter docs dev`)

### 5.5: Add context file listing to AI Assistants page (0.5h)

**File:** `content/docs/ai-assistants/index.mdx` (or equivalent)

Add a "Per-Package Context Files" section:

```mdx
## Per-Package Context Files

For targeted assistance with a specific package, paste the corresponding context file
into your LLM conversation. Each file contains the complete API surface, type definitions,
and usage examples — optimized to fit within a single paste.

| Package | Context File | Size |
|---------|-------------|------|
| @tour-kit/core | [core.txt](/context/core.txt) | ~{n} lines |
| @tour-kit/react | [react.txt](/context/react.txt) | ~{n} lines |
| @tour-kit/hints | [hints.txt](/context/hints.txt) | ~{n} lines |
| @tour-kit/adoption | [adoption.txt](/context/adoption.txt) | ~{n} lines |
| @tour-kit/analytics | [analytics.txt](/context/analytics.txt) | ~{n} lines |
| @tour-kit/announcements | [announcements.txt](/context/announcements.txt) | ~{n} lines |
| @tour-kit/checklists | [checklists.txt](/context/checklists.txt) | ~{n} lines |
| @tour-kit/media | [media.txt](/context/media.txt) | ~{n} lines |
| @tour-kit/scheduling | [scheduling.txt](/context/scheduling.txt) | ~{n} lines |

### How to Use

1. Download the context file for the package you need help with
2. Paste the file contents at the start of your conversation with ChatGPT, Claude, or Gemini
3. Ask your question — the LLM will have accurate API knowledge to generate correct code
```

---

## 4. Deliverables

```
apps/docs/
├── scripts/
│   └── generate-context-files.ts    # Generation script reading package source + MDX docs
├── public/
│   └── context/
│       ├── core.txt                 # @tour-kit/core context file
│       ├── react.txt                # @tour-kit/react context file
│       ├── hints.txt                # @tour-kit/hints context file
│       ├── adoption.txt             # @tour-kit/adoption context file
│       ├── analytics.txt            # @tour-kit/analytics context file
│       ├── announcements.txt        # @tour-kit/announcements context file
│       ├── checklists.txt           # @tour-kit/checklists context file
│       ├── media.txt                # @tour-kit/media context file
│       └── scheduling.txt           # @tour-kit/scheduling context file

content/docs/
├── core/index.mdx                   # Updated with download link
├── react/index.mdx                  # Updated with download link
├── hints/index.mdx                  # Updated with download link
├── adoption/index.mdx               # Updated with download link
├── analytics/index.mdx              # Updated with download link
├── announcements/index.mdx          # Updated with download link
├── checklists/index.mdx             # Updated with download link
├── media/index.mdx                  # Updated with download link
├── scheduling/index.mdx             # Updated with download link
└── ai-assistants/index.mdx          # Updated with context file listing
```

---

## 5. Exit Criteria

- [ ] 9 context files generated at `apps/docs/public/context/{package}.txt` for: core, react, hints, adoption, analytics, announcements, checklists, media, scheduling
- [ ] Each context file contains all exported types with field definitions and JSDoc descriptions
- [ ] Each context file contains all exported hook/component signatures with parameter and return types
- [ ] Each context file contains 2–3 real usage examples extracted from the docs
- [ ] Each context file is under 500 lines
- [ ] Each context file has a header with package version and generation date
- [ ] `pnpm --filter docs generate:context` runs successfully and produces all 9 files
- [ ] Download links visible on each of the 9 package docs landing pages
- [ ] AI Assistants page lists all 9 context files with links and line counts

---

## 6. Execution Prompt

You are implementing Discoverability Phase 5 (Per-Package Context Files) for the Tour Kit monorepo. This phase creates a generation script that reads each package's TypeScript source and MDX documentation to produce copy-paste-friendly context files for LLM consumption.

### Project Context

Tour Kit is a headless React onboarding/product tour library organized as a pnpm monorepo. There are 9 packages at `packages/{name}/`:

| Package | Entry Point | Docs |
|---------|-------------|------|
| core | `packages/core/src/index.ts` | `content/docs/core/` |
| react | `packages/react/src/index.ts` | `content/docs/react/` |
| hints | `packages/hints/src/index.ts` | `content/docs/hints/` |
| adoption | `packages/adoption/src/index.ts` | `content/docs/adoption/` |
| analytics | `packages/analytics/src/index.ts` | `content/docs/analytics/` |
| announcements | `packages/announcements/src/index.ts` | `content/docs/announcements/` |
| checklists | `packages/checklists/src/index.ts` | `content/docs/checklists/` |
| media | `packages/media/src/index.ts` | `content/docs/media/` |
| scheduling | `packages/scheduling/src/index.ts` | `content/docs/scheduling/` |

Each package's `index.ts` re-exports from internal modules. The generation script follows these re-exports to find the actual type/function definitions.

The docs site is at `apps/docs/` using Fumadocs (Next.js). MDX content is at `content/docs/`. Each package has a landing page at `content/docs/{package}/index.mdx`.

### Per-File Implementation Guidance

**`scripts/generate-context-files.ts`**

The script runs with `tsx` (TypeScript execution) from the `apps/docs/` directory. It does NOT use the TypeScript compiler API — it reads source files as strings and uses regex to extract API information.

Key implementation patterns:

```typescript
// Following re-exports from index.ts
function resolveExportPath(indexDir: string, relativePath: string): string {
  // './hooks/use-tour' -> resolve to absolute path, try .ts and .tsx extensions
  const base = path.resolve(indexDir, relativePath)
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const full = base + ext
    if (fs.existsSync(full)) return full
  }
  return base + '.ts' // fallback
}

// Extracting interface definitions with JSDoc
function extractInterfaces(source: string): string[] {
  const results: string[] = []
  const regex = /(\/\*\*[\s\S]*?\*\/\s*)?export\s+(?:interface|type)\s+\w+[\s\S]*?(?:\n\}|= [^;]+;)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(source)) !== null) {
    results.push(match[0])
  }
  return results
}

// Converting fenced code blocks to indented format for context file
function fencedToIndented(code: string): string {
  return code.split('\n').map(line => '    ' + line).join('\n')
}
```

**MDX example extraction:**

```typescript
function extractExamplesFromMdx(mdxDir: string, limit = 3): CodeExample[] {
  const mdxFiles = fs.readdirSync(mdxDir, { recursive: true })
    .filter(f => String(f).endsWith('.mdx'))
    .map(f => path.join(mdxDir, String(f)))

  const examples: CodeExample[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g

  for (const file of mdxFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    let match: RegExpExecArray | null
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[2].trim()
      // Only include substantial examples (>5 lines, tsx/ts/jsx)
      if (code.split('\n').length >= 5 && ['tsx', 'ts', 'jsx'].includes(match[1] ?? '')) {
        // Derive title from nearest heading above the code block
        const beforeBlock = content.slice(0, match.index)
        const lastHeading = beforeBlock.match(/^#{1,3}\s+(.+)$/gm)?.pop()
        examples.push({
          title: lastHeading?.replace(/^#+\s+/, '') ?? 'Usage Example',
          language: match[1] ?? 'tsx',
          code,
        })
      }
      if (examples.length >= limit) break
    }
    if (examples.length >= limit) break
  }

  return examples.slice(0, limit)
}
```

**Adding the download link to MDX pages:**

Each package landing page (`content/docs/{package}/index.mdx`) gets a callout. Check if the page uses Fumadocs `<Callout>` component — it should already be available. Insert after the first paragraph:

```mdx
<Callout type="info" title="LLM Context File">
  Working with an AI assistant? Download the
  <a href="/context/core.txt" download>context file for @tour-kit/core</a>
  and paste it into your conversation for accurate code generation.
</Callout>
```

### Constraints

- The generation script must run standalone with `tsx` — no Next.js runtime required
- Do NOT use the TypeScript compiler API (`ts.createProgram`, etc.) — use regex-based extraction
- Each context file must be under 500 lines — if a package's API is too large, summarize less-important types
- Use 4-space indentation for code blocks in context files (not fenced blocks)
- All file paths in the script should be relative to the monorepo root for portability
- The script must handle missing files gracefully (some packages may not have all expected files)
- Add `"generate:context": "tsx scripts/generate-context-files.ts"` to `apps/docs/package.json`
- Run `pnpm --filter docs generate:context` to verify all 9 files are generated
- Run `pnpm --filter docs build` to verify the static files are served correctly

---

## Readiness Check

Before starting Discoverability Phase 5, confirm:

- [ ] All 9 packages exist at `packages/{name}/` with `src/index.ts` entry points
- [ ] Each package's `index.ts` has named exports (not just default exports)
- [ ] MDX documentation exists at `content/docs/{package}/` for all 9 packages
- [ ] Each package's docs directory has an `index.mdx` landing page
- [ ] The AI Assistants page exists at `content/docs/ai-assistants/index.mdx` (or equivalent path)
- [ ] `tsx` is available as a dev dependency (check with `npx tsx --version`)
- [ ] `pnpm --filter docs build` succeeds
