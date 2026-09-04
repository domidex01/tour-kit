import bundleAnalyzer from '@next/bundle-analyzer'
import { createMDX } from 'fumadocs-mdx/next'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  // Cap static-generation workers: on the 16-vCPU WSL box the default spawned ~12
  // workers at ~1GB each next to a 7-10GB build process and exhausted the VM
  // (2026-09-03, see ~/.local/state/wsl-memguard.log).
  experimental: { cpus: 4 },
  output: 'standalone',
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  transpilePackages: ['@tour-kit/core', '@tour-kit/react', '@tour-kit/hints'],
  images: {
    remotePatterns: [{ hostname: 'github.com' }, { hostname: 'avatars.githubusercontent.com' }],
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
      {
        source: '/blog/:slug.mdx',
        destination: '/llms.mdx/blog/:slug',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.usertourkit.com' }],
        destination: 'https://usertourkit.com/:path*',
        permanent: true,
      },
      {
        // Renamed 2026-05 to disambiguate from /docs/ai (runtime AI chat package).
        // This page documents LLM coding tools that *build* with Tour Kit.
        source: '/docs/ai-assistants',
        destination: '/docs/build-with-llms',
        permanent: true,
      },
    ]
  },
  async headers() {
    const buildDate = new Date().toUTCString()
    return [
      {
        source: '/llms.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Link', value: '<https://usertourkit.com/llms.txt>; rel="canonical"' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Link', value: '<https://usertourkit.com/llms-full.txt>; rel="canonical"' },
        ],
      },
      {
        // Markdown for Agents (proxy.ts): these paths serve HTML or markdown
        // from the same URL based on Accept, so caches must key on it.
        // Set here (not only in proxy.ts) because Next overwrites the Vary
        // header on page responses returned through NextResponse.next().
        source: '/',
        headers: [{ key: 'Vary', value: 'Accept' }],
      },
      {
        source: '/docs/:path*',
        headers: [{ key: 'Vary', value: 'Accept' }],
      },
      {
        source: '/blog/:path*',
        headers: [{ key: 'Vary', value: 'Accept' }],
      },
      {
        // Agent discovery (RFC 8288 Link relations; RFC 9727 api-catalog).
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</.well-known/api-catalog>; rel="api-catalog"',
              '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
              '</docs/api>; rel="service-doc"',
              '</.well-known/mcp/server-card.json>; rel="service-meta"; type="application/json"',
              '</llms.txt>; rel="describedby"; type="text/plain"',
            ].join(', '),
          },
        ],
      },
      {
        // RFC 9727 well-known API catalog (static linkset in public/).
        source: '/.well-known/api-catalog',
        headers: [
          { key: 'Content-Type', value: 'application/linkset+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/context/:path*',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Notes on CSP:
            // - script-src keeps 'unsafe-inline' because Next.js inlines hydration
            //   bootstrap scripts at static-prerender time. A nonce-based migration
            //   would require dropping prerender (every page becomes per-request).
            //   Tracked as a backlog item.
            // - style-src dropped 'unsafe-inline'. Tailwind compiles to static CSS
            //   files; inline `style="..."` attributes are governed by `style-src-attr`
            //   (unset → allowed), so the change does not break dynamic style props.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com https://mc.yandex.ru",
              "style-src 'self'",
              "style-src-attr 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://github.com https://avatars.githubusercontent.com https://usertourkit.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google.com https://mc.yandex.ru",
              "font-src 'self' data:",
              "connect-src 'self' https://api.polar.sh https://vercel.live https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://www.google.com https://*.google.com https://mc.yandex.ru",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com https://fast.wistia.net",
              "base-uri 'self'",
              "form-action 'self' https://buy.polar.sh",
              "frame-ancestors 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(withMDX(config))
