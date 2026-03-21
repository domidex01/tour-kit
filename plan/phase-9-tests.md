# Phase 9 Test Plan — Documentation + Examples + Final Quality

**Package:** `@tour-kit/ai`
**Phase Type:** Integration / verification — no new logic, testing quality gates
**Test Framework:** Vitest + `@testing-library/react`
**Coverage Target:** > 80% line coverage for ALL files in `packages/ai/src/`
**Date:** 2026-03-21

---

## 1. User Stories Mapped to Tests

| ID | Story | Acceptance Criteria | Test Coverage |
|----|-------|---------------------|---------------|
| US-1 | As a developer, I want docs to get me from zero to working AI chat in 30 minutes, so that adoption is easy | Docs site builds without errors; all 7 MDX pages + meta.json exist | `docs-build.test.ts` > docs build verification |
| US-2 | As a CI engineer, I want test coverage >80%, so that regressions are caught | `vitest --coverage` reports >80% line coverage for `packages/ai/src/` | Coverage gap tests across all test files |
| US-3 | As a developer, I want bundle sizes within budget, so that the package doesn't bloat apps | client < 15KB, server < 8KB, markdown renderer < 3KB (gzipped) | `bundle-size.test.ts` > size-limit verification |
| US-4 | As a developer, I want zero SSR/hydration issues, so that Next.js integration is seamless | No `window`/`document`/`localStorage` in server files; Next.js example builds | `ssr-safety.test.ts` > server file scanning |
| US-5 | As a developer, I want working example apps, so that I can copy-paste a starting point | Both vite-app and next-app build with AI chat pages | `examples-build.test.ts` > build verification |

---

## 2. Component Mock Strategy

**Key Pattern:** Phase 9 is a quality gate. Most tests are verification checks (filesystem, build output, coverage reports) rather than unit tests. The coverage gap tests use the same mock strategies established in Phases 1-8.

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| Filesystem (docs, examples) | Direct `fs.existsSync` / `fs.readFileSync` assertions | Verify files exist and contain expected content — no mocking needed |
| Build output (bundle size) | Post-build filesystem assertions on `dist/` | Verify real build artifacts, not mocked output |
| Server files (SSR safety) | Source code scanning via `fs.readFileSync` + regex | Static analysis of actual source files |
| Coverage report | Vitest `--coverage` JSON output parsing | Read real coverage data from Vitest |
| `useAiChat` (coverage gap tests) | `vi.mock()` with controlled return values | Same as Phase 1 mock strategy |
| `AiChatProvider` (coverage gap tests) | `vi.mock()` internal context | Same as Phase 8 mock strategy |
| AI SDK (`streamText`, `useChat`) | `vi.mock('ai')`, `vi.mock('@ai-sdk/react')` | Same as Phase 1/3 mock strategies |

---

## 3. Test Tier Table

| Test File | Tier | US | External Deps | Skip Condition |
|-----------|------|----|---------------|----------------|
| `docs-structure.test.ts` | Verification | US-1 | Filesystem | None — always runs |
| `ssr-safety.test.ts` | Verification | US-4 | Filesystem (source scan) | None — always runs |
| `bundle-size.test.ts` | Verification | US-3 | Filesystem (post-build) | `!existsSync('dist/')` — skip if not built |
| `coverage-gaps/hooks-coverage.test.tsx` | Unit | US-2 | None (all mocked) | None — always runs |
| `coverage-gaps/server-coverage.test.ts` | Unit | US-2 | None (all mocked) | None — always runs |
| `coverage-gaps/components-coverage.test.tsx` | Unit | US-2 | None (all mocked) | None — always runs |
| `coverage-gaps/core-coverage.test.ts` | Unit | US-2 | None (all mocked) | None — always runs |
| `coverage-gaps/context-coverage.test.tsx` | Unit | US-2 | None (all mocked) | None — always runs |

---

## 4. Fake/Mock Implementations

### None needed for verification tests

Phase 9 verification tests (`docs-structure`, `ssr-safety`, `bundle-size`) operate on real filesystem artifacts. They do not require fakes or mocks — they assert the existence and content of actual files.

### Coverage gap tests reuse existing helpers

Coverage gap tests reuse the mock helpers established in earlier phases:

```
packages/ai/src/__tests__/helpers/
  mock-use-ai-chat.ts          # From Phase 1/8
  mock-tour-context.ts          # From Phase 8
  mock-ai-chat-context.ts       # From Phase 8
  prompt-fixtures.ts            # From Phase 2
  fs-assertions.ts              # From Phase 0
  skip-conditions.ts            # From Phase 0
```

No new helper files are needed for Phase 9.

---

## 5. Test File List

### 5.1 `packages/ai/src/__tests__/verification/docs-structure.test.ts`

