import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@tour-kit/core', '@tour-kit/react', '@tour-kit/hints'],
  async headers() {
    const buildDate = new Date().toUTCString()
    return [
      {
        source: '/llms.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Last-Modified', value: buildDate },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
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
    ]
  },
}

export default withMDX(config)
