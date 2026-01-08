import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@tour-kit/react',
    '@tour-kit/core',
    '@tour-kit/checklists',
    '@tour-kit/hints',
    '@tour-kit/analytics',
    '@tour-kit/adoption',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tour-kit/checklists': path.resolve(__dirname, '../../packages/checklists/dist'),
      '@tour-kit/adoption': path.resolve(__dirname, '../../packages/adoption/dist'),
    }
    return config
  },
}

export default nextConfig
