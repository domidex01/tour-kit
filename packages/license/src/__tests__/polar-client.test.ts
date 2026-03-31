import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PolarApiError,
  PolarParseError,
  activateKey,
  deactivateKey,
  validateKey,
  validateLicenseKey,
} from '../lib/polar-client'
import { createMockLocalStorage, mockFetchResponse } from './helpers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_VALIDATE_RESPONSE = {
  id: 'lk_test_123',
  organization_id: 'org_test_456',
  status: 'granted' as const,
  key: 'TK-XXXX-XXXX-XXXX',
  limit_activations: 5,
  usage: 1,
  validations: 10,
  last_validated_at: '2026-03-29T00:00:00Z',
  expires_at: null,
  activation: {
    id: 'act_test_789',
    license_key_id: 'lk_test_123',
    label: 'example.com',
    meta: {},
    created_at: '2026-03-01T00:00:00Z',
    modified_at: '2026-03-01T00:00:00Z',
  },
}

const VALID_VALIDATE_RESPONSE_NO_ACTIVATION = {
  ...VALID_VALIDATE_RESPONSE,
  activation: null,
}

const REVOKED_VALIDATE_RESPONSE = {
  ...VALID_VALIDATE_RESPONSE,
  status: 'revoked' as const,
}

const EXPIRED_VALIDATE_RESPONSE = {
  ...VALID_VALIDATE_RESPONSE,
  expires_at: '2025-01-01T00:00:00Z', // in the past
}

const VALID_ACTIVATE_RESPONSE = {
  id: 'act_test_new',
  license_key_id: 'lk_test_123',
  label: 'example.com',
  meta: {},
  created_at: '2026-03-30T00:00:00Z',
  modified_at: '2026-03-30T00:00:00Z',
  license_key: {
    id: 'lk_test_123',
    organization_id: 'org_test_456',
    status: 'granted' as const,
    limit_activations: 5,
    usage: 2,
    limit_usage: null,
    validations: 11,
    last_validated_at: '2026-03-30T00:00:00Z',
    expires_at: null,
  },
}

const VALID_CACHE_ENTRY = {
  state: {
    status: 'valid' as const,
    activation: {
      id: 'act_test_789',
      licenseKeyId: 'lk_test_123',
      label: 'example.com',
      createdAt: '2026-03-01T00:00:00Z',
      modifiedAt: '2026-03-01T00:00:00Z',
    },
    expiresAt: null,
  },
  cachedAt: Date.now(),
  domain: 'example.com',
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('localStorage', createMockLocalStorage())
  vi.stubGlobal('location', { hostname: 'example.com' })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// validateKey
// ---------------------------------------------------------------------------

describe('validateKey', () => {
  it('returns parsed response for valid key', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_VALIDATE_RESPONSE))
    const result = await validateKey('TK-XXXX', 'org_test_456')

    expect(result.organizationId).toBe('org_test_456')
    expect(result.limitActivations).toBe(5)
    expect(result.lastValidatedAt).toBe('2026-03-29T00:00:00Z')
    expect(result.expiresAt).toBeNull()
    expect(result.activation?.licenseKeyId).toBe('lk_test_123')
    expect(result.activation?.createdAt).toBe('2026-03-01T00:00:00Z')
    expect(result.activation?.modifiedAt).toBe('2026-03-01T00:00:00Z')
  })

  it('throws PolarApiError for 404 (invalid key)', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ detail: 'Not found' }, 404))
    await expect(validateKey('bad-key', 'org')).rejects.toThrow(PolarApiError)
    try {
      await validateKey('bad-key', 'org')
    } catch (e) {
      expect((e as PolarApiError).statusCode).toBe(404)
    }
  })

  it('throws PolarParseError for malformed response body', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ garbage: true }))
    await expect(validateKey('key', 'org')).rejects.toThrow(PolarParseError)
  })

  it('sends correct request body', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_VALIDATE_RESPONSE))
    await validateKey('TK-XXXX', 'org_test_456')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/validate'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"organization_id"'),
      })
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.key).toBe('TK-XXXX')
    expect(body.organization_id).toBe('org_test_456')
  })
})

// ---------------------------------------------------------------------------
// activateKey
// ---------------------------------------------------------------------------

