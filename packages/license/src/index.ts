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
  TrialContextValue,
} from './types'

// Context and Provider
export { LicenseProvider, LicenseContext, LicenseRenderContext } from './context/license-context'

// Components
export { LicenseGate } from './components/license-gate'
export { LicenseWatermark } from './components/license-watermark'
export { LicenseWarning } from './components/license-warning'
export { ProGate } from './components/pro-gate'
export type { ProGateProps } from './components/pro-gate'
export { TrialBadge } from './components/trial-badge'
export type { TrialBadgeProps, TrialBadgeRenderProps } from './components/trial-badge'
export { LicenseDebugPanel } from './components/license-debug-panel'
export type { LicenseDebugPanelProps } from './components/license-debug-panel'
export { LicenseTestMode } from './components/license-test-mode'
export type { LicenseTestModeProps } from './components/license-test-mode'

// Hooks
export { useLicense } from './hooks/use-license'
export { useIsPro } from './hooks/use-is-pro'
export { useLicenseGate } from './hooks/use-license-gate'
export type { LicenseGateResult } from './hooks/use-license-gate'

// Headless utilities (re-exported for convenience)
export { validateLicenseKey } from './lib/polar-client'
export type { ValidateOptions } from './lib/polar-client'
export { resolveApiBase, DEFAULT_API_BASE } from './lib/resolve-api-base'
export { isDevEnvironment, getCurrentDomain } from './lib/domain'
export { getDaysLeft } from './lib/trial'
export type { TrialConfig } from './lib/trial'
