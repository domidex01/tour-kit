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
  isEphemeralHost,
  validateDomainAtRender,
} from './lib/domain'

// Trial (pure helpers — no React)
export { getDaysLeft } from './lib/trial'
export type { TrialConfig } from './lib/trial'

// DOM gate (React-free) — what `@tour-kit/vue` and `@tour-kit/svelte` mount.
export { startLicenseGate } from './lib/license-gate-dom'
export type { LicenseGateOptions } from './lib/license-gate-dom'
export {
  __resetLicenseWarningForTests,
  mountWatermark,
  warnUnlicensed,
} from './lib/watermark-dom'