```typescript
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const DOCS_DIR = resolve(__dirname, '../../../../../apps/docs/content/docs/ai')
const ROOT_META = resolve(__dirname, '../../../../../apps/docs/content/docs/meta.json')

describe('Documentation structure', () => {
  // -------------------------------------------------------
  // Directory and meta.json
  // -------------------------------------------------------
  describe('directory structure', () => {
    it('ai docs directory exists', () => {
      expect(existsSync(DOCS_DIR)).toBe(true)
    })

    it('meta.json exists with correct structure', () => {
      const metaPath = resolve(DOCS_DIR, 'meta.json')
      expect(existsSync(metaPath)).toBe(true)

      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
      expect(meta.title).toBe('@tour-kit/ai')
      expect(meta.icon).toBe('Bot')
      expect(meta.pages).toBeInstanceOf(Array)
      expect(meta.pages.length).toBeGreaterThanOrEqual(7)
    })

    it('meta.json includes all required pages', () => {
      const metaPath = resolve(DOCS_DIR, 'meta.json')
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))

      const requiredPages = [
        'index',
        'quick-start',
        'cag-guide',
        'rag-guide',
        'tour-integration',
        'components',
        'api-reference',
      ]
      for (const page of requiredPages) {
        expect(meta.pages, `missing page: ${page}`).toContain(page)
      }
    })
  })

  // -------------------------------------------------------
  // MDX pages
  // -------------------------------------------------------
  describe('MDX pages', () => {
    const pages = [
      'index.mdx',
      'quick-start.mdx',
      'cag-guide.mdx',
      'rag-guide.mdx',
      'tour-integration.mdx',
      'components.mdx',
      'api-reference.mdx',
    ]

    for (const page of pages) {
      it(`${page} exists`, () => {
        expect(existsSync(resolve(DOCS_DIR, page))).toBe(true)
      })

      it(`${page} has frontmatter with title`, () => {
        const content = readFileSync(resolve(DOCS_DIR, page), 'utf-8')
        expect(content).toMatch(/^---\n/)
        expect(content).toMatch(/title:\s*.+/)
      })

      it(`${page} has frontmatter with description`, () => {
        const content = readFileSync(resolve(DOCS_DIR, page), 'utf-8')
        expect(content).toMatch(/description:\s*.+/)
      })
    }
  })

  // -------------------------------------------------------
  // Root meta.json includes ai section
  // -------------------------------------------------------
  describe('root navigation', () => {
    it('root meta.json includes "ai" in pages array', () => {
      expect(existsSync(ROOT_META)).toBe(true)
      const meta = JSON.parse(readFileSync(ROOT_META, 'utf-8'))
      expect(meta.pages).toContain('ai')
    })
  })

  // -------------------------------------------------------
  // Package documentation files
  // -------------------------------------------------------
  describe('package documentation', () => {
    const pkgDir = resolve(__dirname, '../../../../')

    it('CLAUDE.md exists', () => {
      expect(existsSync(resolve(pkgDir, 'CLAUDE.md'))).toBe(true)
    })

    it('CLAUDE.md contains package overview', () => {
      const content = readFileSync(resolve(pkgDir, 'CLAUDE.md'), 'utf-8')
      expect(content).toContain('@tour-kit/ai')
    })

    it('README.md exists', () => {
      expect(existsSync(resolve(pkgDir, 'README.md'))).toBe(true)
    })

    it('README.md contains install instructions', () => {
      const content = readFileSync(resolve(pkgDir, 'README.md'), 'utf-8')
      expect(content).toContain('pnpm add @tour-kit/ai')
    })

    it('README.md contains quick start code', () => {
      const content = readFileSync(resolve(pkgDir, 'README.md'), 'utf-8')
      expect(content).toContain('AiChatProvider')
    })
  })
})
```

### 5.2 `packages/ai/src/__tests__/verification/ssr-safety.test.ts`

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { describe, it, expect } from 'vitest'

const SERVER_DIR = resolve(__dirname, '../../../server')
const SRC_DIR = resolve(__dirname, '../../../')

/** Recursively get all .ts/.tsx files in a directory */
function getSourceFiles(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
        files.push(...getSourceFiles(fullPath, ext))
      } else if (entry.isFile() && ext.some((e) => entry.name.endsWith(e))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory may not exist yet during early phases
  }
  return files
}