describe('activateKey', () => {
  it('returns activation with correct label', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_ACTIVATE_RESPONSE))
    const result = await activateKey('TK-XXXX', 'org_test_456', 'example.com')

    expect(result.label).toBe('example.com')
    expect(result.licenseKeyId).toBe('lk_test_123')
  })

  it('throws PolarApiError for 403 (activation limit)', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ detail: 'Activation limit reached' }, 403))
    await expect(activateKey('key', 'org', 'example.com')).rejects.toThrow(PolarApiError)
    try {
      await activateKey('key', 'org', 'example.com')
    } catch (e) {
      expect((e as PolarApiError).statusCode).toBe(403)
    }
  })

  it('sends correct request body including label', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_ACTIVATE_RESPONSE))
    await activateKey('TK-XXXX', 'org_test_456', 'example.com')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.key).toBe('TK-XXXX')
    expect(body.organization_id).toBe('org_test_456')
    expect(body.label).toBe('example.com')
  })
})

// ---------------------------------------------------------------------------
// deactivateKey
// ---------------------------------------------------------------------------

describe('deactivateKey', () => {
  it('completes successfully for 204 response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)
    await expect(deactivateKey('TK-XXXX', 'org_test_456', 'act_123')).resolves.toBeUndefined()
  })

  it('throws PolarApiError for non-ok response', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ detail: 'Not found' }, 404))
    await expect(deactivateKey('key', 'org', 'act_123')).rejects.toThrow(PolarApiError)
  })
})

// ---------------------------------------------------------------------------
// validateLicenseKey (orchestrator)
// ---------------------------------------------------------------------------

describe('validateLicenseKey', () => {
  const config = { key: 'TK-XXXX', organizationId: 'org_test_456' }

  it('returns cached state without API call (cache hit)', async () => {
    // Pre-populate cache
    localStorage.setItem('tourkit:license:example.com', JSON.stringify(VALID_CACHE_ENTRY))
    const result = await validateLicenseKey(config)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.status).toBe('valid')
  })

  it('calls validate then auto-activates on cache miss', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(VALID_VALIDATE_RESPONSE_NO_ACTIVATION))
      .mockResolvedValueOnce(mockFetchResponse(VALID_ACTIVATE_RESPONSE))

    const result = await validateLicenseKey(config)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.status).toBe('valid')
    if (result.status === 'valid') {
      expect(result.activation.id).toBe('act_test_new')
    }
  })

  it('returns valid with existing activation (no auto-activate)', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_VALIDATE_RESPONSE))
    const result = await validateLicenseKey(config)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.status).toBe('valid')
  })

  it('returns { status: "revoked" } for revoked key', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(REVOKED_VALIDATE_RESPONSE))
    const result = await validateLicenseKey(config)
    expect(result).toEqual({ status: 'revoked' })
  })

  it('returns { status: "expired" } for expired key', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(EXPIRED_VALIDATE_RESPONSE))
    const result = await validateLicenseKey(config)
    expect(result.status).toBe('expired')
    if (result.status === 'expired') {
      expect(result.expiresAt).toBe('2025-01-01T00:00:00Z')
    }
  })

  it('returns { status: "invalid", error: "invalid_key" } for 404', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ detail: 'Not found' }, 404))
    const result = await validateLicenseKey(config)
    expect(result).toEqual({ status: 'invalid', error: 'invalid_key' })
  })

  it('returns { status: "invalid", error: "activation_limit_reached" } for 403', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(VALID_VALIDATE_RESPONSE_NO_ACTIVATION))
      .mockResolvedValueOnce(mockFetchResponse({ detail: 'Limit reached' }, 403))
    const result = await validateLicenseKey(config)
    expect(result).toEqual({
      status: 'invalid',
      error: 'activation_limit_reached',
    })
  })

  it('returns { status: "error", error: "network_error" } for fetch failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const result = await validateLicenseKey(config)
    expect(result).toEqual({ status: 'error', error: 'network_error' })
  })

  it('returns synthetic valid state in dev environment', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    const result = await validateLicenseKey(config)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.status).toBe('valid')
  })

  it('writes result to cache after successful validation', async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(VALID_VALIDATE_RESPONSE))
    await validateLicenseKey(config)
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'tourkit:license:example.com',
      expect.any(String)
    )
  })
})
