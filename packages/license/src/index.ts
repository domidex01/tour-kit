'use client'

// Types
export type {
  LicenseTier,
  LicenseState,
  LicenseError,
  LicenseActivation,
  LicenseCache,
  LicenseConfig,
  LicenseContextValue,
  LicenseProviderProps,
  LicenseGateProps,
  LicenseWarningProps,
  PolarValidateResponse,
  PolarActivateResponse,
} from './types'

// Context and Provider
export { LicenseProvider, LicenseContext, LicenseRenderContext } from './context/license-context'

// Components
export { LicenseGate } from './components/license-gate'
export { LicenseWatermark } from './components/license-watermark'
export { LicenseWarning } from './components/license-warning'
export { ProGate } from './components/pro-gate'
export type { ProGateProps } from './components/pro-gate'

// Hooks
export { useLicense } from './hooks/use-license'
export { useIsPro } from './hooks/use-is-pro'
export { useLicenseGate } from './hooks/use-license-gate'
export type { LicenseGateResult } from './hooks/use-license-gate'

// Headless utilities (re-exported for convenience)
export { validateLicenseKey } from './lib/polar-client'
export { isDevEnvironment, getCurrentDomain } from './lib/domain'
