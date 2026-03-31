import type { ZodError } from 'zod'
import type {
  LicenseState,
  PolarActivateResponse,
  PolarValidateResponse,
} from '../types'
import { readCache, writeCache } from './cache'
import { getCurrentDomain, isDevEnvironment } from './domain'
import { PolarActivateResponseSchema, PolarValidateResponseSchema } from './schemas'

const POLAR_API_BASE = 'https://api.polar.sh/v1/customer-portal/license-keys'

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class PolarApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'PolarApiError'
  }
}

export class PolarParseError extends Error {
  constructor(public readonly zodError: ZodError) {
    super('Failed to parse Polar API response')
    this.name = 'PolarParseError'
  }
}

// ---------------------------------------------------------------------------
// Snake-case → camelCase transforms
// ---------------------------------------------------------------------------

function transformValidateResponse(
  raw: ReturnType<typeof PolarValidateResponseSchema.parse>
): PolarValidateResponse {
  return {
    id: raw.id,
    organizationId: raw.organization_id,
    status: raw.status,
    key: raw.key,
    limitActivations: raw.limit_activations,
    usage: raw.usage,
    validations: raw.validations,
    lastValidatedAt: raw.last_validated_at,
    expiresAt: raw.expires_at,
    activation: raw.activation
      ? {
          id: raw.activation.id,
          licenseKeyId: raw.activation.license_key_id,
          label: raw.activation.label,
          meta: raw.activation.meta,
          createdAt: raw.activation.created_at,
          modifiedAt: raw.activation.modified_at,
        }
      : null,
  }
}

function transformActivateResponse(
  raw: ReturnType<typeof PolarActivateResponseSchema.parse>
): PolarActivateResponse {
  return {
    id: raw.id,
    licenseKeyId: raw.license_key_id,
    label: raw.label,
    meta: raw.meta,
    createdAt: raw.created_at,
    modifiedAt: raw.modified_at,
    licenseKey: {
      id: raw.license_key.id,
      organizationId: raw.license_key.organization_id,
      status: raw.license_key.status,
      limitActivations: raw.license_key.limit_activations,
      usage: raw.license_key.usage,
      limitUsage: raw.license_key.limit_usage,
      validations: raw.license_key.validations,
      lastValidatedAt: raw.license_key.last_validated_at,
      expiresAt: raw.license_key.expires_at,
    },
  }
}

// ---------------------------------------------------------------------------
// Low-level API functions
// ---------------------------------------------------------------------------

export async function validateKey(
  key: string,
  organizationId: string,
  activationId?: string
): Promise<PolarValidateResponse> {
  const body: Record<string, string> = {
    key,
    organization_id: organizationId,
  }
  if (activationId) {
    body.activation_id = activationId
  }

  const res = await fetch(`${POLAR_API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new PolarApiError(res.status, await res.text())
  }

  const json: unknown = await res.json()
  const parsed = PolarValidateResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new PolarParseError(parsed.error)
  }

  return transformValidateResponse(parsed.data)
}

export async function activateKey(
  key: string,
  organizationId: string,
  label: string
): Promise<PolarActivateResponse> {
  const res = await fetch(`${POLAR_API_BASE}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      organization_id: organizationId,
      label,
    }),
  })

  if (!res.ok) {
    throw new PolarApiError(res.status, await res.text())
  }

  const json: unknown = await res.json()
  const parsed = PolarActivateResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new PolarParseError(parsed.error)
  }

  return transformActivateResponse(parsed.data)
}

export async function deactivateKey(
  key: string,
  organizationId: string,
  activationId: string
): Promise<void> {
  const res = await fetch(`${POLAR_API_BASE}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      organization_id: organizationId,
      activation_id: activationId,
    }),
  })

  if (!res.ok) {
    throw new PolarApiError(res.status, await res.text())
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRenderKey(key: string, domain: string | null): string {
  const input = key + (domain ?? '')
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0
  }
  return `lk_${Math.abs(hash).toString(36)}`
}

// ---------------------------------------------------------------------------
// Orchestrator — single public entry point
// ---------------------------------------------------------------------------

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrator with multiple validation paths
export async function validateLicenseKey(
  key: string,
  organizationId?: string
): Promise<LicenseState> {
  const domain = getCurrentDomain()
  const orgId = organizationId ?? ''
  const now = Date.now()

  // 1. Dev bypass
  if (isDevEnvironment()) {
    return {
      status: 'valid',
      tier: 'pro',
      activations: 0,
      maxActivations: 0,
      domain,
      expiresAt: null,
      validatedAt: now,
      renderKey: 'dev_bypass',
    }
  }

  // 2. Cache check
  if (domain) {
    const cached = readCache(domain)
    if (cached) return cached
  }

  try {
    // 3. Validate against Polar API
    const response = await validateKey(key, orgId)

    // 4. Map Polar status to LicenseState
    if (response.status === 'revoked' || response.status === 'disabled') {
      const state: LicenseState = {
        status: 'revoked',
        tier: 'free',
        activations: response.usage,
        maxActivations: response.limitActivations ?? 0,
        domain,
        expiresAt: null,
        validatedAt: now,
        renderKey: undefined,
      }
      if (domain) writeCache(domain, state)
      return state
    }

    if (response.expiresAt && new Date(response.expiresAt) < new Date()) {
      const state: LicenseState = {
        status: 'expired',
        tier: 'pro',
        activations: response.usage,
        maxActivations: response.limitActivations ?? 0,
        domain,
        expiresAt: response.expiresAt,
        validatedAt: now,
        renderKey: undefined,
      }
      if (domain) writeCache(domain, state)
      return state
    }

    // 5. Auto-activate if no activation for this domain
    let activationLabel = response.activation?.label ?? null
    let usage = response.usage

    if (!response.activation && domain) {
      const activateResponse = await activateKey(key, orgId, domain)
      activationLabel = activateResponse.label
      usage = activateResponse.licenseKey.usage
    }

    // 6. Guard: if still no activation (SSR with no prior activation), return error
    if (!activationLabel) {
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

    const state: LicenseState = {
      status: 'valid',
      tier: 'pro',
      activations: usage,
      maxActivations: response.limitActivations ?? 0,
      domain: activationLabel,
      expiresAt: response.expiresAt,
      validatedAt: now,
      renderKey: generateRenderKey(key, activationLabel),
    }
    if (domain) writeCache(domain, state)
    return state
  } catch (error) {
    if (error instanceof PolarApiError && error.statusCode === 404) {
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
    if (error instanceof PolarApiError && error.statusCode === 403) {
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
    if (error instanceof PolarParseError) {
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
}
