// Shared headers for markdown variants served via content negotiation
// ("Markdown for Agents") and the /llms.mdx/* routes.
//
// X-Markdown-Tokens is a rough estimate (~4 chars/token for English + code),
// matching the intent of Cloudflare's Markdown for Agents header so agents
// can budget context before reading the body.
//
// Vary: Accept is load-bearing: proxy.ts serves markdown or HTML from the
// same URL based on the Accept header, so CDN caches must key on it.

export function markdownHeaders(body: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Markdown-Tokens': String(Math.ceil(body.length / 4)),
    Vary: 'Accept',
    ...extra,
  }
}
