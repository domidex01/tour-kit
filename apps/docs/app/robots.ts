import type { MetadataRoute } from 'next'

const SITE_URL = 'https://tourkit.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Bingbot', '*'],
        allow: '/',
        disallow: ['/_next/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
