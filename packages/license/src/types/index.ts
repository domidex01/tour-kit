/**
 * License tier levels
 */
export type LicenseTier = 'free' | 'pro'

/**
 * Activation details for a licensed domain
 */
export type LicenseActivation = {
  id: string
  licenseKeyId: string
  label: string
  createdAt: string
  modifiedAt: string | null
}

/**
 * License error types
 */
export type LicenseError =
  | 'invalid_key'
  | 'network_error'
  | 'parse_error'
  | 'activation_limit_reached'
  | 'domain_mismatch'

/**
 * Flat license state — single source of truth for validity.
 * Never derive validity from `tier` alone — a pro tier with
 * `status: 'expired'` is not valid.
 *
 * `renderKey` is set only when `status === 'valid'`. It is the
 * core anti-bypass mechanism consumed by `<LicenseGate>`.
 */
export type LicenseState = {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'
  tier: LicenseTier
  activations: number
  maxActivations: number
  domain: string | null
  expiresAt: string | null
  validatedAt: number
  renderKey: string | undefined
}

/**
 * Shape stored in localStorage.
 *
 * `keyHash` is set when the cache is written with a license key; readers
 * compare it against the current key's hash and invalidate on mismatch so
 * switching `licenseKey` does not return another key's cached state.
 */
export type LicenseCache = {
  state: LicenseState
  cachedAt: number
  domain: string
  keyHash?: string
}

/**
 * Config passed to validateLicenseKey()
 */
export type LicenseConfig = {
  key: string
  organizationId: string
}

/**
 * Raw Polar validate response (after camelCase transform)
 */
export type PolarValidateResponse = {
  id: string
  organizationId: string
  status: 'granted' | 'revoked' | 'disabled'
  key: string
  limitActivations: number | null
  usage: number
  validations: number
  lastValidatedAt: string
  expiresAt: string | null
  activation: {
    id: string
    licenseKeyId: string
    label: string
    meta: Record<string, unknown>
    createdAt: string
    modifiedAt: string | null
  } | null
}

/**
 * Raw Polar activate response (after camelCase transform)
 */
export type PolarActivateResponse = {
  id: string
  licenseKeyId: string
  label: string
  meta: Record<string, unknown>
  createdAt: string
  modifiedAt: string | null
  licenseKey: {
    id: string
    organizationId: string
    status: 'granted' | 'revoked' | 'disabled'
    limitActivations: number | null
    usage: number
    limitUsage: number | null
    validations: number
    lastValidatedAt: string
    expiresAt: string | null
  }
}

/**
 * License context value (used by React integration).
 *
 * `isGated` / `isLoading` / `gracePeriodActive` are derived from `state` and
 * cache freshness once per validation, so consumers never need to read
 * localStorage on every render.
 */
export type LicenseContextValue = {
  state: LicenseState
  refresh: () => Promise<void>
  isGated: boolean
  isLoading: boolean
  gracePeriodActive: boolean
}

/**
 * License provider props
 */
export type LicenseProviderProps = {
  licenseKey: string
  organizationId?: string
  children: React.ReactNode
  onValidate?: (state: LicenseState) => void
  onError?: (error: Error) => void
}

/**
 * License gate props for conditional rendering
 */
export type LicenseGateProps = {
  require: 'pro'
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

/**
 * License warning banner props
 */
export type LicenseWarningProps = {
  message?: string
  pricingUrl?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}
