/**
 * Plan 12C §12C.11 step 2 regression: the JWT verifier must reject any
 * `header.alg` other than `EdDSA` BEFORE performing signature work.
 *
 * If the verifier ever dispatches on `header.alg`, a forged token with
 * `alg: 'HS256'` plus the public key used as the HMAC secret would validate.
 * Same risk class: `alg: 'none'` accepted unsigned tokens; `alg: 'RS256'` +
 * the public key as an RSA verify key.
 *
 * This file forges tokens with each disallowed algorithm and confirms:
 *   1. `validateCloudToken` returns `invalid` for every forge.
 *   2. No network fetch happens — proving the rejection is upstream of the
 *      JWKS/revocation hops where the actual signature check would occur.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateCloudToken } from '../lib/cloud-token'

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] as number)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function jsonToBase64url(obj: unknown): string {
  return bytesToBase64url(new TextEncoder().encode(JSON.stringify(obj)))
}

function forgeToken(header: Record<string, unknown>, payload: Record<string, unknown>): string {
  // A 64-byte garbage signature. The algorithm pin must trip before anything
  // tries to verify this against a real key.
  const fakeSig = new Uint8Array(64)
  return `${jsonToBase64url(header)}.${jsonToBase64url(payload)}.${bytesToBase64url(fakeSig)}`
}

const basePayload = {
  iss: 'https://api.usertourkit.com',
  sub: 'org_attacker',
  aud: ['localhost'],
  iat: Math.floor(Date.now() / 1000) - 60,
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: 'tok_FORGED',
  tier: 'pro',
  plan: 'pro',
  packages: [],
}

describe('validateCloudToken — algorithm pinning (anti-forgery regression)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn(async () => {
      throw new Error('fetch should NEVER be called when alg is rejected')
    })
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['HS256', 'HMAC-with-pubkey-as-secret confusion'],
    ['HS384', 'HMAC-with-pubkey-as-secret confusion'],
    ['HS512', 'HMAC-with-pubkey-as-secret confusion'],
    ['RS256', 'RSA-with-pubkey-as-key confusion'],
    ['PS256', 'RSA-PSS confusion'],
    ['ES256', 'ECDSA-P256 confusion'],
    ['none', 'unsigned token acceptance'],
    ['NONE', 'unsigned token acceptance (case variant)'],
    ['', 'empty alg'],
  ])('rejects header.alg=%s before any signature work (%s)', async (alg) => {
    const token = forgeToken({ alg, kid: 'sdk-2026-05', typ: 'JWT' }, basePayload)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects header.typ that is not JWT', async () => {
    const token = forgeToken({ alg: 'EdDSA', kid: 'sdk-2026-05', typ: 'JWE' }, basePayload)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a header missing kid', async () => {
    const token = forgeToken({ alg: 'EdDSA', typ: 'JWT' }, basePayload)

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a payload missing iss/sub/jti', async () => {
    const token = forgeToken(
      { alg: 'EdDSA', kid: 'sdk-2026-05', typ: 'JWT' },
      { aud: ['localhost'], exp: Math.floor(Date.now() / 1000) + 3600 }
    )

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a payload with non-array aud (would crash aud.includes otherwise)', async () => {
    const token = forgeToken(
      { alg: 'EdDSA', kid: 'sdk-2026-05', typ: 'JWT' },
      { ...basePayload, aud: 'app.example.com' as unknown as string[] }
    )

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a payload with non-string entries in aud', async () => {
    const token = forgeToken(
      { alg: 'EdDSA', kid: 'sdk-2026-05', typ: 'JWT' },
      { ...basePayload, aud: ['ok.com', 123 as unknown as string] }
    )

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a payload where exp is a string instead of a number', async () => {
    const token = forgeToken(
      { alg: 'EdDSA', kid: 'sdk-2026-05', typ: 'JWT' },
      { ...basePayload, exp: '9999999999' as unknown as number }
    )

    const state = await validateCloudToken(token)

    expect(state.status).toBe('invalid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
