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
  /**
   * Local `Date.now()` captured when validation ran. Used for cache freshness
   * and the elapsed-time delta in `getDaysLeft`. NOT Polar's server timestamp —
   * use `serverValidatedAt` for that. Renaming this would break v1.0.x caches.
   */
  validatedAt: number
  /**
   * Polar `last_validated_at` parsed to Unix ms. Null on dev bypass, unlicensed,
   * invalid, and error states. Used by `getDaysLeft` to anchor trial countdowns
   * to server time and absorb client clock skew.
   */
  serverValidatedAt?: number | null
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
 * Trial context slice. Null on `LicenseContextValue.trial` when no `trialDays`
 * is configured on `<LicenseProvider>`. `isTrialing` is `daysLeft > 0`.
 */
export type TrialContextValue = {
  daysLeft: number
  isTrialing: boolean
}

/**
 * License context value (used by React integration).
 *
 * `isGated` / `isLoading` / `gracePeriodActive` are derived from `state` and
 * cache freshness once per validation, so consumers never need to read
 * localStorage on every render. `trial` is `null` when no `trialDays` is set
 * on `<LicenseProvider>`.
 */
export type LicenseContextValue = {
  state: LicenseState
  refresh: () => Promise<void>
  isGated: boolean
  isLoading: boolean
  gracePeriodActive: boolean
  trial: TrialContextValue | null
}

/**
 * License provider props
 */
export type LicenseProviderProps = {
  licenseKey: string
  organizationId?: string
  /**
   * Override the issuer base URL. Precedence: this prop > the
   * `NEXT_PUBLIC_TOUR_KIT_LICENSE_API_BASE` env var >
   * `TOUR_KIT_LICENSE_API_BASE` env var > Polar default. Load-bearing for the
   * Polar → tourkit-dash issuer migration (plan/15f) — v1.x customers on
   * tourkit-dash set this prop (or the env var) without upgrading the SDK.
   * v2.x customers will get tourkit-dash as the default and only need this
   * prop for self-host or test environments.
   */
  apiBase?: string
  /**
   * Optional trial length in days. When set, `<LicenseProvider>` exposes a
   * `trial` slice on the context and `<TrialBadge>` renders a countdown.
   * Trial state is CLIENT-DERIVED from `issuedAt + trialDays` because Polar's
   * `/v1/customer-portal/license-keys/validate` endpoint does not emit a
   * `tier` field (Phase 0 task 0.6, memory project_polar_api_findings.md #187).
   */
  trialDays?: number
  /**
   * Optional explicit trial start time (Unix ms). Production trials should
   * pass a stable signup/license-issued timestamp. When omitted, the provider
   * falls back to `state.serverValidatedAt ?? state.validatedAt` for demo-only
   * countdowns.
   */
  trialIssuedAt?: number
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
