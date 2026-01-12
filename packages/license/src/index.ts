'use client'

// Types
export type {
  LicenseTier,
  LicensePackage,
  LicenseFeature,
  LicensePayload,
  LicenseLimits,
  LicenseValidation,
  LicenseError,
  LicenseContextValue,
  LicenseProviderProps,
  LicenseGateProps,
  LicenseWarningProps,
} from './types'

// Utilities
export { validateLicense, validateDomain, getCurrentDomain } from './utils/validate'
