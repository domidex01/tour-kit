import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerExplainApiPrompt } from './prompts/explain-api.js'
import { registerGuideMePrompt } from './prompts/guide-me.js'
import { registerNavResource } from './resources/nav.js'
import { registerPagesResource } from './resources/pages.js'
import { registerCodeExamplesTool } from './tools/code-examples.js'
import { registerGetPageTool } from './tools/get-page.js'
import { registerListSectionsTool } from './tools/list-sections.js'
import { registerSearchTool } from './tools/search.js'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'tour-kit-docs',
    version: '0.1.0',
  })

  // Register resources
  registerPagesResource(server)
  registerNavResource(server)

  // Register tools
  registerSearchTool(server)
  registerGetPageTool(server)
  registerListSectionsTool(server)
  registerCodeExamplesTool(server)

  // Register prompts
  registerExplainApiPrompt(server)
  registerGuideMePrompt(server)

  return server
}
