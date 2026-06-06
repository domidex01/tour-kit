import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { markdownHeaders } from '@/lib/markdown-response'

// Markdown variant of the homepage for agents (Accept: text/markdown via
// proxy.ts). llms.txt is already the agent-oriented site overview, so it
// doubles as the homepage markdown. Baked at build time (revalidate: false).

export const revalidate = false

export function GET() {
  const body = readFileSync(join(process.cwd(), 'public', 'llms.txt'), 'utf-8')
  return new Response(body, {
    headers: markdownHeaders(body, {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    }),
  })
}
