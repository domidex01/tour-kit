/**
 * Cloud SDK token (JWT) validator.
 *
 * Validates EdDSA-signed JWTs minted by the Tour Kit Cloud dashboard
 * (`/settings/sdk-tokens`) or by a customer's own self-host dashboard. The
 * server side is documented in Plan 12C; this module implements §12C.11 of
 * that plan.
 *
 * Why `@noble/ed25519` instead of Web Crypto's native EdDSA (Plan 12C D7):
 *   Native Web Crypto support for the curve only landed in Chrome 137
 *   (May 2026). Combined coverage of Chrome 137+ / Firefox 129+ / Safari 17+
 *   is ≈79% of customer end-users; the remaining ≈21% would see
 *   `NotSupportedError` and a watermark despite a valid Pro token.
 *   `@noble/ed25519` runs in every JS runtime and adds ≈5 KB gzipped.
 *   The static check in `cloud-token-no-subtle.test.ts` enforces this rule.
 *
 * Algorithm pinning (Plan 12C §12C.11 step 2):
 *   The verifier hard-codes Ed25519. `header.alg` is checked equal to
 *   `'EdDSA'` and discarded — never passed to a verifier dispatcher. Passing
 *   the header alg in is the classic JWT algorithm-confusion attack vector
 *   (e.g. forged `alg: 'HS256'` token + public key used as HMAC secret).
 */
import * as ed25519 from '@noble/ed25519'
import type { LicenseState } from '../types'
import { readDocumentCache, writeDocumentCache } from './cache'
import { getCurrentDomain, isDevEnvironment } from './domain'

const JWKS_CACHE_TTL_MS = 60 * 60 * 1000 // 1h (matches CDN max-age=3600)
const REVOCATIONS_CACHE_TTL_MS = 15 * 60 * 1000 // 15min (matches D6 SLO)
const RENDER_KEY_LENGTH = 24

const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1'])
const DEV_SUFFIX = '.local'

type Jwk = { kty: string; crv: string; x: string; kid: string }
type JwksResponse = { keys: Jwk[] }
type RevocationsResponse = { revoked: Array<{ jti: string; revokedAt: string }> }

type JwtHeader = { alg: string; kid: string; typ: string }
type JwtPayload = {
  iss: string
  sub: string
  aud: string[]
  iat: number
  exp: number
  jti: string
  tier: 'starter' | 'pro' | 'business' | 'enterprise'
  plan: string
  packages: string[]
}

/**
 * Distinguishes a Cloud JWT from a Polar key. The discriminator is purely
 * structural — Polar keys start with `TOURKIT-`; JWTs are three base64url
 * segments separated by `.`. False positives are impossible for any real
 * Polar key (they contain a literal hyphen, not a dot).
 */
export function isCloudToken(key: string): boolean {
  if (key.startsWith('TOURKIT-')) return false
  const parts = key.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p))
}

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64url.length % 4)) % 4)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64urlToJson<T>(b64url: string): T {
  const bytes = base64urlToBytes(b64url)
  const text = new TextDecoder().decode(bytes)
  return JSON.parse(text) as T
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] as number)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function isLocalHost(hostname: string): boolean {
  return DEV_HOSTNAMES.has(hostname) || hostname.endsWith(DEV_SUFFIX)
}

/**
 * Plan 12C.4 — renderKey = base64url(sha256(`${jti}:${sub}`)).slice(0, 24).
 * Keeps the LicenseGate anti-bypass primitive intact without exposing the
 * raw JWT to any consumer that reads `LicenseState`.
 */
async function computeRenderKey(jti: string, sub: string): Promise<string> {
  const input = new TextEncoder().encode(`${jti}:${sub}`)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return bytesToBase64url(new Uint8Array(hash)).slice(0, RENDER_KEY_LENGTH)
}

async function fetchJwks(iss: string): Promise<JwksResponse | null> {
  const cacheKey = `jwks:${iss}`
  try {
    const res = await fetch(`${iss}/.well-known/jwks.json`, { credentials: 'omit' })
    if (!res.ok) throw new Error(`jwks ${res.status}`)
    const json = (await res.json()) as JwksResponse
    writeDocumentCache(cacheKey, json)
    return json
  } catch {
    // Network failure: fall back to fresh cache if present. Signature still
    // fails closed if no cache is available — the caller propagates `error`.
    return readDocumentCache<JwksResponse>(cacheKey, JWKS_CACHE_TTL_MS)
  }
}

async function fetchRevocations(iss: string): Promise<RevocationsResponse> {
  const cacheKey = `rev:${iss}`
  try {
    const res = await fetch(`${iss}/.well-known/tourkit-sdk-revocations.json`, {
      credentials: 'omit',
    })
    if (!res.ok) throw new Error(`revocations ${res.status}`)
    const json = (await res.json()) as RevocationsResponse
    writeDocumentCache(cacheKey, json)
    return json
  } catch {
    // Plan 12C §12C.11 network behavior: revocation fetch failure fails OPEN
    // for revocation only (signature/exp still fail closed). Warn loudly so a
    // CSP/CDN misconfiguration surfaces in customer error monitoring instead
    // of silently masking a revoked token.
    const cached = readDocumentCache<RevocationsResponse>(cacheKey, REVOCATIONS_CACHE_TTL_MS)
    if (cached) return cached
    console.warn(
      '[tour-kit/license] Could not fetch SDK revocation list; failing open for revocation only. Signature and expiry still enforced.'
    )
    return { revoked: [] }
  }
}

