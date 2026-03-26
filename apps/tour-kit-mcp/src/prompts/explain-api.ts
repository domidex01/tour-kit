import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function registerExplainApiPrompt(server: McpServer): void {
  server.registerPrompt('explain-api', {
    description:
      'Generate a prompt that asks Claude to explain a Tour Kit API (hook, component, or utility) with examples, parameters, and common patterns.',
    argsSchema: {
      api: z
        .string()
        .describe(
          'API name to explain (e.g., "useTour", "TourCard", "TourProvider")',
        ),
      detail: z
        .enum(['brief', 'detailed'])
        .optional()
        .default('detailed')
        .describe('Level of detail'),
    },
  }, ({ api, detail }) => {
    const detailInstructions =
      detail === 'brief'
        ? 'Give a concise explanation (2-3 paragraphs max). Focus on what it does and a single usage example.'
        : 'Give a thorough explanation including: purpose, all parameters/props with types, return values, a basic usage example, an advanced usage example, and common pitfalls.'

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Explain the Tour Kit API: \`${api}\`.`,
              '',
              detailInstructions,
              '',
              'Use the search_docs and get_page tools to find the official documentation for this API before answering. Base your explanation on the actual documentation, not general knowledge.',
            ].join('\n'),
          },
        },
      ],
    }
  })
}
