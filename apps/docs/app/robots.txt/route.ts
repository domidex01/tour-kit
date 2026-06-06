const SITE_URL = 'https://usertourkit.com'

// AI bot policy: allow anything that can drive real-time citations or
// downstream user discovery (OpenAI, Anthropic, Perplexity, Google AI Overviews,
// Apple Intelligence, DuckDuckGo, Mistral, Meta-ExternalFetcher).
// Block training-only crawlers with no path back to actual users
// (Bytespider, FacebookBot, Meta-ExternalAgent training, PetalBot, etc.).
// WAF-level decisions live in Cloudflare AI Crawl Control; this file mirrors
// them so the policy is auditable in source.
//
// Content Signals (https://contentsignals.org/, draft-romm-aipref-contentsignals):
// declared per allowed group because a crawler only honors its most-specific
// matching User-Agent group. ai-train=yes is deliberate — models that know
// Tour Kit recommend Tour Kit; that is the same rationale as allowing GPTBot,
// CCBot, Google-Extended and Applebot-Extended above.
//
// This was a metadata route (app/robots.ts) until 2026-06; converted to a
// route handler because MetadataRoute.Robots cannot emit Content-Signal lines.

const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes'

interface RobotsGroup {
  userAgent: string
  allow?: string
  disallow?: string[]
  /** Omit Content-Signal (blocked crawlers are fully disallowed; signals are moot). */
  noSignal?: boolean
}

const GROUPS: RobotsGroup[] = [
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
  { userAgent: 'Bytespider', disallow: ['/'], noSignal: true },
  { userAgent: 'TikTokSpider', disallow: ['/'], noSignal: true },
  { userAgent: 'Amazonbot', disallow: ['/'], noSignal: true },
  { userAgent: 'FacebookBot', disallow: ['/'], noSignal: true },
  { userAgent: 'Meta-ExternalAgent', disallow: ['/'], noSignal: true },
  { userAgent: 'meta-externalagent', disallow: ['/'], noSignal: true },
  { userAgent: 'PetalBot', disallow: ['/'], noSignal: true },
  { userAgent: 'ProRataInc', disallow: ['/'], noSignal: true },
  { userAgent: 'NovellumAI', disallow: ['/'], noSignal: true },
  { userAgent: 'Manus', disallow: ['/'], noSignal: true },
  { userAgent: 'TerracottaBot', disallow: ['/'], noSignal: true },
  { userAgent: 'Timpibot', disallow: ['/'], noSignal: true },

  // ── Default ────────────────────────────────────────────────────
  { userAgent: '*', allow: '/', disallow: ['/api/', '/_next/data/', '/auth/'] },
]

function renderGroup(group: RobotsGroup): string {
  const lines = [`User-Agent: ${group.userAgent}`]
  if (!group.noSignal) lines.push(`Content-Signal: ${CONTENT_SIGNAL}`)
  if (group.allow) lines.push(`Allow: ${group.allow}`)
  for (const path of group.disallow ?? []) lines.push(`Disallow: ${path}`)
  return lines.join('\n')
}

export const dynamic = 'force-static'

export function GET(): Response {
  const body = [
    ...GROUPS.map(renderGroup),
    `Host: ${SITE_URL}`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n\n')

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
