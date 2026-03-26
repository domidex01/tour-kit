import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getAllPages } from '../source-adapter.js'

export function registerPagesResource(server: McpServer): void {
  server.registerResource('pages', 'docs://pages', {
    description:
      'List of all Tour Kit documentation pages with titles, descriptions, and URLs',
  }, async () => {
    const pages = getAllPages()
    const listing = pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      url: p.url,
      section: p.section,
    }))

    return {
      contents: [
        {
          uri: 'docs://pages',
          text: JSON.stringify(listing, null, 2),
        },
      ],
    }
  })
}
