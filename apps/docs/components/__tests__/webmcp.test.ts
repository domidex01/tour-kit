import { describe, expect, it, vi } from 'vitest'
import { registerWebMcpTools } from '../webmcp'

interface RegisteredTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: 'text'; text: string }>
    isError?: boolean
  }>
}

function captureTools() {
  const tools: RegisteredTool[] = []
  const registerTool = vi.fn((tool: RegisteredTool) => {
    tools.push(tool)
  })
  return { tools, registerTool }
}

describe('registerWebMcpTools', () => {
  it('is a no-op when navigator.modelContext is absent', () => {
    expect(() => registerWebMcpTools(undefined)).not.toThrow()
  })

  it('registers each tool via registerTool with the required WebMCP fields', () => {
    const { tools, registerTool } = captureTools()
    registerWebMcpTools({ registerTool })

    expect(registerTool).toHaveBeenCalled()
    expect(tools.map((t) => t.name)).toEqual([
      'search_docs',
      'get_doc_page',
      'get_code_examples',
      'navigate_to',
    ])
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10)
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.inputSchema.properties).toBeTypeOf('object')
      expect(typeof tool.execute).toBe('function')
    }
  })

  it('falls back to provideContext when registerTool is unavailable', () => {
    const provideContext = vi.fn()
    registerWebMcpTools({ provideContext })

    expect(provideContext).toHaveBeenCalledTimes(1)
    const { tools } = provideContext.mock.calls[0][0] as { tools: RegisteredTool[] }
    expect(tools).toHaveLength(4)
  })

  it('search_docs executes against the docs search API and returns MCP text content', async () => {
    const { tools, registerTool } = captureTools()
    registerWebMcpTools({ registerTool })
    const searchDocs = tools.find((t) => t.name === 'search_docs')
    if (!searchDocs) throw new Error('search_docs not registered')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [{ title: 'useTour' }], total: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchDocs.execute({ query: 'useTour', limit: 5 })
    expect(fetchMock).toHaveBeenCalledWith('/api/docs/search?q=useTour&limit=5')
    expect(result.content[0].type).toBe('text')
    expect(JSON.parse(result.content[0].text).total).toBe(1)

    vi.unstubAllGlobals()
  })

  it('navigate_to rejects non-relative and protocol-relative paths', async () => {
    const { tools, registerTool } = captureTools()
    registerWebMcpTools({ registerTool })
    const navigateTo = tools.find((t) => t.name === 'navigate_to')
    if (!navigateTo) throw new Error('navigate_to not registered')

    const evil = await navigateTo.execute({ path: 'https://evil.example' })
    expect(evil.isError).toBe(true)
    const protocolRelative = await navigateTo.execute({ path: '//evil.example' })
    expect(protocolRelative.isError).toBe(true)
  })

  it('never throws even if the early-preview API throws on registration', () => {
    const registerTool = vi.fn(() => {
      throw new Error('API changed')
    })
    expect(() => registerWebMcpTools({ registerTool })).not.toThrow()
  })
})