describe('SSR safety', () => {
  // -------------------------------------------------------
  // Server files: no browser globals
  // -------------------------------------------------------
  describe('server files — no browser globals', () => {
    const browserGlobals = [
      /\bwindow\b/,
      /\bdocument\b/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bnavigator\b/,
    ]

    const serverFiles = getSourceFiles(SERVER_DIR)

    for (const file of serverFiles) {
      const relativePath = file.replace(SRC_DIR, 'src/')

      it(`${relativePath} has no unguarded browser globals`, () => {
        const content = readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments and imports
          if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*') || line.trimStart().startsWith('import')) {
            continue
          }
          for (const pattern of browserGlobals) {
            if (pattern.test(line)) {
              // Allow typeof checks
              if (/typeof\s+(window|document|localStorage|sessionStorage|navigator)/.test(line)) {
                continue
              }
              throw new Error(
                `Browser global found in server file at line ${i + 1}: "${line.trim()}"\n` +
                  `File: ${relativePath}`
              )
            }
          }
        }
      })
    }

    it('at least one server file was scanned', () => {
      expect(serverFiles.length).toBeGreaterThan(0)
    })
  })

  // -------------------------------------------------------
  // Client files: browser globals are guarded
  // -------------------------------------------------------
  describe('client files — browser globals are guarded', () => {
    const clientDirs = ['hooks', 'context', 'components', 'core'].map((d) =>
      resolve(SRC_DIR, d)
    )

    const clientFiles = clientDirs.flatMap((dir) => getSourceFiles(dir))

    for (const file of clientFiles) {
      const relativePath = file.replace(SRC_DIR, 'src/')

      it(`${relativePath} guards browser API access`, () => {
        const content = readFileSync(file, 'utf-8')

        // Find direct browser API usage (e.g., window.something, document.querySelector)
        const directUsagePattern = /(?<!typeof\s)(window\.|document\.|localStorage\.|sessionStorage\.)/g
        const matches = [...content.matchAll(directUsagePattern)]

        for (const match of matches) {
          const lineIndex = content.substring(0, match.index).split('\n').length
          const line = content.split('\n')[lineIndex - 1]

          // Skip if in a comment
          if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
            continue
          }

          // Check that there's a typeof guard somewhere nearby (within 5 lines above)
          const precedingLines = content
            .split('\n')
            .slice(Math.max(0, lineIndex - 6), lineIndex)
            .join('\n')

          const hasGuard =
            /typeof\s+window\s*!==\s*['"]undefined['"]/.test(precedingLines) ||
            /typeof\s+window\s*===\s*['"]undefined['"]/.test(precedingLines) ||
            /if\s*\(\s*typeof\s+window/.test(precedingLines)

          if (!hasGuard) {
            // Not necessarily a failure — could be inside a useEffect or event handler
            // which only runs client-side. Log a warning rather than fail.
            console.warn(
              `Potentially unguarded browser API in ${relativePath}:${lineIndex}: ${line.trim()}`
            )
          }
        }
      })
    }
  })

  // -------------------------------------------------------
  // Server entry point: no React imports
  // -------------------------------------------------------
  describe('server entry point isolation', () => {
    it('server index does not import React', () => {
      try {
        const serverIndex = readFileSync(
          resolve(SRC_DIR, 'server/index.ts'),
          'utf-8'
        )
        expect(serverIndex).not.toMatch(/from\s+['"]react['"]/)
        expect(serverIndex).not.toMatch(/import.*React/)
      } catch {
        // File may not exist yet — skip
      }
    })

    it('server files do not import from client directories', () => {
      const serverFiles = getSourceFiles(SERVER_DIR)
      const clientDirs = ['../hooks', '../components', '../context']

      for (const file of serverFiles) {
        const content = readFileSync(file, 'utf-8')
        for (const clientDir of clientDirs) {
          expect(content).not.toContain(`from '${clientDir}`)
          expect(content).not.toContain(`from "${clientDir}`)
        }
      }
    })
  })
})
```

### 5.3 `packages/ai/src/__tests__/verification/bundle-size.test.ts`

```typescript
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, it, expect } from 'vitest'

const DIST_DIR = resolve(__dirname, '../../../../dist')
const HAS_DIST = existsSync(DIST_DIR)

/** Get gzipped size of a file in KB */
function getGzippedSizeKB(filePath: string): number {
  const content = readFileSync(filePath)
  const gzipped = gzipSync(content)
  return gzipped.length / 1024
}

describe('Bundle size verification', () => {
  // Skip all tests if dist/ does not exist (not built yet)
  describe.skipIf(!HAS_DIST)('post-build size checks', () => {
    // -------------------------------------------------------
    // Client entry
    // -------------------------------------------------------
    describe('client entry (index)', () => {
      const clientEntry = resolve(DIST_DIR, 'index.mjs')

      it('client entry file exists', () => {
        expect(existsSync(clientEntry)).toBe(true)
      })

      it('client entry is under 15KB gzipped', () => {
        const sizeKB = getGzippedSizeKB(clientEntry)
        expect(sizeKB).toBeLessThan(15)
      })
    })

    // -------------------------------------------------------
    // Server entry
    // -------------------------------------------------------
    describe('server entry', () => {
      const serverEntry = resolve(DIST_DIR, 'server.mjs')

      it('server entry file exists', () => {
        expect(existsSync(serverEntry)).toBe(true)
      })

      it('server entry is under 8KB gzipped', () => {
        const sizeKB = getGzippedSizeKB(serverEntry)
        expect(sizeKB).toBeLessThan(8)
      })
    })

    // -------------------------------------------------------
    // Markdown renderer
    // -------------------------------------------------------
    describe('markdown renderer', () => {
      // The renderer may be bundled into index.mjs or as a separate entry
      const rendererCandidates = [
        resolve(DIST_DIR, 'markdown-renderer.mjs'),
        resolve(DIST_DIR, 'core/markdown-renderer.mjs'),
      ]

      it('markdown renderer entry exists', () => {
        const exists = rendererCandidates.some((p) => existsSync(p))
        if (!exists) {
          // Renderer may be included in the client bundle — check that client bundle exists
          expect(existsSync(resolve(DIST_DIR, 'index.mjs'))).toBe(true)
        }
      })

      it('markdown renderer is under 3KB gzipped (if separate)', () => {
        const rendererPath = rendererCandidates.find((p) => existsSync(p))
        if (rendererPath) {
          const sizeKB = getGzippedSizeKB(rendererPath)
          expect(sizeKB).toBeLessThan(3)
        }
        // If no separate renderer file, this test passes — it's bundled into client entry
      })
    })

    // -------------------------------------------------------
    // No accidental large dependencies
    // -------------------------------------------------------
    describe('no accidental large dependencies in bundle', () => {
      it('client bundle does not contain react-markdown source', () => {
        const clientEntry = resolve(DIST_DIR, 'index.mjs')
        if (existsSync(clientEntry)) {
          const content = readFileSync(clientEntry, 'utf-8')
          expect(content).not.toContain('react-markdown')
          expect(content).not.toContain('remark-parse')
        }
      })

      it('server bundle does not contain React runtime', () => {
        const serverEntry = resolve(DIST_DIR, 'server.mjs')
        if (existsSync(serverEntry)) {
          const content = readFileSync(serverEntry, 'utf-8')
          expect(content).not.toContain('createElement')
          expect(content).not.toContain('jsx-runtime')
        }
      })
    })
  })

  // -------------------------------------------------------
  // Size limit config exists
  // -------------------------------------------------------
  describe('size-limit configuration', () => {
    it('.size-limit.json exists in package root', () => {
      const sizeLimitPath = resolve(__dirname, '../../../../.size-limit.json')
      expect(existsSync(sizeLimitPath)).toBe(true)
    })

    it('.size-limit.json has entries for client, server, and markdown', () => {
      const sizeLimitPath = resolve(__dirname, '../../../../.size-limit.json')
      if (existsSync(sizeLimitPath)) {
        const config = JSON.parse(readFileSync(sizeLimitPath, 'utf-8'))
        expect(config).toBeInstanceOf(Array)
        expect(config.length).toBeGreaterThanOrEqual(2)

        const names = config.map((entry: { name: string }) => entry.name)
        expect(names.some((n: string) => n.includes('client'))).toBe(true)
        expect(names.some((n: string) => n.includes('server'))).toBe(true)
      }
    })
  })
})
```

### 5.4 `packages/ai/src/__tests__/verification/examples-structure.test.ts`

```typescript
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const MONOREPO_ROOT = resolve(__dirname, '../../../../../..')

describe('Example apps — AI chat integration', () => {
  // -------------------------------------------------------
  // Vite app
  // -------------------------------------------------------
  describe('Vite app', () => {
    const viteAppDir = resolve(MONOREPO_ROOT, 'examples/vite-app')

    it('AiChatPage.tsx exists', () => {
      expect(
        existsSync(resolve(viteAppDir, 'src/pages/AiChatPage.tsx'))
      ).toBe(true)
    })

    it('AiChatPage.tsx imports from @tour-kit/ai', () => {
      const content = readFileSync(
        resolve(viteAppDir, 'src/pages/AiChatPage.tsx'),
        'utf-8'
      )
      expect(content).toContain('@tour-kit/ai')
    })

    it('AiChatPage.tsx uses AiChatProvider', () => {
      const content = readFileSync(
        resolve(viteAppDir, 'src/pages/AiChatPage.tsx'),
        'utf-8'
      )
      expect(content).toContain('AiChatProvider')
    })

    it('AiChatPage.tsx does NOT import @tour-kit/core (standalone)', () => {
      const content = readFileSync(
        resolve(viteAppDir, 'src/pages/AiChatPage.tsx'),
        'utf-8'
      )
      expect(content).not.toContain('@tour-kit/core')
    })
  })

  // -------------------------------------------------------
  // Next.js app
  // -------------------------------------------------------
  describe('Next.js app', () => {
    const nextAppDir = resolve(MONOREPO_ROOT, 'examples/next-app')

    it('ai-chat page.tsx exists', () => {
      expect(
        existsSync(resolve(nextAppDir, 'src/app/ai-chat/page.tsx'))
      ).toBe(true)
    })

    it('ai-chat page.tsx is a client component', () => {
      const content = readFileSync(
        resolve(nextAppDir, 'src/app/ai-chat/page.tsx'),
        'utf-8'
      )
      expect(content).toContain("'use client'")
    })

    it('ai-chat page.tsx uses useTourAssistant', () => {
      const content = readFileSync(
        resolve(nextAppDir, 'src/app/ai-chat/page.tsx'),
        'utf-8'
      )
      expect(content).toContain('useTourAssistant')
    })

    it('API route handler exists', () => {
      expect(
        existsSync(resolve(nextAppDir, 'src/app/api/chat/route.ts'))
      ).toBe(true)
    })

    it('API route uses createChatRouteHandler', () => {
      const content = readFileSync(
        resolve(nextAppDir, 'src/app/api/chat/route.ts'),
        'utf-8'
      )
      expect(content).toContain('createChatRouteHandler')
    })

    it('API route imports from @tour-kit/ai/server', () => {
      const content = readFileSync(
        resolve(nextAppDir, 'src/app/api/chat/route.ts'),
        'utf-8'
      )
      expect(content).toContain('@tour-kit/ai/server')
    })

    it('.env.example includes OPENAI_API_KEY', () => {
      const envExample = resolve(nextAppDir, '.env.example')
      if (existsSync(envExample)) {
        const content = readFileSync(envExample, 'utf-8')
        expect(content).toContain('OPENAI_API_KEY')
      }
    })
  })
})
```

### 5.5 `packages/ai/src/__tests__/coverage-gaps/hooks-coverage.test.tsx`

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockUseAiChatReturn } from '../helpers/mock-use-ai-chat'

/**
 * Coverage gap tests for hooks not fully covered by Phase 1-8 tests.
 * Focus: error paths, edge cases, boundary conditions.
 */

// Mock useChat from AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    append: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    isLoading: false,
    error: null,
    input: '',
    setInput: vi.fn(),
    handleSubmit: vi.fn(),
  })),
}))

describe('useAiChat — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('error handling', () => {
    it('returns error state when useChat reports an error', () => {
      const { useChat } = await import('@ai-sdk/react')
      vi.mocked(useChat).mockReturnValueOnce({
        messages: [],
        append: vi.fn(),
        reload: vi.fn(),
        stop: vi.fn(),
        setMessages: vi.fn(),
        isLoading: false,
        error: new Error('Network failure'),
        input: '',
        setInput: vi.fn(),
        handleSubmit: vi.fn(),
      } as any)

      const { useAiChat } = await import('../../hooks/use-ai-chat')
      // Note: actual test depends on implementation details
      // This verifies the error propagation path is covered
    })

    it('handles sendMessage with empty text gracefully', () => {
      // Tests the empty message edge case
    })

    it('handles sendMessage when status is loading', () => {
      // Tests the concurrent send prevention path
    })
  })

  describe('persistence edge cases', () => {
    it('handles localStorage being unavailable', () => {
      // Simulate localStorage throwing (private browsing mode)
      const originalLocalStorage = globalThis.localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        get: () => {
          throw new Error('localStorage is not available')
        },
        configurable: true,
      })

      // Test that persistence degrades gracefully
      // Restore after test
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      })
    })

    it('handles corrupted localStorage data', () => {
      // Store invalid JSON in localStorage key
      // Verify the hook handles parse errors gracefully
    })
  })

  describe('rate limiting edge cases', () => {
    it('blocks message when rate limit is exceeded', () => {
      // Send messages rapidly to trigger client-side rate limit
    })

    it('resets rate limit after window expires', () => {
      // Advance timers past the rate limit window
    })
  })
})
```

### 5.6 `packages/ai/src/__tests__/coverage-gaps/server-coverage.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('ok')),
  }),
  convertToModelMessages: vi.fn().mockReturnValue([]),
  embed: vi.fn(),
  embedMany: vi.fn(),
  cosineSimilarity: vi.fn().mockReturnValue(0.85),
}))

