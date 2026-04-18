import type { MetadataRoute } from 'next'

const SITE_URL = 'https://usertourkit.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/_next/data/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/api/', '/_next/data/'] },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: ['/api/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Claude-SearchBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Claude-User', allow: '/', disallow: ['/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Perplexity-User', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/api/'] },
      { userAgent: '*', allow: '/', disallow: ['/api/', '/_next/data/', '/auth/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
