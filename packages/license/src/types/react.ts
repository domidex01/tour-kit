/**
 * The React-only half of the licence types.
 *
 * These live apart from `./index` for a build reason, not a taste one. tsup's
 * dts pass rolls every type module both entries reach into ONE shared
 * declaration chunk, and `headless.d.ts` imports that chunk — so a
 * `React.ReactNode` declared next to `LicenseState` travelled into the
 * React-free door, where it resolved to nothing. A Vue or Svelte consumer
 * typechecking with `skipLibCheck: false` and no `@types/react` installed got
 * `TS2503: Cannot find namespace 'React'` from inside `node_modules`, which is
 * exactly the promise `@tour-kit/vue` is sold on.
 *
 * `headless-dts-has-no-react.test.ts` walks the built closure and fails if any
 * React reference finds its way back.
 *
 * The import is also explicit now. The old `React.ReactNode` relied on the
 * ambient global namespace, which only resolves when `@types/react` happens to
 * be installed — true for every React consumer and for nobody else.
 *
 * @module types/react
 */
import type { ReactNode } from 'react'
import type { LicenseState } from './index'

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
  children: ReactNode
  onValidate?: (state: LicenseState) => void
  onError?: (error: Error) => void
}

/**
 * License gate props for conditional rendering
 */
export type LicenseGateProps = {
  require: 'pro'
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}
