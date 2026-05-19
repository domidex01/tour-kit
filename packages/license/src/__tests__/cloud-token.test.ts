import * as ed25519 from '@noble/ed25519'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isCloudToken, validateCloudToken } from '../lib/cloud-token'

const ISS = 'https://api.usertourkit.com'
const KID = 'sdk-2026-05'
const ORIGIN_HOST = 'app.example.com'

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] as number)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function jsonToBase64url(obj: unknown): string {
  return bytesToBase64url(new TextEncoder().encode(JSON.stringify(obj)))
}

type SignOptions = {
  alg?: string
  typ?: string
  kid?: string
  iss?: string
  sub?: string
  aud?: string[]
  iat?: number
  exp?: number
  jti?: string
  tier?: string
  signWith?: Uint8Array
}

async function signToken(privateKey: Uint8Array, opts: SignOptions = {}): Promise<string> {
  const header = {
    alg: opts.alg ?? 'EdDSA',
    kid: opts.kid ?? KID,
    typ: opts.typ ?? 'JWT',
  }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: opts.iss ?? ISS,
    sub: opts.sub ?? 'org_abc123',
    aud: opts.aud ?? [ORIGIN_HOST],
    iat: opts.iat ?? now - 60,
    exp: opts.exp ?? now + 3600,
    jti: opts.jti ?? 'tok_01HYTEST',
    tier: opts.tier ?? 'pro',
    plan: opts.tier ?? 'pro',
    packages: ['adoption', 'ai', 'analytics'],
  }
  const signingInput = `${jsonToBase64url(header)}.${jsonToBase64url(payload)}`
  const signKey = opts.signWith ?? privateKey
  const signature = await ed25519.signAsync(new TextEncoder().encode(signingInput), signKey)
  return `${signingInput}.${bytesToBase64url(signature)}`
}

type FetchMock = ReturnType<typeof vi.fn>

function mockFetchOk(
  jwks: { keys: unknown[] },
  revoked: Array<{ jti: string; revokedAt: string }>
) {
  const fetchMock: FetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/.well-known/jwks.json')) {
      return { ok: true, status: 200, json: async () => jwks } as Response
    }
    if (url.endsWith('/.well-known/tourkit-sdk-revocations.json')) {
      return { ok: true, status: 200, json: async () => ({ revoked }) } as Response
    }
    throw new Error(`Unexpected fetch ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function setHostname(hostname: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(`https://${hostname}/path`),
    writable: true,
  })
}

describe('isCloudToken', () => {
  it('returns false for empty string', () => {
    expect(isCloudToken('')).toBe(false)
  })

  it('returns false for Polar TOURKIT- keys', () => {
    expect(isCloudToken('TOURKIT-abc-123-xyz')).toBe(false)
  })

  it('returns true for a valid three-segment base64url JWT', () => {
    expect(isCloudToken('eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.aGVsbG8td29ybGQ')).toBe(true)
  })

  it('returns false for two-segment input', () => {
    expect(isCloudToken('eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0')).toBe(false)
  })

  it('returns false when a segment contains non-base64url characters', () => {
    expect(isCloudToken('eyJ!.eyJzdWIiOiJ4In0.aGVsbG8')).toBe(false)
  })

  it('returns false when any segment is empty', () => {
    expect(isCloudToken('eyJhbGciOiJFZERTQSJ9..aGVsbG8')).toBe(false)
  })
})