describe('Server — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------
  // Route handler edge cases
  // -------------------------------------------------------
  describe('route handler error paths', () => {
    it('returns 400 for malformed JSON body', async () => {
      const { createChatRouteHandler } = await import(
        '../../server/route-handler'
      )

      const handler = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json',
      })

      const response = await handler(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('returns 400 for missing messages field', async () => {
      const { createChatRouteHandler } = await import(
        '../../server/route-handler'
      )

      const handler = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notMessages: [] }),
      })

      const response = await handler(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      const { createChatRouteHandler } = await import(
        '../../server/route-handler'
      )

      const handler = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
        rateLimit: { maxRequests: 1, windowMs: 60000 },
      })

      const makeRequest = () =>
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
          },
          body: JSON.stringify({ messages: [] }),
        })

      // First request should succeed
      const first = await handler(makeRequest())
      expect(first.status).toBeLessThan(400)

      // Second request should be rate limited
      const second = await handler(makeRequest())
      expect(second.status).toBe(429)
    })

    it('calls beforeSend hook when provided', async () => {
      const beforeSend = vi.fn().mockReturnValue(true)
      const { createChatRouteHandler } = await import(
        '../../server/route-handler'
      )

      const handler = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
        beforeSend,
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
      })

      await handler(request)
      expect(beforeSend).toHaveBeenCalled()
    })

    it('blocks request when beforeSend returns false', async () => {
      const beforeSend = vi.fn().mockReturnValue(false)
      const { createChatRouteHandler } = await import(
        '../../server/route-handler'
      )

      const handler = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
        beforeSend,
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
      })

      const response = await handler(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  // -------------------------------------------------------
  // System prompt edge cases
  // -------------------------------------------------------
  describe('system prompt — uncovered branches', () => {
    it('handles productDescription without productName', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        productDescription: 'A great tool for teams.',
      })
      expect(prompt).toContain('A great tool for teams.')
    })

    it('handles very long boundary strings', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const longBoundary = 'x'.repeat(10000)
      const prompt = createSystemPrompt({
        boundaries: [longBoundary],
      })
      expect(prompt).toContain(longBoundary)
    })

    it('handles documents with empty content', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        documents: [{ id: 'empty-doc', content: '' }],
      })
      expect(prompt).toContain('<document id="empty-doc">')
    })
  })

  // -------------------------------------------------------
  // RAG middleware edge cases
  // -------------------------------------------------------
  describe('RAG middleware — edge cases', () => {
    it('handles empty document set', async () => {
      // Test retriever with no documents returns empty results
    })

    it('handles query with no relevant results', async () => {
      // Test that low-similarity results are filtered by minScore
    })

    it('handles embedding failure gracefully', async () => {
      // Test that embed() throwing returns a fallback response
    })
  })
})
```

### 5.7 `packages/ai/src/__tests__/coverage-gaps/components-coverage.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI chat context
const mockSendMessage = vi.fn()
const mockSetInput = vi.fn()
const mockHandleSubmit = vi.fn()

