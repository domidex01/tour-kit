import type { ZodError } from 'zod'
import type { LicenseState, PolarActivateResponse, PolarValidateResponse } from '../types'
import { readCache, writeCache } from './cache'
import { getCurrentDomain, isDevEnvironment, isEphemeralHost } from './domain'
import {
  createDevBypassState,
  createPreviewBypassState,
  createUnlicensedState,
  normalizeLicenseKey,
} from './license-state'
import { resolveApiBase } from './resolve-api-base'
import { PolarActivateResponseSchema, PolarValidateResponseSchema } from './schemas'

/**
 * Options bag accepted by every low-level Polar call and by `validateLicenseKey`.
 *
 * `apiBase` is the load-bearing knob for the Polar → tourkit-dash issuer
 * migration (plan/15f). When omitted the call falls through `resolveApiBase()`
 * to the env-var chain and finally the Polar default.
 */
export type ValidateOptions = {
  apiBase?: string
}

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
  activationId?: string,
  options?: ValidateOptions
): Promise<PolarValidateResponse> {
  const body: Record<string, string> = {
    key,
    organization_id: organizationId,
  }
  if (activationId) {
    body.activation_id = activationId
  }

  const res = await fetch(`${resolveApiBase(options?.apiBase)}/validate`, {
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
  label: string,
  options?: ValidateOptions
): Promise<PolarActivateResponse> {
  const res = await fetch(`${resolveApiBase(options?.apiBase)}/activate`, {
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
  activationId: string,
  options?: ValidateOptions
): Promise<void> {
  const res = await fetch(`${resolveApiBase(options?.apiBase)}/deactivate`, {
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

// Dedupe the over-limit warning so a re-validation storm does not spam the
// console. One line per domain per session is enough to be actionable.
const warnedDomains = new Set<string>()

function warnActivationLimitReached(domain: string): void {
  if (warnedDomains.has(domain)) return
  warnedDomains.add(domain)
  console.warn(
    `[tour-kit/license] License valid, but its activation limit is reached, so "${domain}" could not claim a slot. Tour Kit Pro stays unlocked here. Free a slot or raise the activation limit for this key in your Polar dashboard. Tip: preview/throwaway deploy URLs are skipped automatically and do not consume slots.`
  )
}

// ---------------------------------------------------------------------------
// Orchestrator — single public entry point
// ---------------------------------------------------------------------------

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrator with multiple validation paths
export async function validateLicenseKey(
  key: string,
  organizationId?: string,
  options?: ValidateOptions
): Promise<LicenseState> {
  const domain = getCurrentDomain()
  const orgId = organizationId ?? ''
  const now = Date.now()
  const normalizedKey = normalizeLicenseKey(key)

  // 0. Missing or whitespace-only key is unlicensed on every host — including
  //    localhost. Must run before cache reads so an old valid cache entry
  //    cannot mask an empty env var, and before the dev bypass so a developer
  //    sees the same unlicensed watermark locally that production would show.
  if (normalizedKey.length === 0) {
    return createUnlicensedState(now)
  }

  // 1. Dev bypass — only for non-empty keys. We do not validate locally
  //    because that would consume Polar activation slots during normal dev.
  if (isDevEnvironment()) {
    return createDevBypassState(now)
  }

  // 1b. Ephemeral / preview hosts (Vercel/Netlify/Cloudflare preview URLs,
  //     tunnels, raw IPs). Skip Polar entirely so a throwaway deploy URL never
  //     consumes one of the key's finite activation slots. Pro stays unlocked
  //     (no watermark); stable production hosts fall through to validation.
  if (domain && isEphemeralHost(domain)) {
    return createPreviewBypassState(now)
  }

  // 2. Cache check (bound to current key — switching licenseKey invalidates)
  if (domain) {
    const cached = readCache(domain, normalizedKey)
    if (cached) return cached
  }

  try {
    // 3. Validate against the issuer (Polar by default; tourkit-dash when
    //    `options.apiBase` or the TOUR_KIT_LICENSE_API_BASE env var overrides
    //    the default — see plan/15f).
    const response = await validateKey(normalizedKey, orgId, undefined, options)

    // 4. Map Polar status to LicenseState
    const serverValidatedAt = response.lastValidatedAt
      ? Date.parse(response.lastValidatedAt) || null
      : null

    if (response.status === 'revoked' || response.status === 'disabled') {
      const state: LicenseState = {
        status: 'revoked',
        tier: 'free',
        activations: response.usage,
        maxActivations: response.limitActivations ?? 0,
        domain,
        expiresAt: null,
        validatedAt: now,
        serverValidatedAt,
        renderKey: undefined,
      }
      if (domain) writeCache(domain, state, normalizedKey)
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
        serverValidatedAt,
        renderKey: undefined,
      }
      if (domain) writeCache(domain, state, normalizedKey)
      return state
    }

    // 5. Auto-activate if no activation for this domain
    let activationLabel = response.activation?.label ?? null
    let usage = response.usage

    if (!response.activation && domain) {
      try {
        const activateResponse = await activateKey(normalizedKey, orgId, domain, options)
        activationLabel = activateResponse.label
        usage = activateResponse.licenseKey.usage
      } catch (activationError) {
        // 5a. Activation limit reached (403). The key itself is `granted` — the
        //     customer paid; they just have more live domains than slots (very
        //     common once Vercel/Netlify preview URLs pile up). Punishing a
        //     paying customer's production site with the "Unlicensed" watermark
        //     is a false positive, so treat this as a valid Pro license, warn
        //     once, and let the over-activation surface server-side instead.
        if (activationError instanceof PolarApiError && activationError.statusCode === 403) {
          warnActivationLimitReached(domain)
          const overLimitState: LicenseState = {
            status: 'valid',
            tier: 'pro',
            activations: response.usage,
            maxActivations: response.limitActivations ?? 0,
            domain,
            expiresAt: response.expiresAt,
            validatedAt: now,
            serverValidatedAt,
            renderKey: generateRenderKey(normalizedKey, domain),
          }
          writeCache(domain, overLimitState, normalizedKey)
          return overLimitState
        }
        throw activationError
      }
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
        serverValidatedAt: null,
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
      serverValidatedAt,
      renderKey: generateRenderKey(normalizedKey, activationLabel),
    }
    if (domain) writeCache(domain, state, normalizedKey)
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
        serverValidatedAt: null,
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
        serverValidatedAt: null,
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
        serverValidatedAt: null,
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
      serverValidatedAt: null,
      renderKey: undefined,
    }
  }
}
