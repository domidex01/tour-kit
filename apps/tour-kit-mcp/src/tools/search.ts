import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAllPages } from '../source-adapter.js'
import { SearchIndex } from '../utils/search-index.js'

let searchIndex: SearchIndex | null = null

function getSearchIndex(): SearchIndex {
  if (!searchIndex) {
    searchIndex = new SearchIndex(getAllPages())
  }
  return searchIndex
}

export function registerSearchTool(server: McpServer): void {
  server.registerTool('search_docs', {
    description:
      'Search Tour Kit documentation by keyword. Returns ranked results with title, description, URL, and relevance score.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search query (e.g., "useTour hook", "focus trap", "announcement modal")',
        ),
      section: z
        .string()
        .optional()
        .describe('Filter by section (e.g., "core", "react", "guides")'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Max results to return (default 10, max 50)'),
    }),
  }, async ({ query, section, limit }) => {
    const index = getSearchIndex()
    const results = index.search({ query, section, limit })

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No results found for "${query}"${section ? ` in section "${section}"` : ''}. Try broader search terms or remove the section filter.`,
          },
        ],
      }
    }

    const formatted = results.map((r, i) => ({
      rank: i + 1,
      title: r.page.title,
      description: r.page.description,
      url: r.page.url,
      section: r.page.section,
      score: r.score,
      matchedFields: r.matchedFields,
    }))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    }
  })
}