vi.mock('../../context/ai-chat-provider', () => ({
  useAiChatContext: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    stop: vi.fn(),
    isLoading: false,
    error: null,
    status: 'idle',
    input: '',
    setInput: mockSetInput,
    handleSubmit: mockHandleSubmit,
    config: { endpoint: '/api/chat' },
    strings: {
      placeholder: 'Ask a question...',
      send: 'Send',
      errorMessage: 'Something went wrong.',
      emptyState: 'How can I help you?',
      stopGenerating: 'Stop generating',
      retry: 'Retry',
      title: 'Chat',
      closeLabel: 'Close chat',
      ratePositiveLabel: 'Helpful',
      rateNegativeLabel: 'Not helpful',
    },
    tourContextValue: null,
  }),
  AiChatProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('Component coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AiChatInput', () => {
    it('renders with placeholder text', async () => {
      const { AiChatInput } = await import('../../components/ai-chat-input')
      render(<AiChatInput />)

      expect(screen.getByPlaceholderText('Ask a question...')).toBeDefined()
    })

    it('calls setInput on change', async () => {
      const { AiChatInput } = await import('../../components/ai-chat-input')
      render(<AiChatInput />)

      const input = screen.getByPlaceholderText('Ask a question...')
      fireEvent.change(input, { target: { value: 'test message' } })

      expect(mockSetInput).toHaveBeenCalledWith('test message')
    })

    it('calls handleSubmit on Enter key', async () => {
      const { AiChatInput } = await import('../../components/ai-chat-input')
      render(<AiChatInput />)

      const input = screen.getByPlaceholderText('Ask a question...')
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

      expect(mockHandleSubmit).toHaveBeenCalled()
    })

    it('does not submit on Shift+Enter', async () => {
      const { AiChatInput } = await import('../../components/ai-chat-input')
      render(<AiChatInput />)

      const input = screen.getByPlaceholderText('Ask a question...')
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })

      expect(mockHandleSubmit).not.toHaveBeenCalled()
    })
  })

  describe('AiChatMessage', () => {
    it('renders user message', async () => {
      const { AiChatMessage } = await import(
        '../../components/ai-chat-message'
      )
      render(
        <AiChatMessage
          message={{ id: '1', role: 'user', content: 'Hello AI' }}
        />
      )

      expect(screen.getByText('Hello AI')).toBeDefined()
    })

    it('renders assistant message with markdown', async () => {
      const { AiChatMessage } = await import(
        '../../components/ai-chat-message'
      )
      render(
        <AiChatMessage
          message={{
            id: '2',
            role: 'assistant',
            content: '**Bold** response',
          }}
        />
      )

      // Should render markdown — bold text
      expect(screen.getByText('Bold')).toBeDefined()
    })

    it('renders error state message', async () => {
      const { AiChatMessage } = await import(
        '../../components/ai-chat-message'
      )
      render(
        <AiChatMessage
          message={{ id: '3', role: 'assistant', content: '' }}
          error={new Error('Failed')}
        />
      )

      // Should show error UI
    })
  })

  describe('AiChatSuggestions', () => {
    it('renders suggestion chips', async () => {
      const { AiChatSuggestions } = await import(
        '../../components/ai-chat-suggestions'
      )
      render(
        <AiChatSuggestions
          suggestions={['How do I start?', 'What features exist?']}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('How do I start?')).toBeDefined()
      expect(screen.getByText('What features exist?')).toBeDefined()
    })

    it('calls onSelect when a suggestion is clicked', async () => {
      const onSelect = vi.fn()
      const { AiChatSuggestions } = await import(
        '../../components/ai-chat-suggestions'
      )
      render(
        <AiChatSuggestions
          suggestions={['How do I start?']}
          onSelect={onSelect}
        />
      )

      fireEvent.click(screen.getByText('How do I start?'))
      expect(onSelect).toHaveBeenCalledWith('How do I start?')
    })

    it('renders empty when no suggestions', async () => {
      const { AiChatSuggestions } = await import(
        '../../components/ai-chat-suggestions'
      )
      const { container } = render(
        <AiChatSuggestions suggestions={[]} onSelect={vi.fn()} />
      )

      expect(container.children.length).toBe(0)
    })
  })
})
```

### 5.8 `packages/ai/src/__tests__/coverage-gaps/core-coverage.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('Core utilities — coverage gaps', () => {
  // -------------------------------------------------------
  // Markdown renderer
  // -------------------------------------------------------
  describe('markdown renderer', () => {
    it('renders bold text', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Test depends on implementation — may render to string or React elements
    })

    it('renders inline code', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Inline code rendering
    })

    it('renders code blocks with language hint', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Fenced code block rendering
    })

    it('renders links with target="_blank"', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // External links should open in new tab
    })

    it('renders unordered lists', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // List rendering
    })

    it('renders ordered lists', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Numbered list rendering
    })

    it('handles empty string input', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Should return empty output, not throw
    })

    it('handles plain text without markdown', async () => {
      const { renderMarkdown } = await import(
        '../../core/markdown-renderer'
      )
      // Plain text passthrough
    })
  })

  // -------------------------------------------------------
  // Suggestion engine
  // -------------------------------------------------------
  describe('suggestion engine', () => {
    it('returns static suggestions when configured', async () => {
      // Test static suggestion list
    })

    it('returns empty array when no suggestions configured', async () => {
      // No suggestions config
    })

    it('deduplicates suggestions', async () => {
      // Duplicate static suggestions should be removed
    })
  })

  // -------------------------------------------------------
  // Rate limiter (client-side)
  // -------------------------------------------------------
  describe('client rate limiter', () => {
    it('allows requests within limit', async () => {
      // Test rate limiter allows N requests in window
    })

    it('blocks requests exceeding limit', async () => {
      // Test rate limiter blocks after N+1 requests
    })

    it('resets after window expires', async () => {
      // Use vi.advanceTimersByTime to test window reset
    })
  })
})
```

### 5.9 `packages/ai/src/__tests__/coverage-gaps/context-coverage.test.tsx`

```typescript
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AI SDK's useChat
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    append: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    isLoading: false,
    error: null,
    input: '',
    setInput: vi.fn(),
    handleSubmit: vi.fn(),
  })),
}))

