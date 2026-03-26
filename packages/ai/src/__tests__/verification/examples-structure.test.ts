import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = process.cwd()
const MONOREPO_ROOT = resolve(PKG_ROOT, '../..')

describe('Example apps — AI chat integration', () => {
  // -------------------------------------------------------
  // Vite app
  // -------------------------------------------------------
  describe('Vite app', () => {
    const viteAppDir = resolve(MONOREPO_ROOT, 'examples/vite-app')

    it('AiChatPage.tsx exists', () => {
      expect(existsSync(resolve(viteAppDir, 'src/pages/AiChatPage.tsx'))).toBe(true)
    })

    it('AiChatPage.tsx imports from @tour-kit/ai', () => {
      const content = readFileSync(resolve(viteAppDir, 'src/pages/AiChatPage.tsx'), 'utf-8')
      expect(content).toContain('@tour-kit/ai')
    })

    it('AiChatPage.tsx uses AiChatProvider', () => {
      const content = readFileSync(resolve(viteAppDir, 'src/pages/AiChatPage.tsx'), 'utf-8')
      expect(content).toContain('AiChatProvider')
    })

    it('AiChatPage.tsx does NOT import @tour-kit/core (standalone)', () => {
      const content = readFileSync(resolve(viteAppDir, 'src/pages/AiChatPage.tsx'), 'utf-8')
      expect(content).not.toContain('@tour-kit/core')
    })
  })

  // -------------------------------------------------------
  // Next.js app
  // -------------------------------------------------------
  describe('Next.js app', () => {
    const nextAppDir = resolve(MONOREPO_ROOT, 'examples/next-app')

    it('ai-chat page.tsx exists', () => {
      expect(existsSync(resolve(nextAppDir, 'src/app/ai-chat/page.tsx'))).toBe(true)
    })

    it('ai-chat page.tsx is a client component', () => {
      const content = readFileSync(resolve(nextAppDir, 'src/app/ai-chat/page.tsx'), 'utf-8')
      expect(content).toContain("'use client'")
    })

    it('ai-chat page.tsx uses useTourAssistant', () => {
      const content = readFileSync(resolve(nextAppDir, 'src/app/ai-chat/page.tsx'), 'utf-8')
      expect(content).toContain('useTourAssistant')
    })

    it('API route handler exists', () => {
      expect(existsSync(resolve(nextAppDir, 'src/app/api/chat/route.ts'))).toBe(true)
    })

    it('API route uses createChatRouteHandler', () => {
      const content = readFileSync(resolve(nextAppDir, 'src/app/api/chat/route.ts'), 'utf-8')
      expect(content).toContain('createChatRouteHandler')
    })

    it('API route imports from @tour-kit/ai/server', () => {
      const content = readFileSync(resolve(nextAppDir, 'src/app/api/chat/route.ts'), 'utf-8')
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
