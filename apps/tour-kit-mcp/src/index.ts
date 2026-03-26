import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

async function main() {
  const startTime = performance.now()

  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)

  const elapsed = performance.now() - startTime
  // Log to stderr (stdout is the MCP transport)
  console.error(`tour-kit-docs MCP server started in ${elapsed.toFixed(0)}ms`)
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error)
  process.exit(1)
})