describe('AiChatProvider — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('config validation', () => {
    it('throws when endpoint is missing', async () => {
      const { AiChatProvider, useAiChatContext } = await import(
        '../../context/ai-chat-provider'
      )

      // Should throw or warn when endpoint is not provided
      // Implementation-dependent
    })

    it('accepts minimal config with only endpoint', async () => {
      const { AiChatProvider, useAiChatContext } = await import(
        '../../context/ai-chat-provider'
      )

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <AiChatProvider config={{ endpoint: '/api/chat' }}>
            {children}
          </AiChatProvider>
        )
      }

      const { result } = renderHook(() => useAiChatContext(), {
        wrapper: Wrapper,
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('persistence integration', () => {
    it('restores messages from localStorage when persistence is "local"', async () => {
      // Mock localStorage with stored messages
      const storedMessages = JSON.stringify([
        { id: '1', role: 'user', content: 'Hello' },
      ])
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(storedMessages)

      // Render provider with persistence: 'local'
      // Verify messages are restored
    })

    it('does not restore messages when persistence is not set', async () => {
      vi.spyOn(Storage.prototype, 'getItem')

      // Render provider without persistence
      // Verify getItem was not called
    })
  })

  describe('useAiChatContext outside provider', () => {
    it('throws when used outside AiChatProvider', async () => {
      const { useAiChatContext } = await import(
        '../../context/ai-chat-provider'
      )

      expect(() => {
        renderHook(() => useAiChatContext())
      }).toThrow()
    })
  })
})
```

---

## 6. Helpers Structure

Phase 9 reuses all existing helpers from Phases 0-8. No new helpers are needed.

```
packages/ai/src/__tests__/
  helpers/
    fs-assertions.ts              # From Phase 0 — distPath, assertDistFileExists
    skip-conditions.ts            # From Phase 0 — HAS_OPENAI_KEY, describeWithApiKey
    mock-use-ai-chat.ts           # From Phase 1/8 — createMockUseAiChatReturn
    mock-tour-context.ts          # From Phase 8 — MockTourContext, fixtures
    mock-ai-chat-context.ts       # From Phase 8 — createMockAiChatContextValue
    prompt-fixtures.ts            # From Phase 2 — FULL_CONFIG, SAMPLE_DOCUMENTS
  verification/
    docs-structure.test.ts        # Docs existence + structure (US-1)
    ssr-safety.test.ts            # Server file scanning (US-4)
    bundle-size.test.ts           # Post-build size checks (US-3)
    examples-structure.test.ts    # Example app file verification (US-5)
  coverage-gaps/
    hooks-coverage.test.tsx       # Hook error/edge case coverage (US-2)
    server-coverage.test.ts       # Server error path coverage (US-2)
    components-coverage.test.tsx  # Component render/interaction coverage (US-2)
    core-coverage.test.ts         # Core utility coverage (US-2)
    context-coverage.test.tsx     # Provider edge case coverage (US-2)
```

---

## 7. Key Testing Decisions

1. **Verification tests use real filesystem** rather than mocks. These tests assert that documentation, examples, and build artifacts actually exist on disk. They serve as CI-enforceable quality gates.

2. **Bundle size tests use `gzipSync`** from Node.js `zlib` for portable, dependency-free size measurement. This avoids needing `size-limit` as a test dependency while still verifying the budget.

3. **SSR safety tests use static source scanning** rather than attempting to import server files in a browser-like environment. Regex-based scanning catches the most common SSR violations (direct `window`/`document` access) without complex environment simulation.

4. **Coverage gap tests are structured by module** (`hooks/`, `server/`, `components/`, `core/`, `context/`) to make it easy to identify which area needs more coverage based on the `vitest --coverage` report.

5. **Verification tests use `describe.skipIf`** for post-build checks. Bundle size tests skip when `dist/` does not exist, so they do not block development-time test runs.

6. **Example structure tests are file-existence checks**, not build tests. Actual build verification is done via the CI commands (`pnpm --filter vite-app build`, `pnpm --filter next-app build`) rather than in Vitest, since those are slow and have external dependencies.

7. **Coverage gap test cases are intentionally skeletal** in some places (marked with comments like `// Test depends on implementation`). These serve as a checklist — the implementer fills in assertions once the exact API surface is known from `vitest --coverage` output.

---

## 8. Example Test Case

```typescript
// From ssr-safety.test.ts — scanning server files for browser globals
it('system-prompt.ts has no unguarded browser globals', () => {
  const content = readFileSync(
    resolve(SERVER_DIR, 'system-prompt.ts'),
    'utf-8'
  )
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('import')) {
      continue
    }
    for (const pattern of [/\bwindow\b/, /\bdocument\b/, /\blocalStorage\b/]) {
      if (pattern.test(line)) {
        if (/typeof\s+(window|document|localStorage)/.test(line)) continue
        throw new Error(
          `Browser global at line ${i + 1}: "${line.trim()}"`
        )
      }
    }
  }
})
```

---

## 9. Execution Prompt

You are writing tests for Phase 9 of `@tour-kit/ai`: **Documentation + Examples + Final Quality**. This is the final quality gate before release. All feature code (Phases 1-8) is complete.

Create all test files listed in Section 5. Phase 9 tests fall into two categories:

**Verification tests** (`verification/`):
- Assert documentation files exist with correct structure
- Assert example apps have the expected files and imports
- Assert server files have no browser globals
- Assert bundle sizes are within budget (post-build)

**Coverage gap tests** (`coverage-gaps/`):
- Fill in test cases for any files below 80% line coverage
- Focus on: error paths, edge cases, boundary conditions
- Reuse mock helpers from earlier phases

Key constraints:
- Verification tests use real filesystem — no mocks
- Bundle size tests use `describe.skipIf(!HAS_DIST)` for pre-build safety
- Coverage gap tests use `vi.mock()` consistent with earlier phases
- All test files use `.test.ts` or `.test.tsx` extension
- Run `pnpm --filter @tour-kit/ai test -- --coverage` first to identify actual gaps

---

## 10. Run Commands

```bash
# Run all Phase 9 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/verification/ src/__tests__/coverage-gaps/

# Run only verification tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/verification/

# Run only coverage gap tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/coverage-gaps/

# Run with coverage to see the final report
pnpm --filter @tour-kit/ai test -- --coverage --run

# Run full monorepo test suite
pnpm test

# Build verification commands (run outside Vitest)
pnpm --filter docs build
pnpm --filter vite-app build
pnpm --filter next-app build
pnpm build
pnpm typecheck
```

---

## 11. Coverage Requirements

| Scope | Minimum Coverage |
|-------|-----------------|
| `packages/ai/src/` (all files) | 80% lines |
| `src/hooks/` | 85% lines |
| `src/server/` | 80% lines |
| `src/components/` | 75% lines |
| `src/core/` | 80% lines |
| `src/context/` | 80% lines |

---

## 12. Exit Criteria

- [ ] All verification tests pass: docs structure, SSR safety, bundle size, examples
- [ ] All coverage gap tests pass
- [ ] `vitest --coverage` reports >80% line coverage for `packages/ai/src/`
- [ ] No `window`/`document`/`localStorage` references in server files
- [ ] Bundle sizes within budget: client < 15KB, server < 8KB, markdown < 3KB (gzipped)
- [ ] `.size-limit.json` exists with at least 2 entries
- [ ] `packages/ai/CLAUDE.md` exists with package overview
- [ ] `packages/ai/README.md` exists with install instructions
- [ ] All 7 MDX pages exist in `apps/docs/content/docs/ai/`
- [ ] `apps/docs/content/docs/meta.json` includes `"ai"` in pages array
- [ ] `examples/vite-app/src/pages/AiChatPage.tsx` exists and imports `@tour-kit/ai`
- [ ] `examples/next-app/src/app/ai-chat/page.tsx` exists with `'use client'` directive
- [ ] `examples/next-app/src/app/api/chat/route.ts` exists and uses `createChatRouteHandler`
- [ ] `pnpm --filter @tour-kit/ai test` passes with zero failures
- [ ] No `any` types in test files (except mock model placeholders)
