import type { MetadataRoute } from 'next'

const SITE_URL = 'https://usertourkit.com'

// AI bot policy: allow anything that can drive real-time citations or
// downstream user discovery (OpenAI, Anthropic, Perplexity, Google AI Overviews,
// Apple Intelligence, DuckDuckGo, Mistral, Meta-ExternalFetcher).
// Block training-only crawlers with no path back to actual users
// (Bytespider, FacebookBot, Meta-ExternalAgent training, PetalBot, etc.).
// WAF-level decisions live in Cloudflare AI Crawl Control; this file mirrors
// them so the policy is auditable in source.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Search engines ─────────────────────────────────────────────
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/_next/data/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/api/', '/_next/data/'] },

      // ── OpenAI ─────────────────────────────────────────────────────
      { userAgent: 'GPTBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: ['/api/'] },

      // ── Anthropic ──────────────────────────────────────────────────
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Claude-SearchBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Claude-User', allow: '/', disallow: ['/api/'] },

      // ── Google AI ──────────────────────────────────────────────────
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Google-CloudVertexBot', allow: '/', disallow: ['/api/'] },

      // ── Apple ──────────────────────────────────────────────────────
      { userAgent: 'Applebot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: ['/api/'] },

      // ── Perplexity ─────────────────────────────────────────────────
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Perplexity-User', allow: '/', disallow: ['/api/'] },

      // ── Other allowed AI ───────────────────────────────────────────
      { userAgent: 'DuckAssistBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'MistralAI-User', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Meta-ExternalFetcher', allow: '/', disallow: ['/api/'] },
      { userAgent: 'CCBot', allow: '/', disallow: ['/api/'] },
      { userAgent: 'CloudflareBrowserRenderingCrawler', allow: '/', disallow: ['/api/'] },

      // ── Blocked AI (training-only, low-relevance, or high-bandwidth) ──
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'TikTokSpider', disallow: '/' },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'FacebookBot', disallow: '/' },
      { userAgent: 'Meta-ExternalAgent', disallow: '/' },
      { userAgent: 'meta-externalagent', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },
      { userAgent: 'ProRataInc', disallow: '/' },
      { userAgent: 'NovellumAI', disallow: '/' },
      { userAgent: 'Manus', disallow: '/' },
      { userAgent: 'TerracottaBot', disallow: '/' },
      { userAgent: 'Timpibot', disallow: '/' },

      // ── Default ────────────────────────────────────────────────────
      { userAgent: '*', allow: '/', disallow: ['/api/', '/_next/data/', '/auth/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
