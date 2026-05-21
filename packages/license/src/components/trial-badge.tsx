'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'

export type TrialBadgeRenderProps = {
  daysLeft: number
  isTrialing: boolean
  isUrgent: boolean
}

export type TrialBadgeProps = {
  /** Override daysLeft from context. When omitted, reads from `useLicense().trial.daysLeft`. */
  daysLeft?: number
  /** URL the Upgrade CTA links to. Defaults to the @tour-kit/license pricing page. */
  pricingUrl?: string
  /** Custom render — receives the resolved daysLeft + isTrialing/isUrgent flags. */
  children?: (props: TrialBadgeRenderProps) => React.ReactNode
  className?: string
}

const UPGRADE_CTA_THRESHOLD = 3
const DEFAULT_PRICING_URL = 'https://usertourkit.com/pricing'

/**
 * Trial countdown surface. Renders "{n} days left" when above the threshold;
 * renders an Upgrade `<a>` when `daysLeft <= 3`. Renders `null` (and warns
 * once in dev) when no `daysLeft` prop is passed and no `trial` slice exists
 * on the surrounding `<LicenseProvider>`.
 */
export function TrialBadge({
  daysLeft: daysLeftProp,
  pricingUrl,
  children,
  className,
}: TrialBadgeProps) {
  const ctx = useContext(LicenseContext)
  const fromContext = ctx?.trial?.daysLeft
  const resolved = daysLeftProp ?? fromContext

  if (resolved === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      // biome-ignore lint/suspicious/noConsole: dev-only configuration warning
      console.warn(
        '<TrialBadge> rendered without trialDays — pass trialDays to <LicenseProvider> to enable the trial countdown surface.'
      )
    }
    return null
  }

  const isTrialing = resolved > 0
  const isUrgent = resolved <= UPGRADE_CTA_THRESHOLD

  if (children) {
    return <>{children({ daysLeft: resolved, isTrialing, isUrgent })}</>
  }

  if (!isTrialing || isUrgent) {
    return (
      <a
        href={pricingUrl ?? DEFAULT_PRICING_URL}
        className={className}
        data-trial-state="upgrade"
        aria-label="Upgrade — trial ending soon"
      >
        Upgrade
      </a>
    )
  }

  return (
    <span
      className={className}
      data-trial-state="active"
      aria-label={`${resolved} days left in trial`}
    >
      {resolved} days left
    </span>
  )
}
