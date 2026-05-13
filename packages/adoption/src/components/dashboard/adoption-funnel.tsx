'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { type FunnelStepMetrics, calculateFunnelMetrics } from '../../lib/calculate-funnel-metrics'
import type { AdoptionFunnelProps, FunnelStep } from '../../types/feature'

/**
 * Step-by-step adoption funnel with drop-off percentages.
 *
 * Data-first: `<AdoptionFunnel steps={data} />` renders without any provider.
 * Pair with `useFunnelData({ featureIds })` inside `<AdoptionProvider>` for
 * a one-line in-provider integration (current-state semantics; not historical).
 *
 * Accessibility:
 * - The visual chart sits inside a `role="img"` container with an auto-built
 *   `aria-label` summary. Per WAI-ARIA, `role="img"` with an accessible name
 *   suppresses its descendants from the AT tree — so the SR-only `<table>`
 *   mirror is rendered as a SIBLING of the chart (NOT a child), where screen
 *   readers can actually reach it.
 * - Clickable steps stay focusable; Enter + Space both fire `onStepClick`.
 *
 * @example
 * ```tsx
 * <AdoptionFunnel
 *   steps={[
 *     { id: 'view', label: 'Viewed', entered: 100, completed: 60 },
 *     { id: 'click', label: 'Clicked', entered: 60, completed: 30 },
 *   ]}
 * />
 * ```
 */
export const AdoptionFunnel = React.forwardRef<HTMLDivElement, AdoptionFunnelProps>(
  ({ steps, title, onStepClick, emptyState, className, ariaLabel, ...rest }, ref) => {
    const metrics = React.useMemo(() => calculateFunnelMetrics(steps), [steps])

    if (steps.length === 0) {
      return (
        <div ref={ref} className={cn('tk-funnel', className)} {...rest}>
          {emptyState ?? <p className="tk-funnel__empty">No funnel data yet.</p>}
        </div>
      )
    }

    const maxEntered = Math.max(...metrics.map((m) => m.entered), 1)
    const summary = ariaLabel ?? buildAriaLabel(metrics)

    return (
      <div ref={ref} className={cn('tk-funnel', className)} {...rest}>
        <div className="tk-funnel__chart" role="img" aria-label={summary}>
          {title ? <header className="tk-funnel__title">{title}</header> : null}
          <ul className="tk-funnel__list">
            {metrics.map((m, i) => {
              const widthPct = (m.entered / maxEntered) * 100
              const step: FunnelStep = {
                id: m.id,
                label: m.label,
                entered: m.entered,
                completed: m.completed,
              }
              const handleClick = onStepClick ? () => onStepClick(step, i) : undefined
              const handleKeyDown = handleClick
                ? (e: React.KeyboardEvent<HTMLLIElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleClick()
                    }
                  }
                : undefined
              return (
                <li
                  key={m.id}
                  className="tk-funnel__step"
                  role={handleClick ? 'button' : undefined}
                  tabIndex={handleClick ? 0 : undefined}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                >
                  <div className="tk-funnel__label">{m.label}</div>
                  <div
                    className="tk-funnel__bar"
                    style={{ width: `${widthPct}%` }}
                    aria-hidden="true"
                  >
                    <span className="tk-funnel__value">{m.entered}</span>
                  </div>
                  {i > 0 ? (
                    <span className="tk-funnel__retention" aria-hidden="true">
                      {(m.retentionFromPrev * 100).toFixed(1)}%
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
        <FunnelTableForScreenReaders metrics={metrics} />
      </div>
    )
  }
)
AdoptionFunnel.displayName = 'AdoptionFunnel'

function FunnelTableForScreenReaders({
  metrics,
}: {
  metrics: readonly FunnelStepMetrics[]
}): React.ReactElement {
  return (
    <table className="sr-only">
      <caption>Adoption funnel data</caption>
      <thead>
        <tr>
          <th scope="col">Step</th>
          <th scope="col">Entered</th>
          <th scope="col">Completed</th>
          <th scope="col">Retention from previous</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((m) => (
          <tr key={m.id}>
            <th scope="row">{m.label}</th>
            <td>{m.entered}</td>
            <td>{m.completed}</td>
            <td>{(m.retentionFromPrev * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function buildAriaLabel(metrics: readonly FunnelStepMetrics[]): string {
  const enteredSeq = metrics.map((m) => m.entered).join(' → ')
  const first = metrics[0]?.entered ?? 0
  const last = metrics[metrics.length - 1]?.entered ?? 0
  const endToEnd = metrics.length > 1 && first > 0 ? ((last / first) * 100).toFixed(0) : '100'
  return `Adoption funnel: ${enteredSeq}, ${endToEnd}% end-to-end retention`
}
