import { z } from 'zod'

/**
 * Polar validate response schema — snake_case matching wire format.
 */
export const PolarValidateResponseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  status: z.enum(['granted', 'revoked', 'disabled']),
  key: z.string(),
  limit_activations: z.number().nullable(),
  usage: z.number(),
  validations: z.number(),
  last_validated_at: z.string(),
  expires_at: z.string().nullable(),
  activation: z
    .object({
      id: z.string(),
      license_key_id: z.string(),
      label: z.string(),
      meta: z.record(z.string(), z.unknown()),
      created_at: z.string(),
      modified_at: z.string().nullable(),
    })
    .nullable(),
})

/**
 * Polar activate response schema — snake_case matching wire format.
 */
export const PolarActivateResponseSchema = z.object({
  id: z.string(),
  license_key_id: z.string(),
  label: z.string(),
  meta: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  modified_at: z.string().nullable(),
  license_key: z.object({
    id: z.string(),
    organization_id: z.string(),
    status: z.enum(['granted', 'revoked', 'disabled']),
    limit_activations: z.number().nullable(),
    usage: z.number(),
    limit_usage: z.number().nullable(),
    validations: z.number(),
    last_validated_at: z.string(),
    expires_at: z.string().nullable(),
  }),
})

/**
 * Cache schema — flat LicenseState shape.
 *
 * `keyHash` is optional for backward compatibility with v1.0.x cache entries
 * that predate the per-key hash. New entries always set it; readers ignore the
 * field when the caller does not pass a current `key` to compare against.
 */
export const LicenseCacheSchema = z.object({
  state: z.object({
    status: z.enum(['valid', 'invalid', 'expired', 'revoked', 'loading', 'error']),
    tier: z.enum(['free', 'pro']),
    activations: z.number(),
    maxActivations: z.number(),
    domain: z.string().nullable(),
    expiresAt: z.string().nullable(),
    validatedAt: z.number(),
    renderKey: z.string().optional(),
  }),
  cachedAt: z.number(),
  domain: z.string(),
  keyHash: z.string().optional(),
})
