import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAllPages } from '../source-adapter.js'

interface CodeExample {
  language: string
  code: string
  pageTitle: string
  pageSlug: string
}

function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: Array<{ language: string; code: string }> = []
  let match: RegExpExecArray | null = codeBlockRegex.exec(content)

  while (match !== null) {
    blocks.push({
      language: match[1] ?? 'text',
      code: match[2].trim(),
    })
    match = codeBlockRegex.exec(content)
  }

  return blocks
}

export function registerCodeExamplesTool(server: McpServer): void {
  server.registerTool(
    'get_code_examples',
    {
      description:
        'Extract code examples from Tour Kit documentation for a specific package. Returns code blocks with language tags, source page, and context.',
      inputSchema: z.object({
        package: z
          .string()
          .describe(
            'Package name to get examples for (e.g., "core", "react", "hints", "adoption")'
          ),
        language: z
          .string()
          .optional()
          .describe('Filter by language (e.g., "typescript", "tsx", "bash")'),
        limit: z.number().optional().default(20).describe('Max examples to return (default 20)'),
      }),
    },
    async ({ package: pkg, language, limit }) => {
      const pages = getAllPages().filter((p) => p.section === pkg)

      if (pages.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No documentation found for package "${pkg}". Use list_sections to see available packages.`,
            },
          ],
        }
      }

      let examples: CodeExample[] = []

      for (const page of pages) {
        const blocks = extractCodeBlocks(page.content)
        for (const block of blocks) {
          if (language && block.language !== language) continue
          examples.push({
            ...block,
            pageTitle: page.title,
            pageSlug: page.slug,
          })
        }
      }

      examples = examples.slice(0, Math.min(limit ?? 20, 100))

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                package: pkg,
                totalExamples: examples.length,
                examples: examples.map((e) => ({
                  language: e.language,
                  code: e.code,
                  source: `${e.pageTitle} (${e.pageSlug})`,
                })),
              },
              null,
              2
            ),
          },
        ],
      }
    }
  )
}
