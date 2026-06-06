import { type NextRequest, NextResponse } from 'next/server'

// Markdown for Agents (content negotiation).
// Requests that explicitly list text/markdown in Accept get the markdown
// variant of the page from the same URL; browsers never send text/markdown,
// so HTML stays the default. Markdown variants are served by the existing
// /llms.mdx/* routes (real source markdown, not HTML conversion) and
// /llms.mdx/home (homepage → llms.txt overview).
// See https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

export const config = {
  matcher: ['/', '/docs/:path*', '/blog/:path*'],
}

function withVary(response: NextResponse): NextResponse {
  // Same URL serves HTML or markdown depending on Accept — caches must key on it.
  response.headers.append('Vary', 'Accept')
  return response
}

export function proxy(request: NextRequest): NextResponse {
  const accept = request.headers.get('accept') ?? ''
  const { pathname } = request.nextUrl

  const wantsMarkdown =
    request.method === 'GET' &&
    accept.includes('text/markdown') &&
    // Explicit .mdx URLs already rewrite to /llms.mdx/* via next.config.mjs.
    !pathname.endsWith('.mdx') &&
    // /blog index has no markdown variant (only /blog/:slug does).
    pathname !== '/blog'

  if (!wantsMarkdown) return withVary(NextResponse.next())

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? '/llms.mdx/home' : `/llms.mdx${pathname}`
  return withVary(NextResponse.rewrite(url))
}
