import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getSections } from '../source-adapter.js'

export function registerListSectionsTool(server: McpServer): void {
  server.registerTool(
    'list_sections',
    {
      description:
        'List all sections of the Tour Kit documentation with page counts. Use this to understand the documentation structure before searching or browsing.',
    },
    async () => {
      const sections = getSections()

      const formatted = sections.map((s) => ({
        name: s.name,
        slug: s.slug,
        pageCount: s.pageCount,
        description: s.description,
      }))

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      }
    }
  )
}
