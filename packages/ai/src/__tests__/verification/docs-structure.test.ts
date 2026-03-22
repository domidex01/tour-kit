import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Use process.cwd() which is the package root (packages/ai/)
const PKG_ROOT = process.cwd()
const MONOREPO_ROOT = resolve(PKG_ROOT, '../..')
const DOCS_DIR = resolve(MONOREPO_ROOT, 'apps/docs/content/docs/ai')
const ROOT_META = resolve(MONOREPO_ROOT, 'apps/docs/content/docs/meta.json')

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
    const pkgDir = PKG_ROOT

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
