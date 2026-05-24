// Types
export type {
  LicenseState,
  LicenseError,
  LicenseActivation,
  LicenseCache,
  LicenseConfig,
  PolarValidateResponse,
  PolarActivateResponse,
} from './types'

// Polar client
export {
  validateLicenseKey,
  validateKey,
  activateKey,
  deactivateKey,
  PolarApiError,
  PolarParseError,
} from './lib/polar-client'
export type { ValidateOptions } from './lib/polar-client'

// Issuer URL resolver (plan/15f Polar → tourkit-dash migration seam)
export { resolveApiBase, DEFAULT_API_BASE } from './lib/resolve-api-base'

// Cache
export { readCache, writeCache, clearCache, hasFreshCache } from './lib/cache'

// Domain
export {
  getCurrentDomain,
  isDevEnvironment,
  validateDomainAtRender,
} from './lib/domain'

// Trial (pure helpers — no React)
export { getDaysLeft } from './lib/trial'
export type { TrialConfig } from './lib/trial'