function jwkToPublicKeyBytes(jwk: Jwk): Uint8Array {
  if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519') {
    throw new Error(`Unsupported JWK kty/crv: ${jwk.kty}/${jwk.crv}`)
  }
  return base64urlToBytes(jwk.x)
}

function errorState(now: number): LicenseState {
  return {
    status: 'error',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    renderKey: undefined,
  }
}

function invalidState(now: number): LicenseState {
  return {
    status: 'invalid',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    renderKey: undefined,
  }
}

function revokedState(now: number, expiresAt: string | null): LicenseState {
  return {
    status: 'revoked',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt,
    validatedAt: now,
    renderKey: undefined,
  }
}

function expiredState(now: number, expiresAt: string | null): LicenseState {
  return {
    status: 'expired',
    tier: 'pro',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt,
    validatedAt: now,
    renderKey: undefined,
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validator orchestrates the 9 steps from Plan 12C §12C.11
export async function validateCloudToken(token: string): Promise<LicenseState> {
  const now = Date.now()
  const parts = token.split('.')
  if (parts.length !== 3) return invalidState(now)
  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string]

  // 1-2. Decode + algorithm pinning. Reject before any signature work so
  //      algorithm-confusion attempts (alg=HS256, alg=none, alg=RS256) never
  //      reach the verifier.
  let header: JwtHeader
  let payload: JwtPayload
  try {
    header = base64urlToJson<JwtHeader>(encodedHeader)
    payload = base64urlToJson<JwtPayload>(encodedPayload)
  } catch {
    return invalidState(now)
  }
  if (header.alg !== 'EdDSA' || header.typ !== 'JWT') return invalidState(now)
  if (
    typeof header.kid !== 'string' ||
    typeof payload.iss !== 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number' ||
    !Array.isArray(payload.aud) ||
    !payload.aud.every((d) => typeof d === 'string')
  ) {
    return invalidState(now)
  }

  // 3. Require HTTPS issuer, except for local/self-host dev origins.
  const issIsHttps = payload.iss.startsWith('https://')
  const issIsLocalhost =
    payload.iss.startsWith('http://localhost') || payload.iss.startsWith('http://127.0.0.1')
  if (!issIsHttps && !issIsLocalhost) return invalidState(now)

  // 4. Fetch JWKS (with 1h cache fallback on network failure). Defend against
  //    a malformed response — we're at a system boundary, and a cached
  //    malformed JWKS would otherwise crash every subsequent validation.
  const jwks = await fetchJwks(payload.iss)
  if (!jwks || !Array.isArray(jwks.keys)) return errorState(now)
  const jwk = jwks.keys.find((k) => k && k.kid === header.kid)
  if (!jwk) return invalidState(now)

  // 5. Verify Ed25519 signature. The algorithm is HARDCODED — never picked
  //    from `header.alg`. See module doc comment for the attack model.
  let signatureValid: boolean
  try {
    const publicKey = jwkToPublicKeyBytes(jwk)
    const signature = base64urlToBytes(encodedSignature)
    const message = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    signatureValid = await ed25519.verifyAsync(signature, message, publicKey)
  } catch {
    return invalidState(now)
  }
  if (!signatureValid) return invalidState(now)

  // 6. Check exp / iat. iat is informational — we don't reject tokens issued
  //    in the future to absorb client/server clock drift, but exp is hard.
  const nowSec = Math.floor(now / 1000)
  const expiresAtIso = new Date(payload.exp * 1000).toISOString()
  if (payload.exp <= nowSec) return expiredState(now, expiresAtIso)

  // 7. Check revocation list (fails OPEN on network failure — see fetchRevocations).
  const revocations = await fetchRevocations(payload.iss)
  if (revocations.revoked.some((r) => r.jti === payload.jti)) {
    return revokedState(now, expiresAtIso)
  }

  // 8. Check `aud` against the current hostname. Empty `aud` is allowed with
  //    a warning (intentional: simplifies preview/local onboarding). Localhost
  //    bypass mirrors the dev environment policy used by Polar keys.
  const hostname = getCurrentDomain()
  if (payload.aud.length === 0) {
    console.warn(
      '[tour-kit/license] Cloud SDK token has no allowed domains. Token will be accepted on any host. Set allowed domains in Settings → SDK tokens to restrict it.'
    )
  } else if (hostname !== null && !isLocalHost(hostname) && !payload.aud.includes(hostname)) {
    return invalidState(now)
  }

  // 9. Return valid Pro state with anti-bypass renderKey.
  const renderKey = await computeRenderKey(payload.jti, payload.sub)
  return {
    status: 'valid',
    tier: 'pro',
    activations: 0,
    maxActivations: 0,
    domain: hostname,
    expiresAt: expiresAtIso,
    validatedAt: now,
    renderKey,
  }
}

/**
 * Re-export `isDevEnvironment` and the cache TTL constants for tests and for
 * any downstream consumer that wants to mirror the SDK's caching policy.
 */
export { isDevEnvironment }
export const CLOUD_TOKEN_TTL = {
  jwksMs: JWKS_CACHE_TTL_MS,
  revocationsMs: REVOCATIONS_CACHE_TTL_MS,
}
