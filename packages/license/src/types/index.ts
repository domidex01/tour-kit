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
 * Discriminated union -- the core license state machine.
 * Consumers get exhaustive type checking via switch on `status`.
 */
export type LicenseState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; activation: LicenseActivation; expiresAt: string | null }
  | { status: 'invalid'; error: LicenseError }
  | { status: 'expired'; expiresAt: string }
  | { status: 'revoked' }
  | { status: 'error'; error: LicenseError }

/**
 * Shape stored in localStorage
 */
export type LicenseCache = {
  state: LicenseState
  cachedAt: number
  domain: string
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
 * License context value (used by React integration in Phase 2)
 */
export type LicenseContextValue = {
  state: LicenseState
  tier: LicenseTier
  isPro: boolean
  isLoading: boolean
  refresh: () => Promise<void>
}

/**
 * License provider props (used by React integration in Phase 2)
 */
export type LicenseProviderProps = {
  licenseKey: string
  organizationId: string
  children: React.ReactNode
  onValidate?: (state: LicenseState) => void
}

/**
 * License gate props for conditional rendering (Phase 2)
 */
export type LicenseGateProps = {
  require?: 'pro'
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * License warning banner props (Phase 2)
 */
export type LicenseWarningProps = {
  message?: string
  pricingUrl?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}
