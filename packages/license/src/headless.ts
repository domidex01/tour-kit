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

// Cloud SDK JWT (Plan 12C)
export { isCloudToken, validateCloudToken, CLOUD_TOKEN_TTL } from './lib/cloud-token'

// Cache
export { readCache, writeCache, clearCache, hasFreshCache } from './lib/cache'

// Domain
export {
  getCurrentDomain,
  isDevEnvironment,
  validateDomainAtRender,
} from './lib/domain'
