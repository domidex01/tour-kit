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
 * Cache schema — camelCase matching our internal types.
 */
export const LicenseCacheSchema = z.object({
  state: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('valid'),
      activation: z.object({
        id: z.string(),
        licenseKeyId: z.string(),
        label: z.string(),
        createdAt: z.string(),
        modifiedAt: z.string().nullable(),
      }),
      expiresAt: z.string().nullable(),
    }),
    z.object({ status: z.literal('invalid'), error: z.string() }),
    z.object({ status: z.literal('expired'), expiresAt: z.string() }),
    z.object({ status: z.literal('revoked') }),
    z.object({ status: z.literal('loading') }),
    z.object({ status: z.literal('error'), error: z.string() }),
    z.object({ status: z.literal('idle') }),
  ]),
  cachedAt: z.number(),
  domain: z.string(),
})
