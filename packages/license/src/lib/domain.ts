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

/**
 * Multi-label public suffixes, for `toRegistrableDomain`.
 *
 * ponytail: a curated subset of the Public Suffix List, not the list itself.
 * Ceiling — a host on an uncovered multi-label suffix normalises one label too
 * short, so one key covers more than it should. Grow this table before reaching
 * for `tldts`, which would blow the 8 KB budget for this package. The exposure
 * still needs the key itself, so it is key-sharing amplification rather than an
 * open door.
 */
const MULTI_LABEL_SUFFIXES: ReadonlySet<string> = new Set([
  // ccTLD second levels
  'co.uk',
  'org.uk',
  'me.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'co.za',
  'co.in',
  'co.jp',
  'or.jp',
  'ne.jp',
  'co.kr',
  'com.cn',
  'com.hk',
  'com.sg',
  'com.tr',
  'com.br',
  'com.mx',
  'com.ar',
  'com.pl',
  'com.ua',
  // hosting suffixes where each subdomain is a different customer
  'vercel.app',
  'netlify.app',
  'pages.dev',
  'workers.dev',
  'github.io',
  'herokuapp.com',
  'fly.dev',
  'onrender.com',
  'railway.app',
  'web.app',
  'firebaseapp.com',
  'azurewebsites.net',
  'cloudfront.net',
])

/**
 * The domain a customer would call "their project". `app.foo.com` and
 * `www.foo.com` both normalise to `foo.com`, so they cost one activation slot
 * instead of two — which is what `/pricing` sells.
 *
 * Last two labels by default, which is right for every single-label TLD. The
 * table above bumps to three where two labels would name a public suffix rather
 * than a customer: without it `foo.co.uk` collapses to `co.uk` and one Starter
 * key covers every site on the registry.
 *
 * Never throws, never returns `''`, and is idempotent — `f(f(x)) === f(x)` —
 * because it is applied to the stored activation label as well as to the live
 * hostname, and those two are normalised at different times.
 */
export function toRegistrableDomain(hostname: string): string {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (host.length === 0 || IP_HOST.test(host)) return host || hostname
  const labels = host.split('.')
  if (labels.length <= 2) return host
  const candidate = labels.slice(-2).join('.')
  return MULTI_LABEL_SUFFIXES.has(candidate) ? labels.slice(-3).join('.') : candidate
}

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

  // Normalise both sides: the stored label may predate this normalisation, and
  // `app.foo.com` must validate against a key activated on `foo.com`.
  if (toRegistrableDomain(currentDomain) !== toRegistrableDomain(activationLabel)) {
    console.warn(
      `[tour-kit/license] Domain mismatch: license activated for "${activationLabel}" but running on "${currentDomain}". Components will render with a watermark. Activate this domain in your Polar dashboard or contact support.`
    )
    return false
  }
  return true
}
