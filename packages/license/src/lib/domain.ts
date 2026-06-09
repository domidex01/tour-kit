const DEV_HOSTNAMES = ['localhost', '127.0.0.1']
const DEV_SUFFIX = '.local'

/**
 * Throwaway / preview hostnames that change on every deploy. Activating these
 * would silently burn the customer's finite Polar activation slots — a single
 * busy Vercel/Netlify preview workflow can exhaust a 5-slot key in days. We
 * skip activation for them entirely (Pro stays unlocked, no watermark, no slot
 * consumed). Stable production hosts — including a bare `project.vercel.app` —
 * are deliberately NOT matched here, so real deployments still require a key.
 *
 * Patterns are intentionally narrow: they target the branch/hash/deploy-preview
 * segments that only ephemeral URLs carry, never the production alias.
 */
const EPHEMERAL_HOST_PATTERNS: RegExp[] = [
  // Vercel previews: project-git-branch-team.vercel.app, project-<hash>-team.vercel.app
  /-git-[^.]+\.vercel\.app$/i,
  /-[a-z0-9]{9,}-[^.]+\.vercel\.app$/i,
  // Netlify branch deploys / deploy previews: branch--site.netlify.app, deploy-preview-123--site.netlify.app
  /--[^.]+\.netlify\.app$/i,
  // Cloudflare Pages previews: <hash>.<project>.pages.dev
  /^[a-z0-9]{8}\.[^.]+\.pages\.dev$/i,
  // Local tunnels used during dev/demo
  /\.ngrok(?:-free)?\.app$/i,
  /\.ngrok\.io$/i,
  /\.loca\.lt$/i,
  /\.trycloudflare\.com$/i,
]

// Bare IPv4 / IPv6 hosts are never a licensed production domain.
const IP_HOST = /^(?:\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-f]*:[0-9a-f:]+\]?$/i

export function getCurrentDomain(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hostname
}

export function isDevEnvironment(): boolean {
  const domain = getCurrentDomain()
  if (!domain) return false
  return DEV_HOSTNAMES.includes(domain) || domain.endsWith(DEV_SUFFIX)
}

/**
 * True for ephemeral preview/tunnel hosts (see `EPHEMERAL_HOST_PATTERNS`) and
 * raw IP hosts. Callers treat these like dev: skip Polar, unlock Pro, consume
 * no activation slot. `isDevEnvironment()` hosts are excluded since they are
 * already handled by the dev bypass upstream.
 */
export function isEphemeralHost(domain: string | null = getCurrentDomain()): boolean {
  if (!domain) return false
  if (IP_HOST.test(domain)) return true
  return EPHEMERAL_HOST_PATTERNS.some((pattern) => pattern.test(domain))
}

/**
 * Compares current hostname against the stored activation label.
 * Logs a console warning on mismatch. Soft enforcement only —
 * returns boolean but never blocks rendering.
 */
export function validateDomainAtRender(activationLabel: string): boolean {
  const currentDomain = getCurrentDomain()
  if (!currentDomain) return true // SSR — cannot check, assume ok
  if (isDevEnvironment()) return true // dev — always pass

  if (currentDomain !== activationLabel) {
    console.warn(
      `[tour-kit/license] Domain mismatch: license activated for "${activationLabel}" but running on "${currentDomain}". Components will render with a watermark. Activate this domain in your Polar dashboard or contact support.`
    )
    return false
  }
  return true
}
