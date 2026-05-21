'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import { isDevEnvironment } from '../lib/domain'

export type LicenseDebugPanelProps = {
  className?: string
  /**
   * When false (default), renders null in production. Set true to force-render
   * at consumer's risk — strongly discouraged. Useful only for staging branches
   * where NODE_ENV is misconfigured.
   */
  showInProduction?: boolean
}

function readEnvLicenseKey(): boolean {
  if (typeof process === 'undefined') return false
  // biome-ignore lint/complexity/useLiteralKeys: dynamic env access avoids bundler inlining
  return Boolean(process.env?.['NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY'])
}

/**
 * Drop into a dev or admin route to inspect the current license state. Renders
 * nothing in production by default. Specifically replaces the ambiguous
 * `status: valid, renderKey: dev_bypass` log line that the dashboard-next demo
 * surfaced as confusing — when dev bypass is active, the panel renders the
 * literal copy "🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set,
 * hostname=localhost)" so it is unambiguous what is happening.
 */
export function LicenseDebugPanel({ className, showInProduction = false }: LicenseDebugPanelProps) {
  const ctx = useContext(LicenseContext)
  const inProd = process.env.NODE_ENV === 'production'
  if (inProd && !showInProduction) return null
  if (!ctx) return null

  const { state, trial } = ctx
  const devBypassActive = state.renderKey === 'dev_bypass'
  const localhost = isDevEnvironment()
  const hasEnvKey = readEnvLicenseKey()

  return (
    <section
      className={className}
      data-tourkit-license-debug-panel=""
      aria-label="Tour Kit license debug panel"
    >
      <h2>Tour Kit License — Debug</h2>
      {devBypassActive ? (
        <p data-state="dev-bypass">
          🟢 Dev bypass active ({hasEnvKey ? 'NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set' : 'no env key'},
          hostname={localhost ? 'localhost' : 'production'})
        </p>
      ) : (
        <p data-state={state.status}>
          Status: <strong>{state.status}</strong> · Tier: <strong>{state.tier}</strong> · Domain:{' '}
          <strong>{state.domain ?? 'unset'}</strong>
        </p>
      )}
      {trial ? (
        <p data-trial-active={trial.isTrialing}>
          Trial: <strong>{trial.daysLeft}</strong> days left
        </p>
      ) : null}
    </section>
  )
}
