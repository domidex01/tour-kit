import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getPage } from '../source-adapter.js'

export function registerGetPageTool(server: McpServer): void {
  server.registerTool('get_page', {
    description:
      'Retrieve the full content of a Tour Kit documentation page by its slug. Returns the page title, description, and complete markdown content. Use search_docs first to find the correct slug.',
    inputSchema: z.object({
      slug: z
        .string()
        .describe(
          'Page slug (e.g., "core/hooks/use-tour", "getting-started/installation")',
        ),
    }),
  }, async ({ slug }) => {
    const page = getPage(slug)

    if (!page) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Page not found: "${slug}". Use search_docs to find the correct slug, or list_sections to browse available sections.`,
          },
        ],
      }
    }

    const output = [
      `# ${page.title}`,
      '',
      page.description ? `> ${page.description}` : '',
      '',
      `**URL:** ${page.url}`,
      `**Section:** ${page.section}`,
      '',
      '---',
      '',
      page.content,
    ]
      .filter(Boolean)
      .join('\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: output,
        },
      ],
    }
  })
}
