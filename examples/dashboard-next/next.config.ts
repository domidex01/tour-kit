import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Phase 8 manual QA: accept HMR requests from the WSL LAN IP so non-localhost
  // host simulation hydrates correctly. Safe to keep in the demo only.
  allowedDevOrigins: ['10.255.255.254'],
}

export default nextConfig
