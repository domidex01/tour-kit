import type { MetadataRoute } from 'next'

const SITE_URL = 'https://usertourkit.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Bingbot', '*'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
