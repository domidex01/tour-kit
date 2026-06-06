'use client'

import { useEffect } from 'react'

// WebMCP (https://webmachinelearning.github.io/webmcp/): exposes site actions
// to browser-embedded AI agents via navigator.modelContext. Registers the same
// docs tools as the remote MCP endpoint (/api/mcp) plus an on-page navigation
// action, backed by the public docs REST API. No-op in browsers without the
// API (Chrome early preview ships it behind a flag/origin trial).
//
// Tool results use the MCP content shape: { content: [{ type: 'text', text }] }.

interface WebMcpToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

interface WebMcpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<WebMcpToolResult>
}

interface ModelContext {
  registerTool?: (tool: WebMcpTool) => unknown
  provideContext?: (context: { tools: WebMcpTool[] }) => unknown
}

function text(value: unknown, isError = false): WebMcpToolResult {
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
    ...(isError && { isError: true }),
  }
}

async function fetchJson(url: string): Promise<WebMcpToolResult> {
  const res = await fetch(url)
  if (!res.ok) return text(`Request failed: ${res.status} ${url}`, true)
  return text(await res.json())
}

const TOOLS: WebMcpTool[] = [
  {
    name: 'search_docs',
    description:
      'Search Tour Kit documentation by keyword. Returns ranked results with title, description, URL, and relevance score.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "useTour hook", "focus trap")' },
        section: { type: 'string', description: 'Filter by section (e.g., "core", "react")' },
        limit: { type: 'number', description: 'Max results (default 10, max 50)' },
      },
      required: ['query'],
    },
    execute: ({ query, section, limit }) => {
      const params = new URLSearchParams({ q: String(query ?? '') })
      if (typeof section === 'string') params.set('section', section)
      if (typeof limit === 'number') params.set('limit', String(limit))
      return fetchJson(`/api/docs/search?${params}`)
    },
  },
  {
    name: 'get_doc_page',
    description:
      'Retrieve the full markdown content of a Tour Kit documentation page by slug. Use search_docs first to find the slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Page slug (e.g., "core/hooks/use-tour")' },
      },
      required: ['slug'],
    },
    execute: ({ slug }) => fetchJson(`/api/docs/page/${String(slug ?? '')}`),
  },
  {
    name: 'get_code_examples',
    description:
      'Get code examples from Tour Kit documentation for a specific package (e.g., "core", "react", "hints").',
    inputSchema: {
      type: 'object',
      properties: {
        package: { type: 'string', description: 'Package name (e.g., "core", "react", "hints")' },
      },
      required: ['package'],
    },
    execute: ({ package: pkg }) =>
      fetchJson(`/api/docs/examples/${encodeURIComponent(String(pkg ?? ''))}`),
  },
  {
    name: 'navigate_to',
    description:
      'Navigate the current browser tab to a Tour Kit page. Accepts a site-relative path such as "/docs", "/pricing", "/blog", or a docs page like "/docs/core/hooks/use-tour".',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Site-relative path starting with "/"' },
      },
      required: ['path'],
    },
    execute: async ({ path }) => {
      const target = String(path ?? '')
      if (!target.startsWith('/') || target.startsWith('//')) {
        return text('Path must be site-relative and start with "/"', true)
      }
      window.location.assign(target)
      return text(`Navigating to ${target}`)
    },
  },
]

/** Exported for tests. Registers tools on a modelContext if the API exists. */
export function registerWebMcpTools(modelContext: ModelContext | undefined): void {
  if (!modelContext) return

  try {
    if (typeof modelContext.registerTool === 'function') {
      for (const tool of TOOLS) modelContext.registerTool(tool)
    } else if (typeof modelContext.provideContext === 'function') {
      modelContext.provideContext({ tools: TOOLS })
    }
  } catch {
    // Early-preview API surface may change; never break the page over it.
  }
}

export function WebMcp(): null {
  useEffect(() => {
    registerWebMcpTools((navigator as Navigator & { modelContext?: ModelContext }).modelContext)
  }, [])

  return null
}
