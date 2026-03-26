# Phase 6 — CI Freshness Pipeline

**Duration:** Days 21–23 (~4.5h)
**Depends on:** Phase 1 (llms.txt standardized format), Phase 5 (scripts/generate-context-files.ts, public/context/*.txt)
**Blocks:** Nothing
**Risk Level:** LOW — generation script reads existing MDX source and writes static files; CI check is a hash comparison; no runtime dependencies or infrastructure changes
**Stack:** nextjs, typescript
**Runner:** GitHub Actions (existing `ci.yml`)

---

## 1. Objective + What Success Looks Like

Automate the regeneration of all LLM-facing files (llms.txt, llms-full.txt, per-package context files) so they never go stale. A single `pnpm --filter docs generate:llm` command regenerates everything from MDX source, and CI blocks any PR where generated files are out of date.

**Success looks like:**

- Running `pnpm --filter docs generate:llm` regenerates `public/llms.txt`, `public/llms-full.txt`, and all `public/context/*.txt` files from the current MDX source
- Every generated file includes a version stamp header (e.g., `# Tour Kit v1.2.0 — Generated 2026-04-14T12:00:00Z`)
- The `pnpm build` pipeline for docs runs generation before `next build`, so deployed files are always fresh
- CI runs a freshness check: regenerate files, compare hashes against committed files, fail if they differ
- `/llms.txt` and `/llms-full.txt` responses include `Last-Modified` and `Cache-Control` headers via Next.js config

---

## 2. Key Design Decisions

**D1: Single generation script orchestrates all LLM file generation.**
`scripts/generate-llm-files.ts` is the single entry point. It generates llms.txt and llms-full.txt directly, then calls the existing `generate-context-files.ts` (from Phase 5) programmatically or as a child process. This avoids duplicating MDX parsing logic and ensures all files are generated in one pass.

**D2: Generation reads MDX frontmatter via Fumadocs source loader — fallback to gray-matter.**
The script imports the Fumadocs source configuration from `lib/source.ts` to enumerate pages. If running outside the Next.js runtime prevents this, it falls back to globbing `content/docs/**/*.mdx` and parsing frontmatter with `gray-matter`. The fallback is acceptable because generation only needs titles, descriptions, slugs, and raw content — not rendered MDX.

**D3: Version stamp is read from the root `package.json` or `packages/core/package.json`.**
The generation script reads the version from the monorepo root or core package. The stamp format is `# Tour Kit v{version} — Generated {ISO timestamp}` as the first line of each generated file. This makes it trivial to see when files were last regenerated.

**D4: CI freshness check uses file hash comparison, not git diff.**
The CI job runs the generation script in a clean checkout, then compares SHA-256 hashes of generated files against the committed versions. This is deterministic and avoids false positives from whitespace or line-ending differences that `git diff` might flag.

**D5: Headers are set via Next.js `headers()` config in `next.config.mjs`, not middleware.**
Static file headers for `/llms.txt`, `/llms-full.txt`, and `/context/*` are configured as custom headers in `next.config.mjs`. This is simpler than middleware and works with Vercel's CDN. `Last-Modified` is set to the build timestamp (injected as an env var during build), and `Cache-Control` uses `public, max-age=3600, stale-while-revalidate=86400`.

### Data Model Strategy

| Concern | Approach |
|---------|----------|
| MDX source enumeration | Fumadocs `docs.getPages()` if available at script time, else `glob('content/docs/**/*.mdx')` + `gray-matter` |
| Page metadata | `{ title, description, slug, section }` extracted from frontmatter |
| Full content | Raw MDX with JSX/imports stripped (reuse `mdx-stripper` pattern if available, else regex strip) |
| Version source | `packages/core/package.json` version field |
| Hash algorithm | SHA-256 via Node.js `crypto.createHash('sha256')` |
| File output | Direct `fs.writeFileSync` to `apps/docs/public/` |

---

## 3. Tasks

### 6.1: Write `scripts/generate-llm-files.ts` — llms.txt + llms-full.txt generation (2h)

**File:** `apps/docs/scripts/generate-llm-files.ts`

Create the main generation script that:

1. Reads all MDX pages from `content/docs/` using `glob` + `gray-matter` (reliable outside Next.js runtime)
2. Reads version from `packages/core/package.json`
3. Generates `public/llms.txt` in llmstxt.org standard format:
   - Line 1: `# Tour Kit v{version} — Generated {ISO date}`
   - Blockquote: project description
   - Sections grouped by package/topic with `## Section` headings
   - Each page as `- [Title](https://tour-kit.dev/docs/{slug}): {description}`
4. Generates `public/llms-full.txt`:
   - Line 1: version stamp
   - Full content of every page, separated by `---` delimiters
   - JSX/import statements stripped, code blocks preserved
5. Logs summary: number of pages processed, output file sizes

**MDX parsing approach:**

```typescript
import { globSync } from 'glob'
import matter from 'gray-matter'
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'

interface PageMeta {
  title: string
  description: string
  slug: string
  section: string
  content: string
}

function collectPages(): PageMeta[] {
  const files = globSync('content/docs/**/*.mdx', { cwd: docsRoot })
  return files.map(file => {
    const raw = readFileSync(resolve(docsRoot, file), 'utf-8')
    const { data, content } = matter(raw)
    const slug = file.replace(/\.mdx$/, '').replace(/\/index$/, '')
    const section = slug.split('/')[0] ?? 'general'
    return {
      title: data.title ?? slug,
      description: data.description ?? '',
      slug,
      section,
      content: stripMdxSyntax(content),
    }
  })
}
```

**Content stripping (inline helper):**

```typescript
function stripMdxSyntax(content: string): string {
  return content
    .replace(/^import\s+.*$/gm, '')           // remove import statements
    .replace(/<[A-Z][a-zA-Z]*\s[^>]*\/>/g, '') // remove self-closing JSX
    .replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '') // remove JSX blocks
    .replace(/\n{3,}/g, '\n\n')                // collapse excess newlines
    .trim()
}
```

**Script execution:** Run with `tsx` (already a common devDependency in the monorepo) via `npx tsx scripts/generate-llm-files.ts`.

### 6.2: Integrate context file generation into the same script (0.5h)

**File:** `apps/docs/scripts/generate-llm-files.ts` (update)

Add a call to the Phase 5 context file generation at the end of the main script. Two approaches in priority order:

1. **Preferred:** Import and call the `generateContextFiles()` function from `scripts/generate-context-files.ts` if it exports a callable function
2. **Fallback:** Spawn `npx tsx scripts/generate-context-files.ts` as a child process using `execSync`

```typescript
import { execSync } from 'child_process'

// After generating llms.txt and llms-full.txt:
console.log('Generating per-package context files...')
execSync('npx tsx scripts/generate-context-files.ts', {
  cwd: docsRoot,
  stdio: 'inherit',
})
console.log('All LLM files generated successfully.')
```

### 6.3: Add `generate:llm` script to docs package.json + build pipeline (0.5h)

**File:** `apps/docs/package.json`

Add the generation script and wire it into the build pipeline:

```json
{
  "scripts": {
    "generate:llm": "tsx scripts/generate-llm-files.ts",
    "prebuild": "pnpm generate:llm",
    "build": "next build",
    "dev": "next dev --turbopack",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "postinstall": "fumadocs-mdx"
  }
}
```

**Dependencies to add (devDependencies):**

- `gray-matter` — MDX frontmatter parsing
- `glob` — file globbing (if not already present)
- `tsx` — TypeScript script execution (if not already present)

**Turborepo consideration:** If `turbo.json` defines a `build` task for docs, the `prebuild` hook runs automatically. Alternatively, update `turbo.json` to add a `generate:llm` pipeline task that `build` depends on:

```json
{
  "pipeline": {
    "docs#generate:llm": {
      "inputs": ["content/docs/**/*.mdx", "scripts/generate-llm-files.ts"],
      "outputs": ["public/llms.txt", "public/llms-full.txt", "public/context/**"]
    },
    "docs#build": {
      "dependsOn": ["docs#generate:llm"]
    }
  }
}
```

### 6.4: Add CI freshness check — fail if generated files are out of date (1h)

**File:** `.github/workflows/ci.yml` (update)

Add a new job `llm-freshness` that runs after the `build` job:

```yaml
  llm-freshness:
    name: LLM Files Freshness
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Hash committed LLM files
        id: before
        run: |
          sha256sum apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/public/context/*.txt 2>/dev/null | sort > /tmp/before-hashes.txt
          cat /tmp/before-hashes.txt

      - name: Regenerate LLM files
        run: pnpm --filter docs generate:llm

      - name: Hash regenerated LLM files
        id: after
        run: |
          sha256sum apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/public/context/*.txt 2>/dev/null | sort > /tmp/after-hashes.txt
          cat /tmp/after-hashes.txt

      - name: Compare hashes
        run: |
          if ! diff /tmp/before-hashes.txt /tmp/after-hashes.txt; then
            echo "::error::LLM files are out of date! Run 'pnpm --filter docs generate:llm' and commit the results."
            exit 1
          fi
          echo "LLM files are up to date."
```

**Alternative (lighter):** If adding a full job is too heavy, add the freshness check as a step in the existing `build` job, after the build completes. The hash comparison is fast (<5s).

### 6.5: Add Last-Modified and Cache-Control headers via Next.js config (0.5h)

**File:** `apps/docs/next.config.mjs`

Add custom headers for LLM static files:

```javascript
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@tour-kit/core', '@tour-kit/react', '@tour-kit/hints'],
  async headers() {
    const buildDate = new Date().toUTCString()
    return [
      {
        source: '/llms.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
      {
        source: '/context/:path*',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
    ]
  },
}

export default withMDX(config)
```

---

## 4. Deliverables

```
apps/docs/
├── scripts/
│   └── generate-llm-files.ts          # Main generation script (llms.txt + llms-full.txt + context files)
├── public/
│   ├── llms.txt                        # Regenerated with version stamp
│   ├── llms-full.txt                   # Regenerated with version stamp
│   └── context/                        # Regenerated per-package context files
│       ├── core.txt
│       ├── react.txt
│       ├── hints.txt
│       ├── adoption.txt
│       ├── analytics.txt
│       ├── announcements.txt
│       ├── checklists.txt
│       ├── media.txt
│       └── scheduling.txt
├── package.json                        # Updated with generate:llm script + prebuild hook
└── next.config.mjs                     # Updated with Last-Modified + Cache-Control headers

.github/workflows/
└── ci.yml                              # Updated with llm-freshness job
```

---

## 5. Exit Criteria

- [ ] `pnpm --filter docs generate:llm` regenerates `public/llms.txt`, `public/llms-full.txt`, and all `public/context/*.txt` from MDX source
- [ ] All generated files include a version stamp on line 1 (e.g., `# Tour Kit v1.2.0 — Generated 2026-04-14T12:00:00Z`)
- [ ] `pnpm --filter docs build` runs generation before `next build` via prebuild hook
- [ ] CI `llm-freshness` job fails if committed LLM files do not match regenerated output
- [ ] CI `llm-freshness` job passes when files are up to date
- [ ] `curl -I https://tour-kit.dev/llms.txt` returns `Last-Modified` and `Cache-Control` headers (verify after deploy)
- [ ] `curl -I https://tour-kit.dev/llms-full.txt` returns `Last-Modified` and `Cache-Control` headers
- [ ] Generation script handles all ~192 MDX pages without errors
- [ ] Script completes in under 10 seconds

---

## 6. Execution Prompt

You are implementing Phase 6 (CI Freshness Pipeline) of the Tour Kit LLM Discoverability project. This phase automates regeneration of all LLM-facing files so they never go stale. You are working in the docs app at `apps/docs/` within a pnpm + Turborepo monorepo.

### Monorepo context
- Build: `pnpm --filter docs build` (Next.js via Fumadocs)
- Docs content: `apps/docs/content/docs/**/*.mdx` (~192 pages)
- Source loader: `apps/docs/lib/source.ts` (Fumadocs)
- Existing LLM files: `apps/docs/public/llms.txt`, `apps/docs/public/llms-full.txt`
- Existing context files: `apps/docs/public/context/*.txt` (9 files, one per package)
- Context file generator: `apps/docs/scripts/generate-context-files.ts` (from Phase 5)
- CI config: `.github/workflows/ci.yml`
- Next.js config: `apps/docs/next.config.mjs`
- Core package version: `packages/core/package.json` → `version` field

### Phase 5 dependency
Phase 5 created `scripts/generate-context-files.ts` which generates per-package context files at `public/context/*.txt`. Your script must call this as part of the generation pipeline. Check if it exports a callable function; if not, call it via `execSync('npx tsx scripts/generate-context-files.ts')`.

### Phase 1 dependency
Phase 1 established the llms.txt format following llmstxt.org standard. Your script must generate files in this exact format:
- `llms.txt`: Title line, blockquote description, `## Section` headings with `- [Title](url): description` links
- `llms-full.txt`: Title line, full page content separated by `---` delimiters, JSX/imports stripped

### File 1 — `apps/docs/scripts/generate-llm-files.ts`

Main generation script. Must:
1. Glob `content/docs/**/*.mdx`, parse frontmatter with `gray-matter`
2. Read version from `../../packages/core/package.json`
3. Generate `public/llms.txt` in llmstxt.org standard format with version stamp
4. Generate `public/llms-full.txt` with full stripped content and version stamp
5. Call Phase 5's context file generator
6. Log summary (page count, file sizes)

Use `gray-matter` for frontmatter parsing (works outside Next.js runtime). Use `glob` or `globSync` for file discovery. Strip JSX/imports from MDX content using regex (no need for a full MDX compiler).

### File 2 — `apps/docs/package.json` (update)

Add:
```json
"generate:llm": "tsx scripts/generate-llm-files.ts",
"prebuild": "pnpm generate:llm"
```

Add devDependencies if not present: `gray-matter`, `glob`, `tsx`.

### File 3 — `.github/workflows/ci.yml` (update)

Add `llm-freshness` job:
- Runs after `build` job (`needs: build`)
- Hashes committed LLM files with `sha256sum`
- Runs `pnpm --filter docs generate:llm`
- Hashes regenerated files
- Compares with `diff` — fails with actionable error message if different

### File 4 — `apps/docs/next.config.mjs` (update)

Add `async headers()` function returning:
- `/llms.txt`, `/llms-full.txt`, `/context/:path*` all get:
  - `Last-Modified`: build timestamp
  - `Cache-Control`: `public, max-age=3600, stale-while-revalidate=86400`
  - `Content-Type`: `text/plain; charset=utf-8`

### Constraints
- No `any` types in TypeScript — use proper interfaces
- All functions are named exports
- Script must work standalone via `npx tsx scripts/generate-llm-files.ts` (no Next.js runtime required)
- Do not modify the existing `generate-context-files.ts` — call it as-is
- Run `pnpm --filter docs generate:llm` after implementation to verify it works
- Run `pnpm --filter docs typecheck` to verify no type errors

---

## Readiness Check

Before starting Phase 6, confirm:

- [ ] Phase 1 is complete — `public/llms.txt` exists in llmstxt.org standard format
- [ ] Phase 1 is complete — `public/llms-full.txt` exists with full documentation content
- [ ] Phase 5 is complete — `scripts/generate-context-files.ts` exists and generates `public/context/*.txt`
- [ ] Phase 5 is complete — `public/context/` directory contains 9 package context files
- [ ] `content/docs/` contains MDX pages with `title` and `description` frontmatter
- [ ] `packages/core/package.json` contains a `version` field
- [ ] `.github/workflows/ci.yml` exists with the current CI pipeline
- [ ] `pnpm --filter docs build` succeeds before starting
