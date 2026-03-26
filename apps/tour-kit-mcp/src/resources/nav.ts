import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getSections } from '../source-adapter.js'

export function registerNavResource(server: McpServer): void {
  server.registerResource(
    'nav',
    'docs://nav',
    {
      description: 'Navigation tree of Tour Kit documentation sections with page counts',
    },
    async () => {
      const sections = getSections()

      return {
        contents: [
          {
            uri: 'docs://nav',
            text: JSON.stringify(sections, null, 2),
          },
        ],
      }
    }
  )
}
