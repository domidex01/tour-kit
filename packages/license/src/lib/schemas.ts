import { z } from 'zod'

/**
 * Polar validate response schema — snake_case matching wire format.
 *
 * `.passthrough()` is load-bearing for forward-compat during the Polar →
 * tourkit-dash issuer migration (plan/15c §"additive `tk_tier`"). The
 * tourkit-dash issuer will eventually add fields like `tk_tier`,
 * `tk_issuer_id`, and `tk_claim_status`; v1.x SDKs must parse and ignore
 * them so customers on v1.x continue to function while v2.x readers pick up
 * the new semantics. The companion regression test
 * `schema-no-tier.regression.test.ts` pins that **Polar itself** still does
 * not emit `tier`; unknown additive fields from either issuer are allowed.
 */
export const PolarValidateResponseSchema = z.looseObject({
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
    .looseObject({
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
 *
 * Same `.passthrough()` discipline as the validate response. The tourkit-dash
 * `/v1/license/activate` endpoint is wire-compatible with Polar's
 * `/customer-portal/license-keys/activate` per plan/15e §"byte-equality"; any
 * additive `tk_*` fields land transparently for v1.x readers.
 */
export const PolarActivateResponseSchema = z.looseObject({
  id: z.string(),
  license_key_id: z.string(),
  label: z.string(),
  meta: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  modified_at: z.string().nullable(),
  license_key: z.looseObject({
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
    /**
     * Optional for backward compatibility with v1.0.x cache entries that
     * predate the Polar server-anchor field. Readers parse cached states
     * unchanged; writers added in Phase 8 always set it when Polar emits
     * `last_validated_at`.
     */
    serverValidatedAt: z.number().nullable().optional(),
    renderKey: z.string().optional(),
  }),
  cachedAt: z.number(),
  domain: z.string(),
  keyHash: z.string().optional(),
})
