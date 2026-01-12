/**
 * License tier levels
 */
export type LicenseTier = 'free' | 'pro' | 'enterprise'

/**
 * Available premium packages
 */
export type LicensePackage = 'analytics' | 'ai' | 'branching'

/**
 * Available premium features
 */
export type LicenseFeature =
  // Analytics features
  | 'analytics-posthog'
  | 'analytics-mixpanel'
  | 'analytics-amplitude'
  | 'analytics-ga4'
  // AI features
  | 'ai-personalization'
  | 'ai-rag'
  | 'ai-chat'
  // Branching features
  | 'branching-advanced'

/**
 * JWT payload structure for license validation
 */
export interface LicensePayload {
  /** Customer ID */
  sub: string
  /** Issuer (tourkit.dev) */
  iss: string
  /** Issued at timestamp */
  iat: number
  /** Expiry timestamp */
  exp: number
  /** Customer email */
  email: string
  /** License tier */
  tier: LicenseTier
  /** Enabled packages */
  packages: LicensePackage[]
  /** Enabled features */
  features: LicenseFeature[]
  /** Enterprise limits (optional) */
  limits?: LicenseLimits
}

/**
 * Enterprise license limits
 */
export interface LicenseLimits {
  /** Allowed domains for license */
  maxDomains?: string[]
  /** Maximum monthly active users */
  maxMau?: number
  /** Maximum tours */
  maxTours?: number
}

/**
 * License validation result
 */
export interface LicenseValidation {
  /** Is the license valid */
  valid: boolean
  /** Decoded payload if valid */
  payload: LicensePayload | null
  /** Error message if invalid */
  error: LicenseError | null
  /** Time until expiry in milliseconds */
  expiresIn: number | null
}

/**
 * License error types
 */
export type LicenseError =
  | 'invalid_format'
  | 'invalid_signature'
  | 'expired'
  | 'not_yet_valid'
  | 'domain_mismatch'
  | 'missing_key'
  | 'parse_error'

/**
 * License context value
 */
export interface LicenseContextValue {
  /** Current license validation state */
  license: LicenseValidation
  /** Check if a specific feature is enabled */
  hasFeature: (feature: LicenseFeature) => boolean
  /** Check if a specific package is enabled */
  hasPackage: (pkg: LicensePackage) => boolean
  /** Current tier */
  tier: LicenseTier
  /** Is any premium license active */
  isPremium: boolean
  /** Is license loading/validating */
  isLoading: boolean
  /** Refresh license validation */
  refresh: () => Promise<void>
}

/**
 * License provider props
 */
export interface LicenseProviderProps {
  /** License key (tk_...) */
  licenseKey?: string
  /** Public key for validation (PEM format) */
  publicKey: string
  /** Optional domain validation */
  validateDomain?: boolean
  /** Children */
  children: React.ReactNode
  /** Callback when license is validated */
  onValidate?: (result: LicenseValidation) => void
  /** Callback when license expires */
  onExpire?: () => void
}

/**
 * License gate props for conditional rendering
 */
export interface LicenseGateProps {
  /** Required feature(s) - any match enables content */
  feature?: LicenseFeature | LicenseFeature[]
  /** Required package(s) - any match enables content */
  package?: LicensePackage | LicensePackage[]
  /** Required tier (minimum) */
  tier?: LicenseTier
  /** Content to show when licensed */
  children: React.ReactNode
  /** Content to show when not licensed */
  fallback?: React.ReactNode
}

/**
 * License warning banner props
 */
export interface LicenseWarningProps {
  /** Custom message */
  message?: string
  /** Link to pricing page */
  pricingUrl?: string
  /** Whether the warning can be dismissed */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Custom className */
  className?: string
}
