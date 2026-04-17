import { generateBlogRSS } from '@/lib/rss'

export const revalidate = false

export function GET() {
  return new Response(generateBlogRSS(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
