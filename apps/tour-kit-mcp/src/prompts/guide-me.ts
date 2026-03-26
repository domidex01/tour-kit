import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function registerGuideMePrompt(server: McpServer): void {
  server.registerPrompt('guide-me', {
    description:
      'Generate a prompt that asks Claude to guide the user through implementing a specific Tour Kit feature step by step.',
    argsSchema: {
      goal: z
        .string()
        .describe(
          'What the user wants to achieve (e.g., "create a multi-step onboarding tour", "add hint beacons to my app")',
        ),
      framework: z
        .enum([
          'next-app-router',
          'next-pages-router',
          'vite',
          'remix',
          'other',
        ])
        .optional()
        .default('next-app-router')
        .describe('Target framework'),
      experience: z
        .enum(['beginner', 'intermediate', 'advanced'])
        .optional()
        .default('intermediate')
        .describe('User experience level with Tour Kit'),
    },
  }, ({ goal, framework, experience }) => {
    const frameworkNote =
      framework === 'other'
        ? 'The user is using a React framework not listed. Provide generic React instructions.'
        : `The user is using ${framework}.`

    const experienceNote = {
      beginner:
        'Assume the user has never used Tour Kit before. Start from installation.',
      intermediate:
        'Assume Tour Kit is already installed. Focus on the implementation.',
      advanced:
        'Skip basics. Focus on advanced patterns, optimization, and edge cases.',
    }[experience]

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Guide me through: ${goal}`,
              '',
              `${frameworkNote} ${experienceNote}`,
              '',
              'Use the search_docs, get_page, and get_code_examples tools to find relevant documentation and examples. Provide a step-by-step implementation guide with code snippets from the official docs.',
            ].join('\n'),
          },
        },
      ],
    }
  })
}