describe('validateCloudToken', () => {
  let privateKey: Uint8Array
  let publicKey: Uint8Array
  let jwks: { keys: Array<{ kty: string; crv: string; kid: string; x: string }> }

  beforeEach(async () => {
    localStorage.clear()
    setHostname(ORIGIN_HOST)
    privateKey = ed25519.utils.randomPrivateKey()
    publicKey = await ed25519.getPublicKeyAsync(privateKey)
    jwks = {
      keys: [{ kty: 'OKP', crv: 'Ed25519', kid: KID, x: bytesToBase64url(publicKey) }],
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns valid pro state for a well-formed signed token (happy path)', async () => {
    mockFetchOk(jwks, [])
    const token = await signToken(privateKey)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
    expect(state.tier).toBe('pro')
    expect(state.renderKey).toBeDefined()
    expect(state.renderKey).toHaveLength(24)
    expect(state.expiresAt).not.toBeNull()
    expect(state.domain).toBe(ORIGIN_HOST)
  })

  it('rejects a malformed token (not three segments)', async () => {
    const state = await validateCloudToken('not.a.valid.jwt.here')
    expect(state.status).toBe('invalid')
  })

  it('rejects a token whose signature does not verify (signed by a different key)', async () => {
    mockFetchOk(jwks, [])
    const otherKey = ed25519.utils.randomPrivateKey()
    const token = await signToken(privateKey, { signWith: otherKey })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
  })

  it('returns expired when `exp` is in the past', async () => {
    mockFetchOk(jwks, [])
    const past = Math.floor(Date.now() / 1000) - 60
    const token = await signToken(privateKey, { exp: past, iat: past - 3600 })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('expired')
    expect(state.tier).toBe('pro')
    expect(state.expiresAt).not.toBeNull()
  })

  it('returns revoked when the jti is on the revocation list', async () => {
    mockFetchOk(jwks, [{ jti: 'tok_REVOKED', revokedAt: new Date().toISOString() }])
    const token = await signToken(privateKey, { jti: 'tok_REVOKED' })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('revoked')
  })

  it('rejects when current hostname is not in aud and aud is not empty', async () => {
    mockFetchOk(jwks, [])
    setHostname('evil.com')
    const token = await signToken(privateKey, { aud: ['app.example.com'] })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
  })

  it('accepts on localhost regardless of aud', async () => {
    mockFetchOk(jwks, [])
    setHostname('localhost')
    const token = await signToken(privateKey, { aud: ['app.example.com'] })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
    expect(state.tier).toBe('pro')
  })

  it('accepts on a *.local host regardless of aud', async () => {
    mockFetchOk(jwks, [])
    setHostname('myapp.local')
    const token = await signToken(privateKey, { aud: ['app.example.com'] })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
  })

  it('warns and accepts when aud is empty', async () => {
    mockFetchOk(jwks, [])
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const token = await signToken(privateKey, { aud: [] })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no allowed domains'))
  })

  it('returns error when JWKS is unreachable and no cache is present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )
    const token = await signToken(privateKey)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('error')
  })

  it('uses cached JWKS when the network fails on a second call', async () => {
    const okMock = mockFetchOk(jwks, [])
    const token = await signToken(privateKey)
    const first = await validateCloudToken(token)
    expect(first.status).toBe('valid')

    // Network drops; cached JWKS + cached revocations should keep it valid.
    okMock.mockImplementation(async () => {
      throw new Error('network down')
    })
    const second = await validateCloudToken(token)
    expect(second.status).toBe('valid')
  })

  it('fails open for revocation when the list is unreachable (signature still enforced)', async () => {
    const fetchMock: FetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/.well-known/jwks.json')) {
        return { ok: true, status: 200, json: async () => jwks } as Response
      }
      throw new Error('revocations endpoint down')
    })
    vi.stubGlobal('fetch', fetchMock)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const token = await signToken(privateKey)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('revocation list'))
  })

  it('rejects a non-HTTPS issuer that is not localhost', async () => {
    const token = await signToken(privateKey, { iss: 'http://evil.example.com' })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
  })

  it('accepts a http://localhost issuer (self-host dev)', async () => {
    mockFetchOk(jwks, [])
    const token = await signToken(privateKey, { iss: 'http://localhost:8787' })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('valid')
  })

  it('rejects when the kid in the header is unknown to the JWKS', async () => {
    mockFetchOk(jwks, [])
    const token = await signToken(privateKey, { kid: 'unknown-kid' })

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
  })

  it('derives renderKey from sha256(`${jti}:${sub}`) — deterministic across calls', async () => {
    mockFetchOk(jwks, [])
    const token = await signToken(privateKey, { jti: 'tok_DETERMINISTIC', sub: 'org_xyz' })

    const a = await validateCloudToken(token)
    const b = await validateCloudToken(token)

    expect(a.renderKey).toBe(b.renderKey)
    expect(a.renderKey).toHaveLength(24)
  })
})
